import { describe, expect, it } from "vitest";
import { appliquerRegles } from "../src/moteur/regles";
import { traiterCsvStripe } from "../src/moteur/traiter";
import { genererFec } from "../src/sortie/fec";
import { genererRapport } from "../src/sortie/rapport";
import { verifierFec } from "../src/sortie/verifierFec";
import { csvExemple, dossierExemple, operation } from "./aides";

const d = dossierExemple();

describe("rapport HTML", () => {
  const r = traiterCsvStripe(csvExemple(), d);
  const fec = genererFec(r.ecritures, d);
  const html = genererRapport(r, fec.nomFichier, verifierFec(fec.octets, fec.nomFichier));

  it("page autonome avec synthèse, contrôles, anomalies et journaux", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).not.toMatch(/<script|<link|src=/);
    expect(html).toMatch(/1\s030,00/);
    for (const t of ["Format FEC", "Journal VT", "Journal ST", "123456789FEC20261231.txt", "65,00 USD"]) {
      expect(html).toContain(t);
    }
    expect(html.match(/class="ok"/g)?.length).toBe(r.controles.controles.length + 1);
  });

  it("échappe le contenu venant de Stripe", () => {
    const dangereux = traiterCsvStripe(
      "balance_transaction_id,created,currency,gross,fee,net,reporting_category,description\ntxn_1,2026-09-01 10:00:00,eur,10.00,0.40,9.60,charge,\"<img src=x onerror=alert(1)>\"\n",
      d,
    );
    const page = genererRapport(dangereux, "x");
    expect(page).not.toContain("<img");
    expect(page).toContain("&lt;img");
  });

  it("affiche un contrôle en échec", () => {
    const page = genererRapport(r, fec.nomFichier, { ok: false, lignes: 1, ecritures: 1, problemes: [{ regle: "Tiers", ligne: 3, detail: "compte 411000 sans compte auxiliaire" }] });
    expect(page).toContain('class="ko"');
    expect(page).toContain("Tiers (ligne 3)");
  });
});

describe("virement échoué", () => {
  it("écriture passée et anomalie à vérifier", () => {
    const res = appliquerRegles(operation({ categorie: "payout", sourceId: "po_x", brut: -5000, statutVirement: "failed" }), d);
    expect(res.ecritures).toHaveLength(1);
    expect(res.anomalies[0]?.message).toContain("failed");
  });
});
