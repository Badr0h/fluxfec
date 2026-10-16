import type { RoleJournal } from "../config/dossier";

export interface LigneEcriture {
  compte: string;
  libelleCompte: string;
  compteAux?: string;
  libelleAux?: string;
  /** Centimes, positif ou nul. */
  debit: number;
  /** Centimes, positif ou nul. */
  credit: number;
  /** Les lignes 411 qui partagent cette clé et se soldent sont lettrées ensemble. */
  cleLettrage?: string;
  lettrage?: string;
  dateLettrage?: string;
  /** Centimes, non signé ; le sens est donné par débit/crédit. */
  montantDevise?: number;
  devise?: string;
}

export interface Ecriture {
  journal: RoleJournal;
  /** AAAA-MM-JJ */
  date: string;
  piece: string;
  libelle: string;
  lignes: LigneEcriture[];
  numero?: string;
}

export type NiveauAnomalie = "info" | "a_verifier" | "bloquante";

export interface Anomalie {
  niveau: NiveauAnomalie;
  reference: string;
  message: string;
}
