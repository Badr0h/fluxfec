import type { Dossier } from "../config/dossier";
import { formaterEuros } from "../montants";
import type { OperationStripe } from "../stripe/parse";
import type { Ecriture } from "./types";

export interface Controle {
  nom: string;
  ok: boolean;
  bloquant: boolean;
  detail: string;
}

export interface ResultatControles {
  controles: Controle[];
  totalDebit: number;
  totalCredit: number;
  solde517: number;
  sommeNetStripe: number;
  solde58: number;
  ok: boolean;
}

export function soldeCompte(ecritures: Ecriture[], compte: string): number {
  let solde = 0;
  for (const e of ecritures) for (const l of e.lignes) if (l.compte === compte) solde += l.debit - l.credit;
  return solde;
}

export function controler(
  ecritures: Ecriture[],
  operations: OperationStripe[],
  dossier: Dossier,
  lettrage: { groupesLettres: number; lignesNonLettrees: number },
): ResultatControles {
  const controles: Controle[] = [];

  const desequilibrees = ecritures.filter((e) => {
    const d = e.lignes.reduce((s, l) => s + l.debit, 0);
    const c = e.lignes.reduce((s, l) => s + l.credit, 0);
    return d !== c;
  });
  controles.push({
    nom: "Chaque écriture est équilibrée",
    ok: desequilibrees.length === 0,
    bloquant: true,
    detail:
      desequilibrees.length === 0
        ? `${ecritures.length} écritures, débit = crédit pour chacune`
        : `Déséquilibrées : ${desequilibrees.map((e) => e.piece).join(", ")}`,
  });

  let totalDebit = 0;
  let totalCredit = 0;
  for (const e of ecritures) for (const l of e.lignes) {
    totalDebit += l.debit;
    totalCredit += l.credit;
  }
  controles.push({
    nom: "Fichier équilibré",
    ok: totalDebit === totalCredit,
    bloquant: true,
    detail: `Débit ${formaterEuros(totalDebit)}, crédit ${formaterEuros(totalCredit)}`,
  });

  const horsExercice = ecritures.filter((e) => e.date < dossier.ouvertureExercice || e.date > dossier.clotureExercice);
  controles.push({
    nom: "Toutes les écritures sont dans l'exercice",
    ok: horsExercice.length === 0,
    bloquant: true,
    detail:
      horsExercice.length === 0
        ? `Exercice du ${dossier.ouvertureExercice} au ${dossier.clotureExercice}`
        : `${horsExercice.length} écriture(s) hors de l'exercice ${dossier.ouvertureExercice} → ${dossier.clotureExercice} (ex. ${horsExercice[0]?.date}) : corriger les dates d'exercice du dossier ou la période exportée`,
  });

  const compte517 = dossier.comptes.stripe.numero;
  const solde517 = soldeCompte(ecritures, compte517);
  const sommeNetStripe = operations.reduce((s, o) => s + o.net, 0);
  controles.push({
    nom: `Solde du ${compte517} = variation du solde Stripe`,
    ok: solde517 === sommeNetStripe,
    bloquant: true,
    detail: `Compte ${compte517} : ${formaterEuros(solde517)} ; somme des nets Stripe : ${formaterEuros(sommeNetStripe)}`,
  });

  const solde58 = soldeCompte(ecritures, dossier.comptes.virementsInternes.numero);
  controles.push({
    nom: "Virements à rapprocher de la banque",
    ok: true,
    bloquant: false,
    detail: `${formaterEuros(solde58)} au ${dossier.comptes.virementsInternes.numero}, à lettrer avec les crédits « STRIPE » du relevé bancaire`,
  });

  controles.push({
    nom: `Lettrage automatique du ${dossier.comptes.clients.numero}`,
    ok: true,
    bloquant: false,
    detail: `${lettrage.groupesLettres} ventes ou avoirs lettrés, ${lettrage.lignesNonLettrees} ligne(s) ouverte(s)`,
  });

  return {
    controles,
    totalDebit,
    totalCredit,
    solde517,
    sommeNetStripe,
    solde58,
    ok: controles.every((c) => c.ok || !c.bloquant),
  };
}
