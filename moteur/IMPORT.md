# Exporter depuis Stripe, importer dans le logiciel du cabinet

Ce guide est pour la personne qui produit le fichier : le cabinet, ou nous pendant un appel. Le paramétrage d'un dossier se fait dans un JSON du même genre que `exemples/dossier-exemple.json`. Pour rejouer le mois fictif déjà préparé :

```bash
npm run demo
```

Les fichiers arrivent dans `out/` : un FEC (`SIRENFECAAAAMMJJ.txt`) et `rapport.html`.

## 1. Côté Stripe (le client ou le cabinet)

Deux fichiers CSV sur la même période, depuis **Rapports > Solde** :

1. **Balance change from activity** > Télécharger > **Itemized**. Dans « Colonnes », ajouter `source_id`, `customer_facing_amount`, `customer_facing_currency`, `automatic_payout_id` (sans elles, le lettrage des remboursements/litiges et les devises sont moins précis ; le moteur le signale).
2. **Payouts** > Télécharger > **Itemized** : ce rapport contient les virements vers la banque, absents du premier.

Fuseau horaire : choisir Europe/Paris, sinon une vente de 23 h 30 le 30 tombe le 1er du mois suivant.
L'export « Transactions » du tableau de bord (Solde > Toutes les transactions > Exporter) est aussi accepté.

```bash
npx tsx src/cli.ts --csv activite.csv --csv virements.csv --dossier dossier.json --sortie out/
```

## 2. Le fichier produit

`SIRENFECAAAAMMJJ.txt` : format de l'article A47 A-1 du LPF, 18 colonnes, tabulation, CRLF, ISO-8859-15, dates AAAAMMJJ, virgule décimale, montant en devise signé. Avant d'être écrit, il est relu par `verifierFec` qui applique :

| Règle | Source |
|---|---|
| Nom, en-tête, 18 champs, pas de « \| » dans un texte, dates, montants | Test Compta Demat (DGFiP) |
| Numérotation continue par journal, ordre chronologique, dates dans l'exercice | BOFiP BOI-CF-IOR-60-40-20, MyUnisoft |
| Équilibre par écriture et par jour/journal | MyUnisoft |
| 40x/41x avec auxiliaire, aucun auxiliaire ailleurs | ACD, Sage, Cegid |
| Comptes 6 à 13 caractères, classe 1 à 8, sans accent ; journaux 1 à 3 caractères | ACD, Sage, MyUnisoft |
| Intitulés ≤ 35 caractères | Sage |

Validation officielle : passer le fichier dans **Test Compta Demat** (gratuit, Windows) : <https://www.economie.gouv.fr/dgfip/outil-de-test-des-fichiers-des-ecritures-comptables-fec>

## 3. Côté logiciel de production

Avant tout import : l'exercice doit être ouvert, les journaux (VT, ST par défaut) créés ou créables, et le plan comptable du dossier doit accepter les comptes du paramétrage (517100, 580000, 627800, 471000, auxiliaire CSTRIPE…). Adapter `dossier.json` au plan du cabinet plutôt que l'inverse.

- **ACD** : Outils > Importation > **Importation FEC**. Cocher « Rupture par pièce ». Ne pas cocher l'ajout des racines « C »/« F » : l'auxiliaire est déjà `CSTRIPE`.
- **Cegid Loop** : import FEC (également disponible par API) ; le lettrage est repris, les modes de paiement et pièces jointes ne le sont pas.
- **MyUnisoft** : Imports > **Import FEC** sur l'exercice concerné ; refus si des écritures sortent de l'exercice ou si un journal n'est pas équilibré sur une journée.
- **Sage** (Active / 100) : import FEC sur un exercice ouvert, journaux créés au préalable ; Sage Active ne reprend pas le lettrage.
- **Quadra, EBP, Inqom…** : import FEC standard ; à valider avec le premier cabinet utilisateur.

Importer une seule fois chaque fichier : la plupart des logiciels ajoutent les écritures en double si on réimporte.
