import iconv from "iconv-lite";
import { COLONNES_FEC } from "./fec";

/**
 * Relit un FEC produit (octets bruts) et applique les règles de l'article A47 A-1 du LPF,
 * celles contrôlées par Test Compta Demat, et les exigences d'import relevées chez
 * ACD, Cegid, MyUnisoft et Sage. Indépendant du générateur : il ne connaît que le fichier.
 */

export interface ProblemeFec {
  regle: string;
  ligne?: number;
  detail: string;
}

export interface ResultatVerificationFec {
  ok: boolean;
  lignes: number;
  ecritures: number;
  problemes: ProblemeFec[];
}

const I = Object.fromEntries(COLONNES_FEC.map((c, i) => [c, i])) as Record<(typeof COLONNES_FEC)[number], number>;
const MONTANT = /^-?\d+,\d{2}$/;
const OBLIGATOIRES = [
  "JournalCode",
  "JournalLib",
  "EcritureNum",
  "EcritureDate",
  "CompteNum",
  "CompteLib",
  "PieceRef",
  "PieceDate",
  "EcritureLib",
  "Debit",
  "Credit",
  "ValidDate",
] as const;

function dateValide(s: string): boolean {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

function centimes(s: string): number {
  const negatif = s.startsWith("-");
  const [e, d] = s.replace("-", "").split(",");
  const v = Number(e) * 100 + Number(d);
  return negatif ? -v : v;
}

export function verifierFec(
  octets: Buffer,
  nomFichier: string,
  exercice?: { ouverture: string; cloture: string },
): ResultatVerificationFec {
  const problemes: ProblemeFec[] = [];
  const signaler = (regle: string, detail: string, ligne?: number) => {
    if (problemes.length < 200) problemes.push({ regle, detail, ...(ligne ? { ligne } : {}) });
  };

  const nom = /^(\d{9})FEC(\d{8})(_\d+)?(\.txt)?$/.exec(nomFichier);
  if (!nom) signaler("Nom du fichier", `« ${nomFichier} » ne suit pas SirenFECAAAAMMJJ`);
  else if (!dateValide(nom[2] ?? "")) signaler("Nom du fichier", `date de clôture invalide dans « ${nomFichier} »`);

  if (octets[0] === 0xef && octets[1] === 0xbb && octets[2] === 0xbf) {
    signaler("Encodage", "le fichier commence par un BOM UTF-8, refusé par plusieurs logiciels");
  }
  const texte = iconv.decode(octets, "ISO-8859-15");
  if (/[\u00C3\u00C2][\u0080-\u00BF]/.test(texte)) {
    signaler("Encodage", "texte UTF-8 détecté dans un fichier déclaré ISO-8859-15 (accents illisibles)");
  }

  const lignesBrutes = texte.split(/\r\n|\n|\r/);
  if (lignesBrutes[lignesBrutes.length - 1] === "") lignesBrutes.pop();
  const [entete, ...donnees] = lignesBrutes;
  if (entete === undefined) {
    signaler("Structure", "fichier vide");
    return { ok: false, lignes: 0, ecritures: 0, problemes };
  }
  if (entete.includes("|")) signaler("Séparateur", "le séparateur doit être la tabulation (le pipe n'est pas utilisé ici)");
  if (entete !== COLONNES_FEC.join("\t")) signaler("En-tête", "la première ligne doit contenir les 18 noms de champs dans l'ordre", 1);

  const soldeEcriture = new Map<string, number>();
  const soldeJourJournal = new Map<string, number>();
  const soldeLettrage = new Map<string, number>();
  const ordreEcritures: string[] = [];
  const dernierParJournal = new Map<string, { num: string; date: string }>();
  let validDatePrecedente = "";

  donnees.forEach((ligne, i) => {
    const n = i + 2;
    if (ligne.includes("|")) signaler("Séparateur", "caractère « | » dans un champ texte (Test Compta Demat refuse le fichier)", n);
    const c = ligne.split("\t");
    if (c.length !== 18) {
      signaler("Structure", `${c.length} champs au lieu de 18`, n);
      return;
    }
    const v = (k: keyof typeof I) => c[I[k]] ?? "";

    for (const k of OBLIGATOIRES) if (!v(k).trim()) signaler("Donnée absente", `${k} vide`, n);
    for (const k of ["EcritureDate", "PieceDate", "ValidDate"] as const) {
      if (v(k) && !dateValide(v(k))) signaler("Date", `${k} « ${v(k)} » n'est pas une date AAAAMMJJ`, n);
    }
    if (v("DateLet") && !dateValide(v("DateLet"))) signaler("Date", `DateLet « ${v("DateLet")} » invalide`, n);
    if (!!v("EcritureLet") !== !!v("DateLet")) signaler("Lettrage", "EcritureLet et DateLet doivent être remplis ensemble", n);

    for (const k of ["Debit", "Credit"] as const) {
      if (!MONTANT.test(v(k))) signaler("Montant", `${k} « ${v(k)} » : virgule décimale, 2 décimales, sans séparateur de milliers`, n);
    }
    if (v("Montantdevise") && !MONTANT.test(v("Montantdevise"))) signaler("Montant", `Montantdevise « ${v("Montantdevise")} » mal formé`, n);
    if (!!v("Montantdevise") !== !!v("Idevise")) signaler("Devise", "Montantdevise et Idevise doivent être remplis ensemble", n);

    const debit = MONTANT.test(v("Debit")) ? centimes(v("Debit")) : 0;
    const credit = MONTANT.test(v("Credit")) ? centimes(v("Credit")) : 0;
    if (debit < 0 || credit < 0) signaler("Montant", "débit et crédit doivent être positifs", n);
    if (debit !== 0 && credit !== 0) signaler("Montant", "une ligne ne peut porter à la fois un débit et un crédit", n);
    if (debit === 0 && credit === 0) signaler("Montant", "ligne à zéro", n);
    if (v("Montantdevise") && MONTANT.test(v("Montantdevise"))) {
      const md = centimes(v("Montantdevise"));
      if ((debit > 0 && md < 0) || (credit > 0 && md > 0)) signaler("Devise", "Montantdevise doit être signé comme la ligne (négatif au crédit)", n);
    }

    const compte = v("CompteNum");
    if (!/^[1-8]\d{2}/.test(compte)) signaler("Compte", `CompteNum « ${compte} » : les 3 premiers caractères doivent être des chiffres du PCG (classe 1 à 8)`, n);
    if (!/^[0-9A-Z]{1,13}$/.test(compte)) signaler("Compte", `CompteNum « ${compte} » : 13 caractères max, sans accent ni caractère spécial`, n);
    const tiers = /^4[01]/.test(compte);
    if (tiers && (!v("CompAuxNum") || !v("CompAuxLib"))) signaler("Tiers", `compte ${compte} sans compte auxiliaire (rejeté par ACD, Sage, Cegid)`, n);
    if (!tiers && (v("CompAuxNum") || v("CompAuxLib"))) signaler("Tiers", `compte auxiliaire sur un compte ${compte} qui n'est pas un compte de tiers`, n);
    if (v("CompAuxNum") && !/^[0-9A-Z]{1,13}$/.test(v("CompAuxNum"))) signaler("Tiers", `CompAuxNum « ${v("CompAuxNum")} » : 13 caractères max, sans accent`, n);
    if (!/^[0-9A-Z]{1,3}$/.test(v("JournalCode"))) signaler("Journal", `JournalCode « ${v("JournalCode")} » : 1 à 3 caractères sans accent`, n);
    for (const k of ["JournalLib", "CompteLib", "CompAuxLib"] as const) {
      if (v(k).length > 35) signaler("Longueur", `${k} dépasse 35 caractères (limite Sage)`, n);
    }

    if (exercice) {
      const ed = v("EcritureDate");
      const deb = exercice.ouverture.replaceAll("-", "");
      const fin = exercice.cloture.replaceAll("-", "");
      if (ed && (ed < deb || ed > fin)) signaler("Exercice", `écriture du ${ed} hors exercice ${deb}-${fin} (MyUnisoft et Sage refusent l'import)`, n);
    }
    if (nom?.[2] && v("EcritureDate") > nom[2]) signaler("Exercice", "écriture postérieure à la date de clôture du nom de fichier", n);

    const vd = v("ValidDate");
    if (vd < validDatePrecedente) signaler("Ordre", "les écritures doivent être classées par ordre chronologique de validation", n);
    validDatePrecedente = vd;

    const num = v("EcritureNum");
    const cleEcriture = `${v("JournalCode")}|${num}`;
    if (!soldeEcriture.has(cleEcriture)) {
      if (ordreEcritures.includes(cleEcriture)) signaler("Numérotation", `écriture ${num} découpée en plusieurs blocs`, n);
      ordreEcritures.push(cleEcriture);
      const prec = dernierParJournal.get(v("JournalCode"));
      if (prec) {
        const a = Number(/(\d+)$/.exec(prec.num)?.[1] ?? NaN);
        const b = Number(/(\d+)$/.exec(num)?.[1] ?? NaN);
        if (!(b === a + 1)) signaler("Numérotation", `rupture de séquence dans le journal ${v("JournalCode")} : ${prec.num} puis ${num}`, n);
        if (v("EcritureDate") < prec.date) signaler("Numérotation", `numéro ${num} antérieur en date au précédent`, n);
      }
      dernierParJournal.set(v("JournalCode"), { num, date: v("EcritureDate") });
    }
    soldeEcriture.set(cleEcriture, (soldeEcriture.get(cleEcriture) ?? 0) + debit - credit);
    const cleJour = `${v("JournalCode")}|${v("EcritureDate")}`;
    soldeJourJournal.set(cleJour, (soldeJourJournal.get(cleJour) ?? 0) + debit - credit);
    if (v("EcritureLet")) {
      const cleLet = `${compte}|${v("CompAuxNum")}|${v("EcritureLet")}`;
      soldeLettrage.set(cleLet, (soldeLettrage.get(cleLet) ?? 0) + debit - credit);
    }
  });

  for (const [cle, s] of soldeEcriture) if (s !== 0) signaler("Équilibre", `écriture ${cle.replace("|", " ")} déséquilibrée`);
  for (const [cle, s] of soldeJourJournal) if (s !== 0) signaler("Équilibre", `journal ${cle.replace("|", " du ")} déséquilibré (MyUnisoft exige l'équilibre par jour et par journal)`);
  for (const [cle, s] of soldeLettrage) if (s !== 0) signaler("Lettrage", `lettrage ${cle.replaceAll("|", " ")} non soldé`);

  return { ok: problemes.length === 0, lignes: donnees.length, ecritures: soldeEcriture.size, problemes };
}
