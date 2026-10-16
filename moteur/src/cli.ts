import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { validerDossier } from "./config/dossier";
import { formaterEuros } from "./montants";
import { traiterCsvStripe } from "./moteur/traiter";
import { genererFec } from "./sortie/fec";
import { genererRapport } from "./sortie/rapport";
import { verifierFec } from "./sortie/verifierFec";

const USAGE =
  "Usage : tsx src/cli.ts --csv <activite.csv> [--csv <virements.csv>] --dossier <dossier.json> [--sortie out/]";

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      csv: { type: "string", multiple: true },
      dossier: { type: "string" },
      sortie: { type: "string", default: "out" },
    },
  });
  if (!values.csv?.length || !values.dossier) {
    console.error(USAGE);
    return 2;
  }

  let brut: unknown;
  try {
    brut = JSON.parse(await readFile(values.dossier, "utf8"));
  } catch (e) {
    console.error(`Paramétrage du dossier illisible (${values.dossier}) : ${e instanceof Error ? e.message : String(e)}`);
    return 2;
  }
  const validation = validerDossier(brut);
  if (!validation.ok) {
    console.error(`Paramétrage du dossier invalide (${values.dossier}) :`);
    for (const e of validation.erreurs) console.error(`  - ${e}`);
    return 2;
  }
  const dossier = validation.dossier;

  const contenus = await Promise.all(values.csv.map((f) => readFile(f, "utf8")));
  const resultat = traiterCsvStripe(contenus, dossier);
  const fec = genererFec(resultat.ecritures, dossier);
  const verification = verifierFec(fec.octets, fec.nomFichier, { ouverture: dossier.ouvertureExercice, cloture: dossier.clotureExercice });

  const sortie = values.sortie ?? "out";
  await mkdir(sortie, { recursive: true });
  const cheminFec = join(sortie, fec.nomFichier);
  const cheminRapport = join(sortie, "rapport.html");
  await writeFile(cheminFec, fec.octets);
  await writeFile(cheminRapport, genererRapport(resultat, fec.nomFichier, verification), "utf8");

  const s = resultat.synthese;
  console.log(`\n${dossier.raisonSociale} · ${resultat.periode.debut} → ${resultat.periode.fin} · exports : ${resultat.exports.join(", ")}`);
  console.log(`  ${s.nbOperations} opérations Stripe → ${resultat.ecritures.length} écritures`);
  console.log(`  CA HT ${formaterEuros(s.chiffreAffairesHt)} · TVA ${formaterEuros(s.tvaCollectee)} · frais ${formaterEuros(s.fraisStripe)} · virements ${formaterEuros(s.virements)}`);
  console.log("\nContrôles");
  for (const c of resultat.controles.controles) console.log(`  ${c.ok ? "✓" : "✗"} ${c.nom} : ${c.detail}`);
  console.log(
    `  ${verification.ok ? "✓" : "✗"} Format FEC (règles DGFiP et imports ACD, Cegid, MyUnisoft, Sage) : ${
      verification.ok ? `${verification.lignes} lignes conformes` : `${verification.problemes.length} problème(s)`
    }`,
  );
  for (const p of verification.problemes.slice(0, 20)) console.log(`      - [${p.regle}]${p.ligne ? ` ligne ${p.ligne}` : ""} ${p.detail}`);
  console.log(`\nPoints à vérifier (${resultat.anomalies.length})`);
  for (const a of resultat.anomalies) console.log(`  [${a.niveau}] ${a.reference} : ${a.message}`);
  console.log(`\nFEC     ${cheminFec}\nRapport ${cheminRapport}\n`);

  return resultat.controles.ok && verification.ok ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
