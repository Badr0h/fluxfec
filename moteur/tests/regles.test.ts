import { describe, expect, it } from "vitest";
import { appliquerRegles } from "../src/moteur/regles";
import type { Ecriture } from "../src/moteur/types";
import { dossierExemple, operation } from "./aides";

const d = dossierExemple();

/** Résumé lisible : compte -> montant signé (débit positif). */
function mouvements(e: Ecriture | undefined): Record<string, number> {
  const r: Record<string, number> = {};
  for (const l of e?.lignes ?? []) r[l.compte] = (r[l.compte] ?? 0) + l.debit - l.credit;
  return r;
}

describe("règles Stripe", () => {
  it("charge : vente au journal VT et encaissement au journal ST", () => {
    const { ecritures, anomalies } = appliquerRegles(operation({ categorie: "charge", brut: 4900, frais: 99 }), d);
    expect(ecritures.map((e) => e.journal)).toEqual(["ventes", "stripe"]);
    expect(mouvements(ecritures[0])).toEqual({ "411000": 4900, "707000": -4083, "445710": -817 });
    expect(mouvements(ecritures[1])).toEqual({ "517100": 4801, "627800": 99, "411000": -4900 });
    expect(ecritures[0]?.lignes[0]?.compteAux).toBe("CSTRIPE");
    expect(anomalies).toEqual([]);
  });

  it("refund : avoir puis sortie du 517", () => {
    const { ecritures, anomalies } = appliquerRegles(operation({ categorie: "refund", sourceId: "re_1", brut: -3450 }), d);
    expect(mouvements(ecritures[0])).toEqual({ "411000": -3450, "707000": 2875, "445710": 575 });
    expect(mouvements(ecritures[1])).toEqual({ "517100": -3450, "411000": 3450 });
    expect(anomalies[0]?.niveau).toBe("info");
  });

  it("payout : 58 au débit, 517 au crédit", () => {
    const { ecritures } = appliquerRegles(operation({ categorie: "payout", sourceId: "po_1", brut: -50000 }), d);
    expect(ecritures).toHaveLength(1);
    expect(mouvements(ecritures[0])).toEqual({ "580000": 50000, "517100": -50000 });
  });

  it("fee : frais Stripe seuls", () => {
    const { ecritures } = appliquerRegles(operation({ categorie: "fee", brut: -210 }), d);
    expect(mouvements(ecritures[0])).toEqual({ "627800": 210, "517100": -210 });
  });

  it("dispute : créance réouverte, frais de litige, anomalie", () => {
    const { ecritures, anomalies } = appliquerRegles(operation({ categorie: "dispute", sourceId: "dp_1", brut: -8990, frais: 2000 }), d);
    expect(mouvements(ecritures[0])).toEqual({ "517100": -10990, "627800": 2000, "411000": 8990 });
    expect(anomalies[0]?.niveau).toBe("a_verifier");
  });

  it("catégorie inconnue : compte d'attente et anomalie", () => {
    const { ecritures, anomalies } = appliquerRegles(operation({ categorie: "adjustment", sourceId: "adj_1", brut: -300 }), d);
    expect(mouvements(ecritures[0])).toEqual({ "517100": -300, "471000": 300 });
    expect(anomalies[0]?.message).toContain("adjustment");
  });

  it("paiement en devise : montant devise sur le 411 et anomalie TVA", () => {
    const { ecritures, anomalies } = appliquerRegles(
      operation({ categorie: "charge", brut: 5540, frais: 205, montantClient: 6500, deviseClient: "USD" }),
      d,
    );
    const client = ecritures[0]?.lignes.find((l) => l.compte === "411000");
    expect(client).toMatchObject({ montantDevise: 6500, devise: "USD" });
    expect(anomalies[0]?.message).toContain("USD");
  });

  it("aucun compte n'est écrit en dur : le paramétrage du dossier fait foi", () => {
    const autre = { ...d, comptes: { ...d.comptes, stripe: { numero: "512900", libelle: "Stripe (banque)" } } };
    const { ecritures } = appliquerRegles(operation({ categorie: "payout", brut: -1000 }), autre);
    expect(Object.keys(mouvements(ecritures[0]))).toContain("512900");
  });
});
