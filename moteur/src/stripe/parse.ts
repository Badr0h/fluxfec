import { parse } from "csv-parse/sync";
import { parserMontant } from "../montants";
import type { Anomalie } from "../moteur/types";

/** Un mouvement du solde Stripe, quel que soit l'export d'origine. */
export interface OperationStripe {
  id: string;
  /** AAAA-MM-JJ */
  date: string;
  categorie: string;
  brut: number;
  frais: number;
  net: number;
  devise: string;
  montantClient?: number;
  deviseClient?: string;
  sourceId: string;
  description: string;
  virementId: string;
  /** Virements uniquement. */
  statutVirement?: string;
  arriveePrevue?: string;
}

export type TypeExport = "activite" | "virements" | "transactions";

export class ErreurFormatCsv extends Error {}

/**
 * En-têtes reconnus (en minuscules) vers un nom unique.
 * Couvre les rapports « Balance change from activity, itemized », « Itemized payouts »
 * et l'export « Transactions du solde » du tableau de bord (en-têtes en anglais lisible).
 */
const ALIAS: Record<string, string> = {
  balance_transaction_id: "id",
  id: "id",
  created: "date_locale",
  created_utc: "date_utc",
  "created (utc)": "date_utc",
  effective_at: "date_locale",
  effective_at_utc: "date_utc",
  reporting_category: "categorie",
  type: "type",
  gross: "brut",
  amount: "brut",
  fee: "frais",
  net: "net",
  currency: "devise",
  customer_facing_amount: "montant_client",
  "customer facing amount": "montant_client",
  customer_facing_currency: "devise_client",
  "customer facing currency": "devise_client",
  source_id: "source",
  source: "source",
  description: "description",
  automatic_payout_id: "virement",
  transfer: "virement",
  payout_id: "payout_id",
  payout_status: "statut_virement",
  payout_expected_arrival_date: "arrivee_prevue",
};

/** Types de transaction (export du tableau de bord) vers catégorie de reporting. */
const TYPE_VERS_CATEGORIE: Record<string, string> = {
  charge: "charge",
  payment: "charge",
  refund: "refund",
  payment_refund: "refund",
  payout: "payout",
  payout_cancel: "payout_reversal",
  payout_failure: "payout_reversal",
  stripe_fee: "fee",
  tax_fee: "fee",
};

function normaliserEntete(entete: string): string {
  const cle = entete.replace(/^\uFEFF/, "").trim().toLowerCase();
  return ALIAS[cle] ?? `autre:${cle}`;
}

export function detecterTypeExport(colonnes: Set<string>): TypeExport {
  if (colonnes.has("payout_id") && !colonnes.has("categorie") && !colonnes.has("type")) return "virements";
  if (colonnes.has("payout_id") && colonnes.has("statut_virement")) return "virements";
  if (colonnes.has("type") && !colonnes.has("categorie")) return "transactions";
  return "activite";
}

function extraireDate(texte: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(texte.trim());
  if (!m) return null;
  const [, a, mo, j] = m;
  const d = new Date(Date.UTC(Number(a), Number(mo) - 1, Number(j)));
  if (d.getUTCMonth() !== Number(mo) - 1 || d.getUTCDate() !== Number(j)) return null;
  return `${a}-${mo}-${j}`;
}

export interface ResultatLecture {
  type: TypeExport;
  operations: OperationStripe[];
  anomalies: Anomalie[];
  colonnesAbsentes: string[];
}

