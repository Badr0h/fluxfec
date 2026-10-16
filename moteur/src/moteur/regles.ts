import type { Compte, Dossier, RoleJournal } from "../config/dossier";
import { formaterEuros, ventilerTtc } from "../montants";
import type { OperationStripe } from "../stripe/parse";
import type { Anomalie, Ecriture, LigneEcriture } from "./types";

export interface ResultatRegle {
  ecritures: Ecriture[];
  anomalies: Anomalie[];
}

type Extra = Pick<LigneEcriture, "cleLettrage" | "montantDevise" | "devise">;

/** Au-delà, plusieurs logiciels de production tronquent le libellé d'écriture. */
export const LONGUEUR_LIBELLE = 50;

/** Montant signé : positif au débit, négatif au crédit. Zéro ne produit pas de ligne. */
function ligne(compte: Compte, montant: number, extra: Extra = {}, aux?: Compte): LigneEcriture | null {
  if (montant === 0) return null;
  return {
    compte: compte.numero,
    libelleCompte: compte.libelle,
    ...(aux ? { compteAux: aux.numero, libelleAux: aux.libelle } : {}),
    debit: montant > 0 ? montant : 0,
    credit: montant < 0 ? -montant : 0,
    ...extra,
  };
}

function ecriture(journal: RoleJournal, op: OperationStripe, libelle: string, lignes: (LigneEcriture | null)[]): Ecriture[] {
  const utiles = lignes.filter((l): l is LigneEcriture => l !== null);
  if (utiles.length === 0) return [];
  return [{ journal, date: op.date, piece: op.sourceId || op.id, libelle: libelle.slice(0, LONGUEUR_LIBELLE), lignes: utiles }];
}

function libelleOperation(prefixe: string, op: OperationStripe): string {
  return op.description ? `${prefixe} ${op.description}` : `${prefixe} ${op.sourceId || op.id}`;
}

function extraDevise(op: OperationStripe): Extra {
  if (!op.deviseClient || op.deviseClient === "EUR" || op.montantClient === undefined) return {};
  return { montantDevise: Math.abs(op.montantClient), devise: op.deviseClient };
}

function cleClient(op: OperationStripe): string {
  return op.sourceId || op.id;
}

/** Journal des ventes : 411 TTC contre 706/707 HT et TVA collectée (ou l'inverse pour un avoir). */
function ecritureVente(op: OperationStripe, d: Dossier, libelle: string): Ecriture[] {
  const { ht, tva } = ventilerTtc(op.brut, d.tauxTvaDefaut);
  const extra = { cleLettrage: cleClient(op), ...extraDevise(op) };
  return ecriture("ventes", op, libelle, [
    ligne(d.comptes.clients, op.brut, extra, d.clientAuxiliaire),
    ligne(d.comptes.ventes, -ht),
    ligne(d.comptes.tvaCollectee, -tva),
  ]);
}

/** Journal Stripe : le net entre sur le 517, les frais en 627, le brut solde le 411. */
function ecritureEncaissement(op: OperationStripe, d: Dossier, libelle: string): Ecriture[] {
  const extra = { cleLettrage: cleClient(op), ...extraDevise(op) };
  return ecriture("stripe", op, libelle, [
    ligne(d.comptes.stripe, op.net),
    ligne(d.comptes.fraisStripe, op.frais),
    ligne(d.comptes.clients, -op.brut, extra, d.clientAuxiliaire),
  ]);
}

function ecritureContrepartie(op: OperationStripe, d: Dossier, contrepartie: Compte, libelle: string): Ecriture[] {
  return ecriture("stripe", op, libelle, [ligne(d.comptes.stripe, op.net), ligne(contrepartie, -op.net)]);
}

function anomalieDevise(op: OperationStripe): Anomalie[] {
  const extra = extraDevise(op);
  if (!extra.devise) return [];
  return [
    {
      niveau: "a_verifier",
      reference: op.sourceId || op.id,
      message: `Paiement en ${extra.devise} (${formaterEuros(op.brut)} convertis) : taux de TVA par défaut appliqué, vérifier le régime (client hors UE ?).`,
    },
  ];
}

export function appliquerRegles(op: OperationStripe, d: Dossier): ResultatRegle {
  const reference = op.sourceId || op.id;

  switch (op.categorie) {
    case "charge":
      return {
        ecritures: [
          ...ecritureVente(op, d, libelleOperation("Vente", op)),
          ...ecritureEncaissement(op, d, libelleOperation("Encaissement", op)),
        ],
        anomalies: anomalieDevise(op),
      };

    case "refund":
      return {
        ecritures: [
          ...ecritureVente(op, d, libelleOperation("Avoir", op)),
          ...ecritureEncaissement(op, d, libelleOperation("Remboursement", op)),
        ],
        anomalies: [
          ...anomalieDevise(op),
          { niveau: "info", reference, message: `Remboursement de ${formaterEuros(-op.brut)} : avoir généré au taux de TVA par défaut.` },
        ],
      };

    case "payout": {
      const arrivee = op.arriveePrevue ? ` arrivée ${op.arriveePrevue.slice(8, 10)}/${op.arriveePrevue.slice(5, 7)}` : "";
      const echec = op.statutVirement === "failed" || op.statutVirement === "canceled";
      return {
        // Le 58 reçoit le montant viré en banque ; d'éventuels frais de virement instantané vont en 627.
        ecritures: ecriture("stripe", op, `Virement Stripe${arrivee} ${reference}`, [
          ligne(d.comptes.stripe, op.net),
          ligne(d.comptes.fraisStripe, op.frais),
          ligne(d.comptes.virementsInternes, -op.brut),
        ]),
        anomalies: echec
          ? [
              {
                niveau: "a_verifier",
                reference,
                message: `Virement au statut « ${op.statutVirement} » : les fonds reviennent sur le solde Stripe (catégorie payout_reversal), vérifier qu'ils figurent bien dans l'export d'activité.`,
              },
            ]
          : [],
      };
    }

    case "fee":
      return {
        ecritures: ecritureContrepartie(op, d, d.comptes.fraisStripe, libelleOperation("Frais Stripe", op)),
        anomalies: [],
      };

    case "dispute":
    case "dispute_reversal": {
      const gagne = op.categorie === "dispute_reversal";
      return {
        ecritures: ecritureEncaissement(op, d, libelleOperation(gagne ? "Litige gagné" : "Litige", op)),
        anomalies: [
          {
            niveau: "a_verifier",
            reference,
            message: gagne
              ? `Litige gagné : ${formaterEuros(op.brut)} restitués, le 411 est relettré avec la contestation.`
              : `Litige de ${formaterEuros(-op.brut)} (frais ${formaterEuros(op.frais)}) : créance réouverte au 411, à solder par un avoir ou une perte si le litige est perdu.`,
          },
        ],
      };
    }

    default:
      return {
        ecritures: ecritureContrepartie(op, d, d.comptes.attente, libelleOperation(`Stripe ${op.categorie || "inconnu"}`, op)),
        anomalies: [
          {
            niveau: "a_verifier",
            reference,
            message: `Catégorie Stripe « ${op.categorie || "vide"} » non reconnue : ${formaterEuros(op.net)} imputés au compte d'attente ${d.comptes.attente.numero}.`,
          },
        ],
      };
  }
}
