import iconv from "iconv-lite";
import { describe, expect, it } from "vitest";
import { traiterCsvStripe } from "../src/moteur/traiter";
import { COLONNES_FEC, genererFec, texteFec } from "../src/sortie/fec";
import { verifierFec } from "../src/sortie/verifierFec";
import { csvExemple, dossierExemple } from "./aides";

const d = dossierExemple();
const exercice = { ouverture: d.ouvertureExercice, cloture: d.clotureExercice };
const fec = genererFec(traiterCsvStripe(csvExemple(), d).ecritures, d);
const lignes = fec.texte.replace(/\r\n$/, "").split("\r\n");
const champs = (n: number) => (lignes[n] ?? "").split("\t");
const col = (nom: (typeof COLONNES_FEC)[number]) => COLONNES_FEC.indexOf(nom);

/** Rejoue la vérification sur une copie du FEC modifiée à la main. */
function verifierModifie(modif: (lignes: string[][]) => void, nom = fec.nomFichier) {
  const copie = lignes.map((l) => l.split("\t"));
  modif(copie);
  return verifierFec(iconv.encode(copie.map((l) => l.join("\t")).join("\r\n") + "\r\n", "ISO-8859-15"), nom, exercice);
}

function regles(r: ReturnType<typeof verifierFec>): string[] {
  return [...new Set(r.problemes.map((p) => p.regle))];
}

describe("fichier FEC généré", () => {
  it("passe toutes les vérifications (DGFiP et imports logiciels)", () => {
    const r = verifierFec(fec.octets, fec.nomFichier, exercice);
    expect(r.problemes).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.lignes).toBe(lignes.length - 1);
  });

  it("nom SIRENFECAAAAMMJJ.txt sur la date de clôture", () => {
    expect(fec.nomFichier).toBe("123456789FEC20261231.txt");
  });

  it("en-tête exact, tabulation, CRLF, sans BOM, ISO-8859-15", () => {
    expect(lignes[0]).toBe(COLONNES_FEC.join("\t"));
    expect(fec.texte.endsWith("\r\n")).toBe(true);
    expect(fec.octets[0]).toBe(0x4a);
    expect(iconv.decode(fec.octets, "ISO-8859-15")).toBe(fec.texte);
    expect(fec.octets.includes(Buffer.from("é", "utf8"))).toBe(false);
    expect(fec.octets.includes(Buffer.from([0xe9]))).toBe(true);
  });

  it("montant en devise signé : positif au débit, négatif au crédit", () => {
    const usd = lignes.map((l) => l.split("\t")).filter((c) => c[col("Idevise")] === "USD");
    expect(usd).toHaveLength(2);
    for (const c of usd) {
      const auDebit = c[col("Debit")] !== "0,00";
      expect(c[col("Montantdevise")]).toBe(auDebit ? "65,00" : "-65,00");
    }
  });

  it("seules les lignes 411 portent un compte auxiliaire", () => {
    for (let i = 1; i < lignes.length; i++) {
      const c = champs(i);
      expect(Boolean(c[col("CompAuxNum")])).toBe(c[col("CompteNum")]?.startsWith("411"));
    }
  });
});

describe("texteFec", () => {
  it("translittère ce que l'ISO-8859-15 ne sait pas coder, sans point d'interrogation", () => {
    expect(texteFec("Commande – “Café” l’été … ☕")).toBe('Commande - "Café" l\'été ...');
    expect(texteFec("Ōsaka Łódź")).toBe("Osaka Lódz");
    expect(texteFec("日本の顧客")).toBe("");
    expect(texteFec("€ Œuvre")).toBe("€ Œuvre");
  });
  it("supprime séparateurs et retours à la ligne", () => {
    expect(texteFec("a\tb|c\r\nd")).toBe("a b/c d");
  });
  it("tronque à la longueur demandée", () => {
    expect(texteFec("x".repeat(50), 35)).toHaveLength(35);
  });
});

describe("le vérificateur détecte chaque défaut", () => {
  const cas: [string, (l: string[][]) => void, string][] = [
    ["pipe dans un libellé", (l) => (l[1]![col("EcritureLib")] = "Vente | test"), "Séparateur"],
    ["colonne manquante", (l) => l[2]!.pop(), "Structure"],
    ["411 sans auxiliaire", (l) => ((l[1]![col("CompAuxNum")] = ""), (l[1]![col("CompAuxLib")] = "")), "Tiers"],
    ["auxiliaire sur un 707", (l) => (l[2]![col("CompAuxNum")] = "CSTRIPE"), "Tiers"],
    ["date impossible", (l) => (l[1]![col("PieceDate")] = "20260231"), "Date"],
    ["montant avec point", (l) => (l[1]![col("Debit")] = "49.00"), "Montant"],
    ["séparateur de milliers", (l) => (l[1]![col("Debit")] = "1 049,00"), "Montant"],
    ["écriture déséquilibrée", (l) => (l[1]![col("Debit")] = "50,00"), "Équilibre"],
    ["rupture de numérotation", (l) => l.forEach((c, i) => i > 0 && c[col("EcritureNum")] === "VT000002" && (c[col("EcritureNum")] = "VT000009")), "Numérotation"],
    ["écriture hors exercice", (l) => l.forEach((c, i) => i > 0 && (c[col("EcritureDate")] = "20250915")), "Exercice"],
    ["libellé de compte trop long", (l) => (l[2]![col("CompteLib")] = "x".repeat(36)), "Longueur"],
    ["compte hors plan comptable", (l) => ((l[2]![col("CompteNum")] = "ABC000"), (l[5]![col("CompteNum")] = "ABC000")), "Compte"],
    ["libellé d'écriture vide", (l) => (l[1]![col("EcritureLib")] = ""), "Donnée absente"],
    ["lettrage sans date", (l) => (l[1]![col("DateLet")] = ""), "Lettrage"],
    ["devise sans code", (l) => l.forEach((c) => c[col("Idevise")] === "USD" && (c[col("Idevise")] = "")), "Devise"],
    ["devise mal signée", (l) => l.forEach((c) => c[col("Montantdevise")] === "-65,00" && (c[col("Montantdevise")] = "65,00")), "Devise"],
    ["ordre chronologique cassé", (l) => l.splice(1, 0, ...l.splice(l.length - 2, 2)), "Ordre"],
    ["mauvais en-tête", (l) => (l[0]![col("Montantdevise")] = "MontantDevise"), "En-tête"],
  ];

  it.each(cas)("%s", (_nom, modif, regleAttendue) => {
    const r = verifierModifie(modif);
    expect(r.ok).toBe(false);
    expect(regles(r)).toContain(regleAttendue);
  });

  it("mauvais nom de fichier", () => {
    expect(regles(verifierModifie(() => {}, "export_stripe.txt"))).toContain("Nom du fichier");
  });

  it("BOM et texte UTF-8", () => {
    const utf8 = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(fec.texte, "utf8")]);
    expect(regles(verifierFec(utf8, fec.nomFichier, exercice))).toContain("Encodage");
  });
});
