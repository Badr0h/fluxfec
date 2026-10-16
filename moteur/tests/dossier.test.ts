import { describe, expect, it } from "vitest";
import { validerDossier } from "../src/config/dossier";
import { dossierBrut, type DossierJson } from "./aides";

function erreurs(modif: (d: DossierJson) => void): string[] {
  const d = structuredClone(dossierBrut());
  modif(d);
  const r = validerDossier(d);
  return r.ok ? [] : r.erreurs;
}

describe("paramétrage du dossier", () => {
  it("l'exemple est valide et l'ouverture vaut 12 mois avant la clôture", () => {
    const r = validerDossier(dossierBrut());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.dossier.ouvertureExercice).toBe("2026-01-01");
  });

  it("exercice décalé", () => {
    const r = validerDossier({ ...dossierBrut(), clotureExercice: "2027-06-30" });
    expect(r.ok && r.dossier.ouvertureExercice).toBe("2026-07-01");
  });

  it.each<[string, (d: DossierJson) => void, string]>([
    ["SIREN à 8 chiffres", (d) => (d.siren = "12345678"), "siren"],
    ["date impossible", (d) => (d.clotureExercice = "2026-02-30"), "clotureExercice"],
    ["ouverture après clôture", (d) => (d.ouvertureExercice = "2027-01-01"), "ouvertureExercice"],
    ["compte avec accent", (d) => (d.comptes.ventes.numero = "706ÉTÉ"), "comptes.ventes"],
    ["compte de classe 9", (d) => (d.comptes.attente.numero = "900000"), "comptes.attente"],
    ["compte trop court", (d) => (d.comptes.fraisStripe.numero = "627"), "comptes.fraisStripe"],
    ["compte trop long", (d) => (d.comptes.stripe.numero = "51710000000000"), "comptes.stripe"],
    ["411 sans auxiliaire", (d) => delete d.clientAuxiliaire, "clientAuxiliaire"],
    ["code journal trop long", (d) => (d.journaux.stripe.code = "STRI"), "journaux.stripe.code"],
    ["deux journaux identiques", (d) => (d.journaux.stripe.code = "VT"), "journaux"],
    ["517 et 58 confondus", (d) => (d.comptes.virementsInternes.numero = "517100"), "même numéro"],
    ["taux de TVA absurde", (d) => (d.tauxTvaDefaut = 120), "tauxTvaDefaut"],
    ["libellé de compte vide", (d) => (d.comptes.ventes.libelle = " "), "comptes.ventes.libelle"],
  ])("refuse : %s", (_nom, modif, attendu) => {
    expect(erreurs(modif).some((e) => e.includes(attendu))).toBe(true);
  });

  it("un compte clients hors 40/41 peut se passer d'auxiliaire", () => {
    expect(
      erreurs((d) => {
        delete d.clientAuxiliaire;
        d.comptes.clients.numero = "467100";
      }),
    ).toEqual([]);
  });
});
