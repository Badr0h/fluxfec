/** Tous les montants du moteur sont en centimes entiers. */

export function parserMontant(texte: string): number | null {
  const t = texte.trim().replace(/\s/g, "");
  const m = /^(-)?(\d+)(?:[.,](\d{1,2}))?$/.exec(t);
  if (!m) return null;
  const entier = Number(m[2]);
  const decimales = Number((m[3] ?? "").padEnd(2, "0"));
  const valeur = entier * 100 + decimales;
  return m[1] ? -valeur : valeur;
}

/** Arrondi à l'entier le plus proche, symétrique autour de zéro. */
export function arrondir(x: number): number {
  return x < 0 ? -Math.round(-x) : Math.round(x);
}

/** Sépare un TTC en HT et TVA ; la TVA absorbe l'écart d'arrondi. */
export function ventilerTtc(ttc: number, tauxPourcent: number): { ht: number; tva: number } {
  const tauxBp = Math.round(tauxPourcent * 100);
  const ht = arrondir((ttc * 10000) / (10000 + tauxBp));
  return { ht, tva: ttc - ht };
}

export function formaterMontantFec(centimes: number): string {
  const abs = Math.abs(centimes);
  const signe = centimes < 0 ? "-" : "";
  return `${signe}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")}`;
}

const formatEuros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function formaterEuros(centimes: number): string {
  return formatEuros.format(centimes / 100);
}
