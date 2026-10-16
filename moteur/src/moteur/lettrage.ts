import type { Ecriture, LigneEcriture } from "./types";

export function codeLettrage(index: number): string {
  const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let n = index;
  let code = "";
  for (let i = 0; i < 3; i++) {
    code = a[n % 26] + code;
    n = Math.floor(n / 26);
  }
  return code;
}

/** Lettre les lignes qui partagent une clé et dont le solde est nul. Modifie les lignes en place. */
export function lettrer(ecritures: Ecriture[]): { groupesLettres: number; lignesNonLettrees: number } {
  const groupes = new Map<string, { ligne: LigneEcriture; date: string }[]>();
  for (const e of ecritures) {
    for (const l of e.lignes) {
      if (!l.cleLettrage) continue;
      const cle = `${l.compte}|${l.compteAux ?? ""}|${l.cleLettrage}`;
      const groupe = groupes.get(cle) ?? [];
      groupe.push({ ligne: l, date: e.date });
      groupes.set(cle, groupe);
    }
  }

  let groupesLettres = 0;
  let lignesNonLettrees = 0;
  for (const groupe of groupes.values()) {
    const solde = groupe.reduce((s, g) => s + g.ligne.debit - g.ligne.credit, 0);
    if (solde !== 0 || groupe.length < 2) {
      lignesNonLettrees += groupe.length;
      continue;
    }
    const code = codeLettrage(groupesLettres++);
    const date = groupe.reduce((max, g) => (g.date > max ? g.date : max), "");
    for (const g of groupe) {
      g.ligne.lettrage = code;
      g.ligne.dateLettrage = date;
    }
  }
  return { groupesLettres, lignesNonLettrees };
}
