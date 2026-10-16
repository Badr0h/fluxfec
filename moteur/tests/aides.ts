import { readFileSync } from "node:fs";
import { validerDossier, type Dossier } from "../src/config/dossier";
import type { OperationStripe } from "../src/stripe/parse";

export function dossierExemple(): Dossier {
  const r = validerDossier(dossierBrut());
  if (!r.ok) throw new Error(r.erreurs.join("\n"));
  return r.dossier;
}

interface CompteJson {
  numero: string;
  libelle: string;
}

export interface DossierJson {
  siren: string;
  raisonSociale: string;
  ouvertureExercice?: string;
  clotureExercice: string;
  journaux: { ventes: { code: string; libelle: string }; stripe: { code: string; libelle: string } };
  comptes: Record<"clients" | "ventes" | "tvaCollectee" | "stripe" | "virementsInternes" | "fraisStripe" | "attente", CompteJson>;
  clientAuxiliaire?: CompteJson;
  tauxTvaDefaut: number;
  detail: string;
}

export function dossierBrut(): DossierJson {
  return JSON.parse(readFileSync(new URL("../exemples/dossier-exemple.json", import.meta.url), "utf8")) as DossierJson;
}

export function csvExemple(): string[] {
  return ["stripe-activite-septembre.csv", "stripe-virements-septembre.csv"].map((f) =>
    readFileSync(new URL(`../exemples/${f}`, import.meta.url), "utf8"),
  );
}

export function operation(partiel: Partial<OperationStripe>): OperationStripe {
  const brut = partiel.brut ?? 0;
  const frais = partiel.frais ?? 0;
  return {
    id: "txn_test",
    date: "2026-09-10",
    categorie: "charge",
    devise: "EUR",
    sourceId: "ch_test",
    description: "",
    virementId: "",
    ...partiel,
    brut,
    frais,
    net: partiel.net ?? brut - frais,
  };
}

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
export function aleatoire(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
