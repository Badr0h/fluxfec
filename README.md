# FluxFEC

> **Projet arrêté le 16 octobre 2026.** Ce dépôt est conservé en archive. Aucun service n'est proposé : n'envoyez pas d'export Stripe.

FluxFEC transformait l'export Stripe d'un client en fichier des écritures comptables (FEC), prêt à importer dans le logiciel d'un cabinet d'expertise comptable : ACD, Cegid, MyUnisoft ou Sage.

Le cabinet ne voit qu'une ligne de banque, « STRIPE 638,62 € ». Derrière, il y a des ventes, de la TVA, des frais et parfois un remboursement. FluxFEC reconstitue ce détail : vente au brut, TVA séparée, commission en 627, virement interne en 58, écritures équilibrées et lettrées, et un rapport de contrôle.

## Pourquoi c'est arrêté

Le projet a été testé auprès des cabinets avant de construire le produit complet, avec une règle fixée à l'avance : continuer seulement avec au moins 3 engagements payants.

- 124 cabinets contactés par email, environ 90 invités sur LinkedIn, 70 relances : aucun essai, aucun engagement.
- La douleur est faible pour un cabinet généraliste : peu de dossiers Stripe, et une saisie au net jugée « assez bonne ».
- Ceux qui ont vraiment le problème ont déjà une solution : connecteurs natifs (Pennylane, Tiime) ou convertisseurs déjà vendus moins cher, dans des packs plus larges.

Le bilan complet et le déroulé sont dans [`PROJET.md`](PROJET.md).

## Ce qui reste dans le dépôt

| Dossier | Contenu |
|---|---|
| `moteur/` | L'outil en ligne de commande (TypeScript, 90 tests). Il lit deux CSV Stripe et le paramétrage d'un dossier, puis écrit un FEC et un rapport HTML. |
| `landing/` | La page de présentation, toujours en ligne en démonstration : [fluxfec.vercel.app](https://fluxfec.vercel.app/). |
| `brainstorming/` | L'étude de marché, la revue de la concurrence et le plan de départ. |

Les données de prospection (cabinets, contacts, messages) n'ont jamais été versionnées et ne sont pas publiées.

## Essayer le moteur

Depuis le dossier `moteur/` :

```bash
npm install
npm run demo
npm test
```

`npm run demo` lit un mois fictif de septembre et écrit dans `moteur/out/` :

- un FEC nommé comme l'exige l'administration (`SIRENFECAAAAMMJJ.txt`) ;
- `rapport.html`, le contrôle du mois (équilibre, solde du compte 517, points à vérifier).

Le mode d'emploi est dans [`moteur/IMPORT.md`](moteur/IMPORT.md) : quels CSV exporter depuis Stripe, comment régler les comptes, comment importer dans ACD, Cegid, MyUnisoft ou Sage.

## Ce que le moteur traite

Ventes, frais, virements vers la banque, remboursements, frais isolés, litiges. Les devises étrangères et les opérations inconnues sont signalées dans le rapport.

Chaque dossier a son JSON : SIREN, journaux, comptes, taux de TVA. L'exemple est `moteur/exemples/dossier-exemple.json`.

Limites : Stripe uniquement, pas d'autoliquidation de TVA sur les frais, jamais importé dans un vrai logiciel ni passé par Test Compta Demat (DGFiP).

## Documents

| Document | Contenu |
|---|---|
| [`PROJET.md`](PROJET.md) | Bilan d'arrêt, produit, concurrence, démarche, journal. |
| [`brainstorming/strategie.md`](brainstorming/strategie.md) | Le plan de départ : problème, schéma comptable, étapes, critères d'arrêt. |
| [`brainstorming/etude-marche.md`](brainstorming/etude-marche.md) | Pourquoi cette idée, et les pistes écartées. |
| [`brainstorming/revalidation-concurrence.md`](brainstorming/revalidation-concurrence.md) | Ce que les concurrents font déjà. |
| [`moteur/IMPORT.md`](moteur/IMPORT.md) | Exporter depuis Stripe, contrôler le FEC, l'importer. |