export function parserCsvStripe(contenu: string): ResultatLecture {
  let enregistrements: Record<string, string>[];
  try {
    enregistrements = parse(contenu, {
      columns: (entetes: string[]) => entetes.map(normaliserEntete),
      skip_empty_lines: true,
      bom: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];
  } catch (e) {
    throw new ErreurFormatCsv(`CSV illisible : ${e instanceof Error ? e.message : String(e)}`);
  }

  const premier = enregistrements[0];
  if (!premier) throw new ErreurFormatCsv("Le fichier CSV ne contient aucune ligne de données");
  const colonnes = new Set(Object.keys(premier));
  const type = detecterTypeExport(colonnes);

  const obligatoires =
    type === "virements"
      ? ["brut", "net", "devise", "payout_id"]
      : ["id", "brut", "frais", "net", "devise", type === "transactions" ? "type" : "categorie"];
  const manquantes = obligatoires.filter((c) => !colonnes.has(c));
  if (!colonnes.has("date_locale") && !colonnes.has("date_utc")) manquantes.push("date (created ou effective_at)");
  if (manquantes.length > 0) {
    throw new ErreurFormatCsv(
      `Ce fichier ne ressemble pas à un export Stripe reconnu (colonnes manquantes : ${manquantes.join(", ")}). ` +
        `Exports attendus : Rapports > Solde > « Balance change from activity » (Itemized) et « Payouts » (Itemized).`,
    );
  }

  const colonnesAbsentes =
    type === "virements" ? [] : ["source", "montant_client", "devise_client"].filter((c) => !colonnes.has(c));

  const operations: OperationStripe[] = [];
  const anomalies: Anomalie[] = [];

  enregistrements.forEach((e, index) => {
    const numeroLigne = index + 2;
    const id = e["id"] || e["payout_id"] || "";
    const reference = id || `ligne ${numeroLigne}`;
    const invalide = (message: string): void => {
      anomalies.push({ niveau: "bloquante", reference, message: `Ligne ${numeroLigne} ignorée : ${message}` });
    };

    const texteDate = e["date_locale"] || e["date_utc"] || "";
    const date = extraireDate(texteDate);
    let brut = parserMontant(e["brut"] ?? "");
    let net = parserMontant(e["net"] ?? "");
    let frais = e["frais"] === undefined || e["frais"] === "" ? 0 : parserMontant(e["frais"]);

    if (!id) return invalide("identifiant manquant");
    if (!date) return invalide(`date illisible ("${texteDate}")`);
    if (brut === null || frais === null || net === null) return invalide("montant illisible");

    let categorie: string;
    if (type === "virements") {
      categorie = e["categorie"] || "payout";
      // Selon la version du rapport, un virement sort du solde avec un montant positif ou négatif.
      if (categorie === "payout" && net > 0) {
        brut = -brut;
        net = -net;
      }
      frais = brut - net;
    } else if (type === "transactions") {
      const t = (e["type"] ?? "").toLowerCase();
      categorie = TYPE_VERS_CATEGORIE[t] ?? t;
    } else {
      categorie = e["categorie"] ?? "";
    }

    if (brut - frais !== net) {
      return invalide(`brut (${e["brut"]}) moins frais (${e["frais"]}) différent du net (${e["net"]})`);
    }
    const devise = (e["devise"] ?? "").toUpperCase();
    if (devise !== "EUR") return invalide(`solde Stripe en ${devise || "devise inconnue"}, seul EUR est géré`);

    const operation: OperationStripe = {
      id,
      date,
      categorie,
      brut,
      frais,
      net,
      devise,
      sourceId: e["source"] || (type === "virements" ? e["payout_id"] ?? "" : ""),
      description: e["description"] ?? "",
      virementId: e["virement"] ?? "",
    };

    const deviseClient = (e["devise_client"] ?? "").toUpperCase();
    const montantClient = parserMontant(e["montant_client"] ?? "");
    if (deviseClient && montantClient !== null) {
      operation.deviseClient = deviseClient;
      operation.montantClient = montantClient;
    }
    if (type === "virements") {
      if (e["statut_virement"]) operation.statutVirement = e["statut_virement"].toLowerCase();
      const arrivee = extraireDate(e["arrivee_prevue"] ?? "");
      if (arrivee) operation.arriveePrevue = arrivee;
    }

    operations.push(operation);
  });

  return { type, operations, anomalies, colonnesAbsentes };
}
