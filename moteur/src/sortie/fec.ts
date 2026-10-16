import iconv from "iconv-lite";
import type { Dossier } from "../config/dossier";
import { formaterMontantFec } from "../montants";
import type { Ecriture } from "../moteur/types";

export const COLONNES_FEC = [
  "JournalCode",
  "JournalLib",
  "EcritureNum",
  "EcritureDate",
  "CompteNum",
  "CompteLib",
  "CompAuxNum",
  "CompAuxLib",
  "PieceRef",
  "PieceDate",
  "EcritureLib",
  "Debit",
  "Credit",
  "EcritureLet",
  "DateLet",
  "ValidDate",
  "Montantdevise",
  "Idevise",
] as const;

/** Sage limite les intitulés de compte à 35 caractères. */
export const LONGUEUR_INTITULE = 35;

export function dateFec(iso: string): string {
  return iso.replaceAll("-", "");
}

const REMPLACEMENTS: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201A": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u201E": '"',
  "\u2013": "-",
  "\u2014": "-",
  "\u2026": "...",
  "\u00A0": " ",
  "\u202F": " ",
  "Ł": "L",
  "ł": "l",
  "Đ": "D",
  "đ": "d",
  "|": "/",
};

const cacheLatin9 = new Map<string, boolean>();
function estLatin9(c: string): boolean {
  let ok = cacheLatin9.get(c);
  if (ok === undefined) {
    ok = iconv.decode(iconv.encode(c, "ISO-8859-15"), "ISO-8859-15") === c;
    cacheLatin9.set(c, ok);
  }
  return ok;
}

/**
 * Rend un texte sûr pour un champ FEC : une seule ligne, sans tabulation ni « | »,
 * et uniquement des caractères ISO-8859-15 (les autres sont translittérés ou retirés).
 */
export function texteFec(v: string | undefined, longueurMax?: number): string {
  let sortie = "";
  for (const c of (v ?? "").normalize("NFC")) {
    const r = REMPLACEMENTS[c];
    if (r !== undefined) sortie += r;
    else if (c < " " || c === "\u007F") sortie += " ";
    else if (estLatin9(c)) sortie += c;
    else {
      const sansAccent = c.normalize("NFD").replace(/\p{M}/gu, "");
      if (sansAccent && [...sansAccent].every(estLatin9)) sortie += sansAccent;
    }
  }
  sortie = sortie.replace(/\s+/g, " ").trim();
  return longueurMax ? sortie.slice(0, longueurMax).trimEnd() : sortie;
}

export function nomFichierFec(dossier: Dossier): string {
  return `${dossier.siren}FEC${dateFec(dossier.clotureExercice)}.txt`;
}

/** Montant en devise signé : positif au débit, négatif au crédit (BOI-CF-IOR-60-40-20). */
function montantDeviseSigne(montant: number | undefined, debit: number): string {
  if (montant === undefined) return "";
  return formaterMontantFec(debit > 0 ? montant : -montant);
}

/** Les écritures doivent être triées et numérotées (voir numeroter). */
export function genererFec(ecritures: Ecriture[], dossier: Dossier): { nomFichier: string; texte: string; octets: Buffer } {
  const lignes: string[] = [COLONNES_FEC.join("\t")];
  for (const e of ecritures) {
    if (!e.numero) throw new Error(`Écriture ${e.piece} non numérotée`);
    const journal = dossier.journaux[e.journal];
    for (const l of e.lignes) {
      lignes.push(
        [
          texteFec(journal.code),
          texteFec(journal.libelle, LONGUEUR_INTITULE),
          texteFec(e.numero),
          dateFec(e.date),
          texteFec(l.compte),
          texteFec(l.libelleCompte, LONGUEUR_INTITULE),
          texteFec(l.compteAux),
          texteFec(l.libelleAux, LONGUEUR_INTITULE),
          texteFec(e.piece),
          dateFec(e.date),
          texteFec(e.libelle) || texteFec(e.piece),
          formaterMontantFec(l.debit),
          formaterMontantFec(l.credit),
          texteFec(l.lettrage),
          l.dateLettrage ? dateFec(l.dateLettrage) : "",
          dateFec(e.date),
          montantDeviseSigne(l.montantDevise, l.debit),
          l.montantDevise !== undefined ? texteFec(l.devise) : "",
        ].join("\t"),
      );
    }
  }
  const contenu = lignes.join("\r\n") + "\r\n";
  return { nomFichier: nomFichierFec(dossier), texte: contenu, octets: iconv.encode(contenu, "ISO-8859-15") };
}
