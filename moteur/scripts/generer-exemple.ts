/**
 * Fabrique deux exports Stripe fictifs mais cohérents pour septembre 2026, au format des rapports
 * « Balance change from activity » (Itemized) et « Payouts » (Itemized) : les deux virements
 * vident exactement le solde Stripe.
 */
import { writeFileSync } from "node:fs";
import { arrondir } from "../src/montants";

interface Ligne {
  id: string;
  created: string;
  categorie: string;
  brut: number;
  frais: number;
  montantClient?: number;
  deviseClient?: string;
  source: string;
  description: string;
  virement: string;
}

interface Virement {
  id: string;
  payoutId: string;
  effectiveAt: string;
  arrivee: string;
  montant: number;
}

const activite: Ligne[] = [];
const virements: Virement[] = [];
let compteur = 0;
const id = (prefixe: string) => `${prefixe}_3Qx${String(++compteur).padStart(4, "0")}Demo`;
const fraisCarte = (brut: number) => arrondir((brut * 15) / 1000) + 25;
const jourIso = (jour: number) => `2026-09-${String(jour).padStart(2, "0")}`;

function vente(jour: number, ttc: number, commande: number, description = `Commande #${commande}`) {
  activite.push({
    id: id("txn"),
    created: `${jourIso(jour)} ${10 + (commande % 9)}:${String((commande * 7) % 60).padStart(2, "0")}:12`,
    categorie: "charge",
    brut: ttc,
    frais: fraisCarte(ttc),
    montantClient: ttc,
    deviseClient: "eur",
    source: id("ch"),
    description,
    virement: "",
  });
}

function mouvement(jour: number, categorie: string, brut: number, frais: number, prefixe: string, description: string) {
  activite.push({
    id: id("txn"),
    created: `${jourIso(jour)} 09:30:00`,
    categorie,
    brut,
    frais,
    ...(categorie === "refund" || categorie === "dispute" ? { montantClient: brut, deviseClient: "eur" } : {}),
    source: id(prefixe),
    description,
    virement: "",
  });
}

function virement(jour: number, jourArrivee: number) {
  const payoutId = id("po");
  const aVirer = activite.filter((l) => l.virement === "");
  for (const l of aVirer) l.virement = payoutId;
  virements.push({
    id: id("txn"),
    payoutId,
    effectiveAt: `${jourIso(jour)} 06:00:00`,
    arrivee: jourIso(jourArrivee),
    montant: aVirer.reduce((s, l) => s + l.brut - l.frais, 0),
  });
}

vente(1, 4900, 1001);
vente(2, 8990, 1002);
vente(3, 2400, 1003);
vente(4, 12900, 1004);
vente(5, 5900, 1005);
vente(6, 3450, 1006);
// Client américain : 65,00 USD convertis en 55,40 EUR, frais carte internationale.
activite.push({
  id: id("txn"),
  created: "2026-09-08 16:42:05",
  categorie: "charge",
  brut: 5540,
  frais: arrondir((5540 * 325) / 10000) + 25,
  montantClient: 6500,
  deviseClient: "usd",
  source: id("ch"),
  description: "Commande #1007",
  virement: "",
});
vente(9, 19900, 1008);
mouvement(10, "refund", -3450, 0, "re", "Remboursement commande #1006");
vente(11, 4900, 1009);
mouvement(12, "fee", -210, 0, "bfee", "Billing - Usage Fee (2026-08)");
virement(15, 16);
vente(16, 7490, 1010);
vente(17, 1990, 1011, "Commande #1011 – “Café” ☕");
mouvement(18, "dispute", -8990, 2000, "dp", "Contestation commande #1002");
vente(20, 8990, 1012);
vente(22, 4500, 1013);
mouvement(23, "adjustment", -300, 0, "adj", "Ajustement de solde");
vente(24, 24900, 1014);
vente(26, 3900, 1015);
vente(27, 6400, 1016);
virement(29, 30);

const montant = (c: number) => `${c < 0 ? "-" : ""}${Math.floor(Math.abs(c) / 100)}.${String(Math.abs(c) % 100).padStart(2, "0")}`;
const guillemets = (s: string) => `"${s.replaceAll('"', '""')}"`;

const csvActivite = [
  "balance_transaction_id,created,available_on,currency,gross,fee,net,reporting_category,source_id,description,customer_facing_amount,customer_facing_currency,automatic_payout_id",
  ...activite.map((l) =>
    [
      l.id,
      l.created,
      `${l.created.slice(0, 10)} 00:00:00`,
      "eur",
      montant(l.brut),
      montant(l.frais),
      montant(l.brut - l.frais),
      l.categorie,
      l.source,
      guillemets(l.description),
      l.montantClient !== undefined ? montant(l.montantClient) : "",
      l.deviseClient ?? "",
      l.virement,
    ].join(","),
  ),
].join("\n");

const csvVirements = [
  "balance_transaction_id,effective_at,currency,gross,fee,net,reporting_category,description,payout_id,payout_status,payout_expected_arrival_date",
  ...virements.map((v) =>
    [v.id, v.effectiveAt, "eur", montant(v.montant), "0.00", montant(v.montant), "payout", "STRIPE PAYOUT", v.payoutId, "paid", v.arrivee].join(","),
  ),
].join("\n");

writeFileSync(new URL("../exemples/stripe-activite-septembre.csv", import.meta.url), csvActivite + "\n");
writeFileSync(new URL("../exemples/stripe-virements-septembre.csv", import.meta.url), csvVirements + "\n");
console.log(`${activite.length} opérations et ${virements.length} virements écrits dans exemples/`);
