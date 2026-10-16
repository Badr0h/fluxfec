import type { Dossier, RoleJournal } from "../config/dossier";
import { parserCsvStripe, type OperationStripe, type TypeExport } from "../stripe/parse";
import { controler, soldeCompte, type ResultatControles } from "./controles";
import { lettrer } from "./lettrage";
import { appliquerRegles } from "./regles";
import type { Anomalie, Ecriture } from "./types";

export interface Synthese {
  nbOperations: number;
  nbVentes: number;
  chiffreAffairesHt: number;
  tvaCollectee: number;
  fraisStripe: number;
  virements: number;
}

export interface ResultatTraitement {
  dossier: Dossier;
  periode: { debut: string; fin: string };
  exports: TypeExport[];
  operations: OperationStripe[];
  ecritures: Ecriture[];
  anomalies: Anomalie[];
  controles: ResultatControles;
  synthese: Synthese;
}

const ORDRE_JOURNAUX: Record<RoleJournal, number> = { ventes: 0, stripe: 1 };

const LIBELLE_COLONNE: Record<string, string> = {
  source: "source_id",
  montant_client: "customer_facing_amount",
  devise_client: "customer_facing_currency",
};

/** Trie par date puis journal (tri stable) et numérote en continu dans chaque journal. */
export function numeroter(ecritures: Ecriture[], dossier: Dossier): Ecriture[] {
  const triees = ecritures
    .map((e, i) => ({ e, i }))
    .sort((a, b) => a.e.date.localeCompare(b.e.date) || ORDRE_JOURNAUX[a.e.journal] - ORDRE_JOURNAUX[b.e.journal] || a.i - b.i)
    .map(({ e }) => e);
  const compteurs: Record<RoleJournal, number> = { ventes: 0, stripe: 0 };
  return triees.map((e) => ({
    ...e,
    numero: `${dossier.journaux[e.journal].code}${String(++compteurs[e.journal]).padStart(6, "0")}`,
  }));
}

/** Accepte un ou plusieurs exports Stripe (activité et virements) du même compte. */
export function traiterCsvStripe(csv: string | string[], dossier: Dossier): ResultatTraitement {
  const fichiers = Array.isArray(csv) ? csv : [csv];
  const anomalies: Anomalie[] = [];
  const operations: OperationStripe[] = [];
  const exports: TypeExport[] = [];
  const vus = new Set<string>();

  for (const contenu of fichiers) {
    const lecture = parserCsvStripe(contenu);
    exports.push(lecture.type);
    anomalies.push(...lecture.anomalies);
    if (lecture.colonnesAbsentes.length > 0) {
      anomalies.push({
        niveau: "info",
        reference: "export",
        message: `Colonnes absentes de l'export d'activité : ${lecture.colonnesAbsentes.map((c) => LIBELLE_COLONNE[c] ?? c).join(", ")}. Ajoutez-les dans Stripe (bouton Colonnes) pour lettrer remboursements et litiges et gérer les devises.`,
      });
    }
    let doublons = 0;
    for (const op of lecture.operations) {
      if (vus.has(op.id)) {
        doublons++;
        continue;
      }
      vus.add(op.id);
      operations.push(op);
    }
    if (doublons > 0) {
      anomalies.push({ niveau: "info", reference: "export", message: `${doublons} opération(s) présente(s) dans plusieurs fichiers, comptée(s) une seule fois.` });
    }
  }

  if (!operations.some((o) => o.categorie === "payout")) {
    anomalies.push({
      niveau: "info",
      reference: "export",
      message: "Aucun virement vers la banque : le rapport d'activité Stripe ne contient pas les virements. Ajoutez l'export « Payouts » (Itemized) pour solder le compte Stripe.",
    });
  }

  const brutes: Ecriture[] = [];
  for (const op of operations) {
    const r = appliquerRegles(op, dossier);
    brutes.push(...r.ecritures);
    anomalies.push(...r.anomalies);
  }

  const lettrage = lettrer(brutes);
  const ecritures = numeroter(brutes, dossier);
  const controles = controler(ecritures, operations, dossier, lettrage);

  const dates = operations.map((o) => o.date).sort();
  const c = dossier.comptes;
  return {
    dossier,
    periode: { debut: dates[0] ?? "", fin: dates[dates.length - 1] ?? "" },
    exports,
    operations,
    ecritures,
    anomalies,
    controles,
    synthese: {
      nbOperations: operations.length,
      nbVentes: operations.filter((o) => o.categorie === "charge").length,
      chiffreAffairesHt: -soldeCompte(ecritures, c.ventes.numero),
      tvaCollectee: -soldeCompte(ecritures, c.tvaCollectee.numero),
      fraisStripe: soldeCompte(ecritures, c.fraisStripe.numero),
      virements: controles.solde58,
    },
  };
}
