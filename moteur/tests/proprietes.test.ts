import { describe, expect, it } from "vitest";
import { traiterCsvStripe } from "../src/moteur/traiter";
import { genererFec } from "../src/sortie/fec";
import { verifierFec } from "../src/sortie/verifierFec";
import { aleatoire, dossierExemple } from "./aides";

const d = dossierExemple();
const CATEGORIES = ["charge", "charge", "charge", "charge", "refund", "fee", "dispute", "dispute_reversal", "adjustment", "payout", "risk_reserved_funds"];
const DESCRIPTIONS = ["Commande", "Abonnement « Pro »", "Remise – été", "Ref|42", "Tab\there", "日本の顧客", "Ça marche ✓", ""];

const montant = (c: number) => `${c < 0 ? "-" : ""}${Math.floor(Math.abs(c) / 100)}.${String(Math.abs(c) % 100).padStart(2, "0")}`;

/** Un mois Stripe aléatoire mais plausible, au format du rapport d'activité. */
function moisAleatoire(graine: number): string {
  const r = aleatoire(graine);
  const n = 1 + Math.floor(r() * 120);
  const lignes = ["balance_transaction_id,created,currency,gross,fee,net,reporting_category,source_id,description,customer_facing_amount,customer_facing_currency"];
  for (let i = 0; i < n; i++) {
    const cat = CATEGORIES[Math.floor(r() * CATEGORIES.length)] ?? "charge";
    const base = 1 + Math.floor(r() * 250000);
    let brut = base;
    let frais = Math.round(base * 0.015) + 25;
    if (cat === "refund" || cat === "payout" || cat === "fee" || cat === "risk_reserved_funds") [brut, frais] = [-base, 0];
    if (cat === "dispute") [brut, frais] = [-base, 2000];
    if (cat === "dispute_reversal") [brut, frais] = [base, -2000];
    if (cat === "adjustment") [brut, frais] = [r() < 0.5 ? base : -base, 0];
    const devise = cat === "charge" && r() < 0.15 ? "usd" : "eur";
    const jour = String(1 + Math.floor(r() * 28)).padStart(2, "0");
    const desc = DESCRIPTIONS[Math.floor(r() * DESCRIPTIONS.length)] ?? "";
    lignes.push(
      [
        `txn_${graine}_${i}`,
        `2026-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-${jour} 12:00:00`,
        "eur",
        montant(brut),
        montant(frais),
        montant(brut - frais),
        cat,
        r() < 0.9 ? `src_${graine}_${Math.floor(i / 2)}` : "",
        `"${desc.replaceAll('"', '""')}"`,
        montant(devise === "usd" ? Math.round(brut * 1.17) : brut),
        devise,
      ].join(","),
    );
  }
  return lignes.join("\n");
}

describe("propriétés sur 300 mois Stripe aléatoires", () => {
  it("toujours équilibré, 517 = solde Stripe, FEC conforme", () => {
    for (let graine = 1; graine <= 300; graine++) {
      const res = traiterCsvStripe(moisAleatoire(graine), d);
      const echec = res.controles.controles.find((c) => c.bloquant && !c.ok);
      expect(echec, `graine ${graine} : ${echec?.detail}`).toBeUndefined();
      expect(res.controles.solde517).toBe(res.operations.reduce((s, o) => s + o.net, 0));

      for (const e of res.ecritures) {
        const debit = e.lignes.reduce((s, l) => s + l.debit, 0);
        const credit = e.lignes.reduce((s, l) => s + l.credit, 0);
        expect(debit, `graine ${graine}, pièce ${e.piece}`).toBe(credit);
        for (const l of e.lignes) {
          expect(Number.isInteger(l.debit) && Number.isInteger(l.credit)).toBe(true);
          expect(l.debit >= 0 && l.credit >= 0 && (l.debit === 0) !== (l.credit === 0)).toBe(true);
        }
      }

      const fec = genererFec(res.ecritures, d);
      const v = verifierFec(fec.octets, fec.nomFichier, { ouverture: d.ouvertureExercice, cloture: d.clotureExercice });
      expect(v.problemes, `graine ${graine}`).toEqual([]);
    }
  }, 60000);
});
