export const ROLES_COMPTES = [
  "clients",
  "ventes",
  "tvaCollectee",
  "stripe",
  "virementsInternes",
  "fraisStripe",
  "attente",
] as const;

export type RoleCompte = (typeof ROLES_COMPTES)[number];

export interface Compte {
  numero: string;
  libelle: string;
}

export interface Journal {
  code: string;
  libelle: string;
}

export type RoleJournal = "ventes" | "stripe";

export interface Dossier {
  siren: string;
  raisonSociale: string;
  /** AAAA-MM-JJ ; par défaut, 12 mois avant la clôture. */
  ouvertureExercice: string;
  /** AAAA-MM-JJ, utilisée pour nommer le FEC. */
  clotureExercice: string;
  journaux: Record<RoleJournal, Journal>;
  comptes: Record<RoleCompte, Compte>;
  clientAuxiliaire?: Compte;
  tauxTvaDefaut: number;
  detail: "par_operation";
}

export type ResultatValidation =
  | { ok: true; dossier: Dossier }
  | { ok: false; erreurs: string[] };

function estObjet(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function lireChaine(obj: Record<string, unknown>, cle: string, chemin: string, erreurs: string[]): string {
  const v = obj[cle];
  if (typeof v !== "string" || v.trim() === "") {
    erreurs.push(`${chemin}${cle} : texte obligatoire`);
    return "";
  }
  return v.trim();
}

/** Les logiciels de production refusent les accents et les caractères spéciaux dans les codes. */
const CODE = /^[0-9A-Z]+$/;

function lireCompte(x: unknown, chemin: string, erreurs: string[], general: boolean): Compte {
  if (!estObjet(x)) {
    erreurs.push(`${chemin} : objet { numero, libelle } attendu`);
    return { numero: "", libelle: "" };
  }
  const numero = lireChaine(x, "numero", `${chemin}.`, erreurs);
  const libelle = lireChaine(x, "libelle", `${chemin}.`, erreurs);
  if (!numero) return { numero, libelle };
  if (!CODE.test(numero)) {
    erreurs.push(`${chemin}.numero : chiffres et majuscules sans accent uniquement ("${numero}")`);
  } else if (numero.length > 13) {
    erreurs.push(`${chemin}.numero : 13 caractères maximum ("${numero}")`);
  } else if (general && !/^[1-8]\d{2}/.test(numero)) {
    erreurs.push(`${chemin}.numero : doit commencer par 3 chiffres du plan comptable, classe 1 à 8 ("${numero}")`);
  } else if (general && numero.length < 6) {
    erreurs.push(`${chemin}.numero : 6 caractères minimum, un compte plus court est traité comme un compte de regroupement ("${numero}")`);
  }
  return { numero, libelle };
}

function lireDate(obj: Record<string, unknown>, cle: string, erreurs: string[], obligatoire: boolean): string | undefined {
  if (!obligatoire && obj[cle] === undefined) return undefined;
  const v = lireChaine(obj, cle, "", erreurs);
  if (!v) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  const d = m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
  if (!m || !d || d.getUTCDate() !== Number(m[3])) {
    erreurs.push(`${cle} : date AAAA-MM-JJ valide attendue ("${v}")`);
    return undefined;
  }
  return v;
}

function unAnAvant(cloture: string): string {
  const [a, m, j] = cloture.split("-").map(Number) as [number, number, number];
  const d = new Date(Date.UTC(a - 1, m - 1, j + 1));
  return d.toISOString().slice(0, 10);
}

export function validerDossier(brut: unknown): ResultatValidation {
  const erreurs: string[] = [];
  if (!estObjet(brut)) return { ok: false, erreurs: ["Le paramétrage doit être un objet JSON"] };

  const siren = lireChaine(brut, "siren", "", erreurs);
  if (siren && !/^\d{9}$/.test(siren)) erreurs.push(`siren : 9 chiffres attendus ("${siren}")`);

  const raisonSociale = lireChaine(brut, "raisonSociale", "", erreurs);

  const clotureExercice = lireDate(brut, "clotureExercice", erreurs, true) ?? "";
  const ouvertureLue = lireDate(brut, "ouvertureExercice", erreurs, false);
  const ouvertureExercice = ouvertureLue ?? (clotureExercice ? unAnAvant(clotureExercice) : "");
  if (ouvertureExercice && clotureExercice && ouvertureExercice >= clotureExercice) {
    erreurs.push("ouvertureExercice : doit précéder clotureExercice");
  }

  const journauxBruts = brut["journaux"];
  const journaux = {} as Record<RoleJournal, Journal>;
  if (!estObjet(journauxBruts)) {
    erreurs.push("journaux : objet { ventes, stripe } attendu");
  } else {
    for (const role of ["ventes", "stripe"] as const) {
      const j = journauxBruts[role];
      if (!estObjet(j)) {
        erreurs.push(`journaux.${role} : objet { code, libelle } attendu`);
        continue;
      }
      const code = lireChaine(j, "code", `journaux.${role}.`, erreurs);
      if (code && (!CODE.test(code) || code.length > 3)) {
        erreurs.push(`journaux.${role}.code : 1 à 3 chiffres ou majuscules sans accent ("${code}")`);
      }
      journaux[role] = { code, libelle: lireChaine(j, "libelle", `journaux.${role}.`, erreurs) };
    }
    if (journaux.ventes?.code && journaux.ventes.code === journaux.stripe?.code) {
      erreurs.push("journaux : les codes des journaux ventes et stripe doivent être différents");
    }
  }

  const comptesBruts = brut["comptes"];
  const comptes = {} as Record<RoleCompte, Compte>;
  if (!estObjet(comptesBruts)) {
    erreurs.push(`comptes : objet attendu avec ${ROLES_COMPTES.join(", ")}`);
  } else {
    for (const role of ROLES_COMPTES) {
      comptes[role] = lireCompte(comptesBruts[role], `comptes.${role}`, erreurs, true);
    }
    const distincts: RoleCompte[] = ["clients", "stripe", "virementsInternes", "attente", "ventes", "tvaCollectee", "fraisStripe"];
    const vus = new Map<string, RoleCompte>();
    for (const role of distincts) {
      const n = comptes[role]?.numero;
      if (!n) continue;
      const deja = vus.get(n);
      if (deja) erreurs.push(`comptes.${role} : même numéro que comptes.${deja} (${n}), les contrôles deviendraient faux`);
      vus.set(n, role);
    }
  }

  const clientAuxiliaire =
    brut["clientAuxiliaire"] === undefined
      ? undefined
      : lireCompte(brut["clientAuxiliaire"], "clientAuxiliaire", erreurs, false);
  if (!clientAuxiliaire && /^4[01]/.test(comptes.clients?.numero ?? "")) {
    erreurs.push(
      "clientAuxiliaire : obligatoire quand le compte clients est un 40x/41x (ACD, Sage et Cegid rejettent un compte de tiers sans auxiliaire)",
    );
  }

  const tauxTvaDefaut = brut["tauxTvaDefaut"];
  if (typeof tauxTvaDefaut !== "number" || tauxTvaDefaut < 0 || tauxTvaDefaut > 100) {
    erreurs.push("tauxTvaDefaut : nombre entre 0 et 100 attendu");
  }

  const detail = brut["detail"] ?? "par_operation";
  if (detail !== "par_operation") erreurs.push(`detail : seule la valeur "par_operation" est gérée ("${String(detail)}")`);

  if (erreurs.length > 0) return { ok: false, erreurs };

  return {
    ok: true,
    dossier: {
      siren,
      raisonSociale,
      ouvertureExercice,
      clotureExercice,
      journaux,
      comptes,
      ...(clientAuxiliaire ? { clientAuxiliaire } : {}),
      tauxTvaDefaut: tauxTvaDefaut as number,
      detail: "par_operation",
    },
  };
}
