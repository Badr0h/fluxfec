import { describe, expect, it } from "vitest";
import { soldeCompte } from "../src/moteur/controles";
import { traiterCsvStripe } from "../src/moteur/traiter";
import { csvExemple, dossierExemple } from "./aides";

const d = dossierExemple();
const [activite = "", virements = ""] = csvExemple();
const resultat = traiterCsvStripe([activite, virements], d);

describe("traitement des exports d'exemple (activité + virements)", () => {
  it("reconnaît les deux exports", () => {
    expect(resultat.exports).toEqual(["activite", "virements"]);
  });

  it("tous les contrôles passent", () => {
    expect(resultat.controles.controles.filter((c) => !c.ok)).toEqual([]);
    expect(resultat.controles.ok).toBe(true);
  });

  it("le 517 colle au solde Stripe et les virements le vident", () => {
    expect(resultat.controles.solde517).toBe(resultat.controles.sommeNetStripe);
    expect(soldeCompte(resultat.ecritures, "517100")).toBe(0);
  });

  it("les chiffres de synthèse sont justes", () => {
    expect(resultat.synthese).toMatchObject({ chiffreAffairesHt: 103000, tvaCollectee: 20600, virements: 109693 });
  });

  it("numéros continus par journal, dans l'ordre des dates", () => {
    for (const code of ["VT", "ST"]) {
      const duJournal = resultat.ecritures.filter((e) => e.numero?.startsWith(code));
      duJournal.forEach((e, i) => expect(e.numero).toBe(`${code}${String(i + 1).padStart(6, "0")}`));
      const dates = duJournal.map((e) => e.date);
      expect([...dates].sort()).toEqual(dates);
    }
  });

  it("le 411 reste ouvert uniquement pour le litige", () => {
    const ouvertes = resultat.ecritures.flatMap((e) => e.lignes.filter((l) => l.compte === "411000" && !l.lettrage));
    expect(ouvertes).toHaveLength(1);
    expect(soldeCompte(resultat.ecritures, "411000")).toBe(8990);
  });
});

describe("cas d'usage réels", () => {
  it("export d'activité seul : pas de virement, le 517 garde le solde et on le signale", () => {
    const r = traiterCsvStripe(activite, d);
    expect(r.controles.ok).toBe(true);
    expect(r.controles.solde517).toBe(109693);
    expect(r.anomalies.some((a) => a.message.includes("Payouts"))).toBe(true);
  });

  it("le même fichier chargé deux fois n'est compté qu'une fois", () => {
    const r = traiterCsvStripe([activite, virements, virements], d);
    expect(r.operations).toHaveLength(resultat.operations.length);
    expect(r.anomalies.some((a) => a.message.includes("plusieurs fichiers"))).toBe(true);
  });

  it("un export hors exercice bloque", () => {
    const r = traiterCsvStripe([activite, virements], { ...d, ouvertureExercice: "2025-01-01", clotureExercice: "2025-12-31" });
    expect(r.controles.ok).toBe(false);
    expect(r.controles.controles.find((c) => !c.ok)?.nom).toContain("exercice");
  });

  it("export par défaut (sans source_id) : on le signale et tout reste équilibré", () => {
    const sansSource = activite
      .split("\n")
      .map((l) => l.split(",").filter((_, i) => i !== 8).join(","))
      .join("\n");
    const r = traiterCsvStripe([sansSource, virements], d);
    expect(r.controles.ok).toBe(true);
    expect(r.anomalies.some((a) => a.message.includes("source_id"))).toBe(true);
  });
});
