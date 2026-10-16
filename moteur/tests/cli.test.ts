import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const racine = new URL("..", import.meta.url).pathname;

function cli(...args: string[]) {
  const r = spawnSync(process.execPath, ["--import", "tsx", "src/cli.ts", ...args], { cwd: racine, encoding: "utf8" });
  return { code: r.status, sortie: r.stdout + r.stderr };
}

describe("ligne de commande", () => {
  it("démo complète : code 0, FEC et rapport écrits", () => {
    const dossierSortie = mkdtempSync(join(tmpdir(), "moteur-"));
    const r = cli(
      "--csv", "exemples/stripe-activite-septembre.csv",
      "--csv", "exemples/stripe-virements-septembre.csv",
      "--dossier", "exemples/dossier-exemple.json",
      "--sortie", dossierSortie,
    );
    expect(r.code, r.sortie).toBe(0);
    expect(r.sortie).toContain("✓ Format FEC");
    expect(existsSync(join(dossierSortie, "123456789FEC20261231.txt"))).toBe(true);
    const html = readFileSync(join(dossierSortie, "rapport.html"), "utf8");
    expect(html).toContain("Boutique Exemple SAS");
    expect(html).not.toContain("✗");
  }, 30000);

  it("arguments manquants : code 2 et aide", () => {
    const r = cli();
    expect(r.code).toBe(2);
    expect(r.sortie).toContain("Usage");
  }, 30000);

  it("paramétrage invalide : code 2 et liste des erreurs", () => {
    const dir = mkdtempSync(join(tmpdir(), "moteur-"));
    const f = join(dir, "d.json");
    writeFileSync(f, JSON.stringify({ siren: "1" }));
    const r = cli("--csv", "exemples/stripe-activite-septembre.csv", "--dossier", f, "--sortie", dir);
    expect(r.code).toBe(2);
    expect(r.sortie).toContain("siren");
  }, 30000);

  it("fichier qui n'est pas un export Stripe : code 1 et message clair", () => {
    const dir = mkdtempSync(join(tmpdir(), "moteur-"));
    const f = join(dir, "banque.csv");
    writeFileSync(f, "date,libelle,montant\n2026-09-01,CB,10\n");
    const r = cli("--csv", f, "--dossier", "exemples/dossier-exemple.json", "--sortie", dir);
    expect(r.code).toBe(1);
    expect(r.sortie).toContain("export Stripe reconnu");
  }, 30000);
});
