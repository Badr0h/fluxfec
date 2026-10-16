import { describe, expect, it } from "vitest";
import { formaterMontantFec, parserMontant, ventilerTtc } from "../src/montants";

describe("parserMontant", () => {
  it("convertit en centimes sans flottant", () => {
    expect(parserMontant("49.00")).toBe(4900);
    expect(parserMontant("0.1")).toBe(10);
    expect(parserMontant("-34.50")).toBe(-3450);
    expect(parserMontant("1234,56")).toBe(123456);
    expect(parserMontant("12")).toBe(1200);
  });

  it("refuse ce qui n'est pas un montant", () => {
    expect(parserMontant("")).toBeNull();
    expect(parserMontant("abc")).toBeNull();
    expect(parserMontant("1.234")).toBeNull();
  });
});

describe("ventilerTtc", () => {
  it("HT + TVA = TTC, quel que soit le montant", () => {
    for (let ttc = -5000; ttc <= 5000; ttc += 7) {
      for (const taux of [20, 10, 5.5, 2.1, 0]) {
        const { ht, tva } = ventilerTtc(ttc, taux);
        expect(ht + tva).toBe(ttc);
      }
    }
  });

  it("arrondit au centime le plus proche", () => {
    expect(ventilerTtc(4900, 20)).toEqual({ ht: 4083, tva: 817 });
    expect(ventilerTtc(-4900, 20)).toEqual({ ht: -4083, tva: -817 });
    expect(ventilerTtc(1055, 5.5)).toEqual({ ht: 1000, tva: 55 });
  });
});

describe("formaterMontantFec", () => {
  it("utilise la virgule décimale", () => {
    expect(formaterMontantFec(0)).toBe("0,00");
    expect(formaterMontantFec(4905)).toBe("49,05");
    expect(formaterMontantFec(123456)).toBe("1234,56");
    expect(formaterMontantFec(-7)).toBe("-0,07");
  });
});
