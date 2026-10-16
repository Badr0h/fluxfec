import { formaterEuros } from "../montants";
import type { ResultatTraitement } from "../moteur/traiter";
import type { NiveauAnomalie } from "../moteur/types";
import type { ResultatVerificationFec } from "./verifierFec";

function echapper(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

function dateFr(iso: string): string {
  const [a, m, j] = iso.split("-");
  return a && m && j ? `${j}/${m}/${a}` : iso;
}

function montant(c: number): string {
  return c === 0 ? "" : echapper(formaterEuros(c));
}

const LIBELLE_NIVEAU: Record<NiveauAnomalie, string> = {
  bloquante: "Bloquant",
  a_verifier: "À vérifier",
  info: "Info",
};

export function genererRapport(r: ResultatTraitement, nomFichierFec: string, verification?: ResultatVerificationFec): string {
  const { dossier, synthese, controles } = r;
  const controlesAffiches = [
    ...controles.controles,
    ...(verification
      ? [
          {
            nom: "Format FEC (règles DGFiP, imports ACD / Cegid / MyUnisoft / Sage)",
            ok: verification.ok,
            detail: verification.ok
              ? `${verification.lignes} lignes, ${verification.ecritures} écritures conformes`
              : verification.problemes
                  .slice(0, 5)
                  .map((p) => `${p.regle}${p.ligne ? ` (ligne ${p.ligne})` : ""} : ${p.detail}`)
                  .join(" · "),
          },
        ]
      : []),
  ];

  const cartes = [
    ["Opérations Stripe", String(synthese.nbOperations)],
    ["Écritures générées", String(r.ecritures.length)],
    ["Chiffre d'affaires HT", formaterEuros(synthese.chiffreAffairesHt)],
    ["TVA collectée", formaterEuros(synthese.tvaCollectee)],
    ["Frais Stripe", formaterEuros(synthese.fraisStripe)],
    ["Virements vers la banque", formaterEuros(synthese.virements)],
  ]
    .map(([t, v]) => `<div class="carte"><div class="t">${echapper(t ?? "")}</div><div class="v">${echapper(v ?? "")}</div></div>`)
    .join("");

  const lignesControles = controlesAffiches
    .map(
      (c) =>
        `<tr><td class="${c.ok ? "ok" : "ko"}">${c.ok ? "✓" : "✗"}</td><td>${echapper(c.nom)}</td><td>${echapper(c.detail)}</td></tr>`,
    )
    .join("");

  const lignesAnomalies =
    r.anomalies.length === 0
      ? `<tr><td colspan="3">Aucune anomalie.</td></tr>`
      : r.anomalies
          .map(
            (a) =>
              `<tr><td><span class="badge ${a.niveau}">${LIBELLE_NIVEAU[a.niveau]}</span></td><td class="mono">${echapper(a.reference)}</td><td>${echapper(a.message)}</td></tr>`,
          )
          .join("");

  const journaux = (["ventes", "stripe"] as const)
    .map((role) => {
      const j = dossier.journaux[role];
      const ecritures = r.ecritures.filter((e) => e.journal === role);
      if (ecritures.length === 0) return "";
      const lignes = ecritures
        .map((e) =>
          e.lignes
            .map(
              (l, i) => `<tr class="${i === 0 ? "debut" : ""}">
<td class="mono">${i === 0 ? echapper(e.numero ?? "") : ""}</td>
<td>${i === 0 ? dateFr(e.date) : ""}</td>
<td class="mono">${echapper(l.compte)}${l.compteAux ? ` <span class="aux">${echapper(l.compteAux)}</span>` : ""}</td>
<td>${echapper(l.libelleCompte)}</td>
<td>${i === 0 ? echapper(e.libelle) : ""}<div class="piece">${i === 0 ? echapper(e.piece) : ""}</div></td>
<td class="num">${montant(l.debit)}</td>
<td class="num">${montant(l.credit)}</td>
<td class="mono">${echapper(l.lettrage ?? "")}</td>
<td class="num">${l.devise && l.montantDevise !== undefined ? `${(l.montantDevise / 100).toFixed(2).replace(".", ",")} ${echapper(l.devise)}` : ""}</td>
</tr>`,
            )
            .join(""),
        )
        .join("");
      return `<h3>Journal ${echapper(j.code)} · ${echapper(j.libelle)} <small>${ecritures.length} écritures</small></h3>
<table class="ecritures"><thead><tr><th>N°</th><th>Date</th><th>Compte</th><th>Intitulé</th><th>Libellé / pièce</th><th class="num">Débit</th><th class="num">Crédit</th><th>Let.</th><th class="num">Devise</th></tr></thead><tbody>${lignes}</tbody></table>`;
    })
    .join("");

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Écritures Stripe · ${echapper(dossier.raisonSociale)}</title>
<style>
:root{--encre:#1c2430;--gris:#6b7480;--ligne:#e3e6ea;--fond:#f6f7f9;--vert:#177245;--rouge:#b3261e;--ambre:#9a6200;--bleu:#1f4e8c}
*{box-sizing:border-box}body{margin:0;font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--encre);background:var(--fond)}
main{max-width:1180px;margin:0 auto;padding:32px 24px 64px}
header{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;border-bottom:2px solid var(--encre);padding-bottom:16px;margin-bottom:24px}
h1{margin:0;font-size:24px}h2{font-size:17px;margin:32px 0 12px}h3{font-size:15px;margin:24px 0 8px}h3 small{color:var(--gris);font-weight:400}
.meta{color:var(--gris)}.meta b{color:var(--encre)}
.cartes{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.carte{background:#fff;border:1px solid var(--ligne);border-radius:8px;padding:12px 14px}.carte .t{color:var(--gris);font-size:12px}.carte .v{font-size:19px;font-weight:600;margin-top:2px}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--ligne)}th,td{padding:6px 10px;text-align:left;vertical-align:top;border-bottom:1px solid var(--ligne)}
th{background:#eef0f3;font-size:12px;font-weight:600;color:var(--gris)}td.num,th.num{text-align:right;white-space:nowrap}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;white-space:nowrap}.aux{color:var(--gris)}
.piece{color:var(--gris);font-size:11.5px;font-family:ui-monospace,monospace}
.ecritures tr.debut td{border-top:2px solid var(--ligne)}.ecritures td{border-bottom:none}
td.ok{color:var(--vert);font-weight:700}td.ko{color:var(--rouge);font-weight:700}
.badge{display:inline-block;padding:1px 8px;border-radius:10px;font-size:12px;font-weight:600;white-space:nowrap}
.badge.bloquante{background:#fbe4e2;color:var(--rouge)}.badge.a_verifier{background:#fdf0d5;color:var(--ambre)}.badge.info{background:#e3ecf8;color:var(--bleu)}
footer{margin-top:40px;color:var(--gris);font-size:12px}
@media print{body{background:#fff}main{padding:0}}
</style></head><body><main>
<header><div><h1>${echapper(dossier.raisonSociale)}</h1><div class="meta">SIREN <b>${echapper(dossier.siren)}</b> · Stripe du <b>${dateFr(r.periode.debut)}</b> au <b>${dateFr(r.periode.fin)}</b></div></div>
<div class="meta">Fichier généré : <b class="mono">${echapper(nomFichierFec)}</b></div></header>
<section class="cartes">${cartes}</section>
<h2>Contrôles</h2><table><tbody>${lignesControles}</tbody></table>
<h2>Points à vérifier <small class="meta">(${r.anomalies.length})</small></h2>
<table><thead><tr><th>Niveau</th><th>Référence</th><th>Détail</th></tr></thead><tbody>${lignesAnomalies}</tbody></table>
<h2>Écritures</h2>${journaux}
<footer>Écritures générées automatiquement à partir des exports Stripe (activité et virements détaillés) et du paramétrage du dossier. Le fichier FEC (18 colonnes, tabulation, ISO-8859-15) s'importe par la fonction « Import FEC » des logiciels de production. Les comptes clients portent déjà l'auxiliaire : ne pas cocher l'ajout automatique de la racine « C » à l'import dans ACD.</footer>
</main></body></html>
`;
}
