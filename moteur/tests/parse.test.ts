import { describe, expect, it } from "vitest";
import { ErreurFormatCsv, parserCsvStripe } from "../src/stripe/parse";

const ENTETE_ACTIVITE = "balance_transaction_id,created,currency,gross,fee,net,reporting_category";

describe("export « Balance change from activity » (Itemized)", () => {
  it("lit les colonnes par défaut de Stripe (created, sans source_id)", () => {
    const r = parserCsvStripe(`${ENTETE_ACTIVITE},available_on,description\ntxn_1,2026-09-01 23:30:00,eur,49.00,0.99,48.01,charge,2026-09-03 00:00:00,Commande\n`);
    expect(r.type).toBe("activite");
    expect(r.operations[0]).toMatchObject({ id: "txn_1", date: "2026-09-01", brut: 4900, frais: 99, net: 4801, categorie: "charge" });
    expect(r.colonnesAbsentes).toEqual(["source", "montant_client", "devise_client"]);
  });

  it("préfère created (fuseau choisi dans Stripe) à created_utc", () => {
    const r = parserCsvStripe(
      "balance_transaction_id,created_utc,created,currency,gross,fee,net,reporting_category\ntxn_1,2026-09-30 22:30:00,2026-10-01 00:30:00,eur,10.00,0.40,9.60,charge\n",
    );
    expect(r.operations[0]?.date).toBe("2026-10-01");
  });

  it("accepte created_utc seul", () => {
    const r = parserCsvStripe("balance_transaction_id,created_utc,currency,gross,fee,net,reporting_category\ntxn_1,2026-09-30 22:30:00,eur,10.00,0.40,9.60,charge\n");
    expect(r.operations[0]?.date).toBe("2026-09-30");
  });

  it("gère le séparateur décimal virgule (option decimal_separator de Stripe)", () => {
    const r = parserCsvStripe(`${ENTETE_ACTIVITE}\ntxn_1,2026-09-01 10:00:00,eur,"1234,50","18,77","1215,73",charge\n`);
    expect(r.operations[0]).toMatchObject({ brut: 123450, frais: 1877, net: 121573 });
  });

  it("gère BOM, guillemets, virgules et retours à la ligne dans la description, colonnes en plus", () => {
    const csv = `\uFEFF${ENTETE_ACTIVITE},description,card_brand\ntxn_1,2026-09-01 10:00:00,eur,10.00,0.40,9.60,charge,"Commande ""VIP"", taille L\nmerci",visa\n`;
    const r = parserCsvStripe(csv);
    expect(r.operations[0]?.description).toBe('Commande "VIP", taille L\nmerci');
  });

  it("lit la devise vue par le client", () => {
    const r = parserCsvStripe(
      `${ENTETE_ACTIVITE},customer_facing_amount,customer_facing_currency,source_id\ntxn_1,2026-09-08 10:00:00,eur,55.40,2.05,53.35,charge,65.00,usd,ch_1\n`,
    );
    expect(r.operations[0]).toMatchObject({ montantClient: 6500, deviseClient: "USD", sourceId: "ch_1" });
  });

  it("met en anomalie les lignes incohérentes sans s'arrêter", () => {
    const csv = [
      ENTETE_ACTIVITE,
      "txn_ok,2026-09-01 10:00:00,eur,10.00,0.40,9.60,charge",
      "txn_net,2026-09-02 10:00:00,eur,10.00,0.40,9.00,charge",
      "txn_date,2026-02-30 10:00:00,eur,10.00,0.40,9.60,charge",
      "txn_montant,2026-09-02 10:00:00,eur,dix,0.40,9.60,charge",
      "txn_usd,2026-09-02 10:00:00,usd,10.00,0.40,9.60,charge",
      ",2026-09-02 10:00:00,eur,10.00,0.40,9.60,charge",
    ].join("\n");
    const r = parserCsvStripe(csv);
    expect(r.operations.map((o) => o.id)).toEqual(["txn_ok"]);
    expect(r.anomalies.map((a) => a.reference)).toEqual(["txn_net", "txn_date", "txn_montant", "txn_usd", "ligne 7"]);
    expect(r.anomalies.every((a) => a.niveau === "bloquante")).toBe(true);
  });
});

describe("export « Payouts » (Itemized)", () => {
  const entete = "balance_transaction_id,effective_at,currency,gross,fee,net,reporting_category,description,payout_id,payout_status,payout_expected_arrival_date";

  it("est reconnu et les montants positifs deviennent des sorties du solde", () => {
    const r = parserCsvStripe(`${entete}\ntxn_p,2026-09-15 06:00:00,eur,638.62,0.00,638.62,payout,STRIPE PAYOUT,po_1,paid,2026-09-16\n`);
    expect(r.type).toBe("virements");
    expect(r.operations[0]).toMatchObject({ categorie: "payout", brut: -63862, net: -63862, frais: 0, sourceId: "po_1", statutVirement: "paid", arriveePrevue: "2026-09-16" });
  });

  it("accepte aussi des montants déjà négatifs", () => {
    const r = parserCsvStripe(`${entete}\ntxn_p,2026-09-15 06:00:00,eur,-638.62,0.00,-638.62,payout,,po_1,paid,2026-09-16\n`);
    expect(r.operations[0]).toMatchObject({ brut: -63862, net: -63862 });
  });

  it("isole les frais d'un virement instantané", () => {
    const r = parserCsvStripe(`${entete}\ntxn_p,2026-09-15 06:00:00,eur,-100.00,1.00,-101.00,payout,,po_1,paid,2026-09-15\n`);
    expect(r.operations[0]).toMatchObject({ brut: -10000, frais: 100, net: -10100 });
  });
});

describe("export « Transactions » du tableau de bord (en-têtes lisibles)", () => {
  it("convertit les types en catégories", () => {
    const csv = [
      "id,Type,Source,Amount,Fee,Net,Currency,Created (UTC),Description,Transfer",
      "txn_1,payment,py_1,20.00,0.55,19.45,eur,2026-09-01 10:00,Commande,po_9",
      "txn_2,payment_refund,pyr_1,-20.00,0.00,-20.00,eur,2026-09-02 10:00,Remb,po_9",
      "txn_3,payout,po_9,-19.45,0.00,-19.45,eur,2026-09-03 10:00,STRIPE PAYOUT,",
      "txn_4,stripe_fee,sf_1,-1.00,0.00,-1.00,eur,2026-09-04 10:00,Radar,",
    ].join("\n");
    const r = parserCsvStripe(csv);
    expect(r.type).toBe("transactions");
    expect(r.operations.map((o) => o.categorie)).toEqual(["charge", "refund", "payout", "fee"]);
    expect(r.operations[0]?.virementId).toBe("po_9");
  });
});

describe("fichiers refusés", () => {
  it("un CSV qui n'est pas un export Stripe", () => {
    expect(() => parserCsvStripe("date,montant\n2026-09-01,10\n")).toThrow(ErreurFormatCsv);
  });
  it("un fichier vide", () => {
    expect(() => parserCsvStripe(`${ENTETE_ACTIVITE}\n`)).toThrow(/aucune ligne/);
  });
  it("un CSV mal formé", () => {
    expect(() => parserCsvStripe(`${ENTETE_ACTIVITE}\ntxn_1,"2026-09-01,eur\n`)).toThrow(ErreurFormatCsv);
  });
});
