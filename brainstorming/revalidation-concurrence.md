> Note de recherche, pas le plan en cours. Le plan à jour est [`strategie.md`](strategie.md). Cette note serre le premier GO : finHero couvre déjà beaucoup de prestataires de paiement, mais pas les formats français.

# Relecture de la concurrence : rapprochement multi-prestataires vers le FEC

**Verdict : on passe d'un GO franc à un GO conditionnel, et c'est tout juste. La différenciation « multi-processeurs » ne tient plus. finHero, l'un des deux concurrents allemands cités comme « preuve de marché », propose déjà exactement ce moteur : Stripe, PayPal, Mollie, Adyen, Paddle et Lemon Squeezy, avec export vers DATEV, BMD, bexio et Abacus.\[1\] Il est donc déjà présent en Suisse. Il ne lui manque que les formats français.** Il reste une fenêtre étroite : aucun outil trouvé ne produit aujourd'hui un FEC ou un import ACD/Cegid/MyUnisoft à partir de plusieurs PSP. Mais cette fenêtre ne justifie pas de construire avant une validation commerciale payante auprès de cabinets qui n'utilisent pas Pennylane. Je place ma confiance dans le fait que l'idée débouche sur un business significatif (plus de 10 k€ de MRR) à environ 30 %. Elle est d'environ 60 % pour un petit produit rentable de niche.

## TL;DR

- **La différenciation multi-PSP est morte comme concept, mais pas encore sur le marché français.** finHero connecte déjà les 6 processeurs visés (plus Adyen) à 4 logiciels germanophones et suisses, pour 29 €/mois. Aucun outil n'exporte 2 PSP ou plus vers le FEC ou vers les logiciels de cabinets français. Le vrai différenciateur restant, ce sont les formats français (FEC, ACD, Cegid/Quadra, MyUnisoft), pas le nombre de PSP.
- **La « preuve allemande » est plus faible qu'annoncé.** À 29 €/mois et avec « 200+ » clients revendiqués, finHero plafonne vraisemblablement à quelques milliers d'euros de MRR. Ses témoignages clients utilisent au moins en partie des photos issues de banques d'images. MiracleSync n'a qu'un seul avis Trustpilot. C'est la preuve d'un marché de niche solvable, pas d'un modèle scalable.
- **La décision est de valider avant de coder.** Il faut obtenir au moins 5 engagements payants de cabinets sous ACD/Cegid/MyUnisoft/Sage (hors Pennylane), avec plusieurs dossiers clients multi-PSP chacun. Sans cela, c'est NO-GO. Le risque n°1 est que le segment payant réel soit minuscule : Stripe domine, Pennylane absorbe gratuitement Stripe et Mollie, et finHero peut ajouter un export FEC en quelques semaines.

## Key Findings

### 1. Concurrence multi-PSP : le constat le plus important de cette re-validation

- **finHero (d-automation GmbH) est déjà multi-processeurs.** Sa page d'accueil affirme qu'il « konsolidiert deine Zahlungen aus Stripe, PayPal, Mollie, Adyen, Paddle und Lemon Squeezy zu einem import-fertigen Buchungsstapel für DATEV, BMD, bexio oder Abacus ». Il gère explicitement les cas difficiles que l'idée comptait couvrir : « Stripe-Connect-Splitting, Mollie-Settlements, Reverse-Charge für Merchant of Record (Paddle & Lemon Squeezy) und EZB-Kursumrechnung für Fremdwährungen bei PayPal ». Il affiche aussi une logique « eigenes Geld- und Transitkonto » par PSP, soit un compte de transit par processeur.\[1\]
- **Il est déjà en Suisse.** bexio et Abacus sont les logiciels dominants des PME suisses, y compris en Romandie.\[2\] La cible « Suisse francophone » du projet est donc déjà adressée, au moins pour les entreprises suisses sous bexio ou Abacus. Je n'ai trouvé aucune page ou mention en français de finHero, ni aucun plan public pour le FEC ou Pennylane.
- **En France, rien ne couvre 2 PSP ou plus vers le FEC ou les logiciels de cabinets.**
  - ReconcileKit fait Stripe uniquement : CSV vers FEC, Sage, EBP, Cegid ou Pennylane. Il revendique « +120 cabinets et freelances », un chiffre non vérifié.\[3\]
  - Truc de Comptable propose des convertisseurs FEC pour Stripe, Payfit, American Express, Shine, SumUp et GoCardless, à partir de 60 € HT par an. Pour PayPal, il n'offre qu'un tutoriel de récupération de relevé PDF, pas de convertisseur.\[4\]\[5\]
  - Acomim couvre Stripe, Shopify, Amazon et Cdiscount vers Abby, Indy et Pennylane.\[6\] Il n'a ni Paddle, ni Lemon Squeezy, ni FEC pour cabinets.
  - Aucune recherche « Paddle FEC », « Lemon Squeezy FEC », « Mollie FEC » ou « PayPal FEC » n'a fait apparaître d'outil dédié.
- **Interprétation.** L'idée n'est pas « inventée ailleurs et absente ici ». Elle est construite ailleurs, par un acteur qui a déjà fait l'expansion multi-PSP et multi-pays, et qui est à un module d'export du marché français. Le FEC est un format public, normé et documenté : c'est l'intégration la plus simple de la liste.\[7\] Votre avantage défendable ne peut donc pas être le FEC seul. Il doit venir des formats natifs des logiciels de cabinets (ACD, Cegid/Quadra, MyUnisoft, Sage Génération Experts), de la maîtrise des règles françaises (PCG, TVA, comptes 511/58/627/666/766) et de la distribution auprès des cabinets.

### 2. Chift : risque d'infrastructure confirmé, mais sans Paddle ni Lemon Squeezy

- La documentation Chift liste 5 connecteurs de paiement : Mollie (« Live (Private) »), PayPal (« Live »), Stripe (« Live »), GoCardless (« Live ») et SumUp (« Live »). Paddle et Lemon Squeezy n'y figurent pas.\[8\]
- Chift couvre donc déjà 3 des 5 PSP visés (Stripe, PayPal, Mollie). Il alimente l'intégration Mollie–Pennylane : le centre d'aide Pennylane indique que « L'intégration entre Pennylane et Mollie repose sur le connecteur Chift ».\[9\]
- Je n'ai pas pu vérifier d'annonce 2025–2026 d'ajout de Paddle ou Lemon Squeezy, faute de budget de recherche. Il faut le traiter comme une inconnue et non comme une absence confirmée.
- **Implication.** Chift vend des tuyaux aux éditeurs, pas une logique comptable.\[10\]\[11\] Un éditeur comme Pennylane, Sage ou Cegid peut toutefois brancher Stripe, PayPal et Mollie en quelques sprints via Chift. Le multi-PSP « commun » (Stripe, PayPal, Mollie) est donc structurellement exposé à une commoditisation par les éditeurs eux-mêmes.

### 3. Pennylane : la limite mono-devise n'est pas corrigée, mais c'est un faible fossé

- Le fil « Multi-devises Stripe » du forum Pennylane date d'environ 4 mois. Un utilisateur y écrit : « il est actuellement possible de sélectionner une seule devise […] 500€ visibles mais 7000$ non pris en compte ».\[12\] La seule réponse d'un « Pennylaneur » est une question de clarification : « Vous ne parvenez pas à selectionner plusieurs devises stripe sur un même compte? ».\[12\] Il n'y a ni engagement ni feuille de route.
- La page d'aide officielle « Connecter Stripe à Pennylane », mise à jour récemment, ne mentionne aucun support multi-devises.\[13\]
- Pour PayPal, Pennylane passe par agrégation bancaire (Powens/Bridge). Un membre du forum confirme que si les deux devises « ne sont pas exposées comme 2 comptes distincts, Pennylane ne peut pas “séparer” automatiquement les flux EUR et USD ».\[14\]
- **Interprétation.** Le point de douleur existe toujours. Mais selon son communiqué du 4 décembre 2025 annonçant le passage des 100 M€ d'ARR (relayé par Compta Online), Pennylane « accompagne aujourd'hui plus de 6 000 cabinets et 700 000 entreprises clientes », et ses intégrations Stripe et Mollie sont incluses gratuitement. Il peut corriger ce problème à tout moment. Bâtir la proposition de valeur sur un bug d'un acteur dominant est fragile. Il faut viser les cabinets qui ne sont pas sous Pennylane.

### 4. Preuve directe de disposition à payer pour « multi-PSP + formats français » : absente

- Je n'ai trouvé aucun post de fondateur SaaS ou de cabinet français demandant explicitement un outil multi-processeurs vers le FEC.
- Les preuves de douleur multi-PSP proviennent surtout d'intégrateurs et de cabinets qui vendent du service :
  - un intégrateur Pennylane décrit la réconciliation Stripe + PayPal comme « un cauchemar » ;\[15\]
  - un développeur freelance vend des scripts sur mesure Stripe/Shopify/PayPal vers Pennylane ;\[16\]
  - Excilio propose la migration de relevés PayPal/Mollie.\[17\]
- Ce sont des signaux réels, mais biaisés par le marketing. Ils montrent aussi que la douleur est aujourd'hui absorbée par du service humain et du sur-mesure, et non par un produit.
- La source primaire la plus solide reste l'article Compta Online de 2020 de Fabrice Heuvrard (« Stripe qui ne dispose pas d'export FEC »).\[18\] Or son auteur a lui-même construit la réponse, Truc de Comptable, et n'a pas jugé utile d'ajouter PayPal, Mollie ou Paddle. C'est un indice que la demande non-Stripe est faible.

### 5. Taille du marché : la part non-Stripe est étroite

- Wappalyzer suit Mollie sur 1 800 sites actifs selon la page consultée (9 700 selon un extrait de recherche : le chiffre est incohérent). La France en représente 9 %, soit environ 160 à 870 sites. À titre de comparaison, le même outil compte environ 460 000 sites pour Stripe et 870 000 pour PayPal.\[19\]
- Mollie revendique 250 000 clients dans son communiqué de résultats 2024 (3 juin 2025), où son CEO Koen Köppen cite « Our 250,000 customers » (pour 214 M€ de chiffre d'affaires en 2024), sans chiffre pour la France.
- Je n'ai trouvé aucune donnée sur Paddle en France.
- Lemon Squeezy est en cours d'absorption. Dans le billet « 2026 Update: Lemon Squeezy + Stripe Managed Payments » du 28 janvier 2026, son cofondateur JR Farr écrit : « Our goal is to provide Lemon Squeezy users an easy way to migrate to Stripe Managed Payments ». Ce segment va mécaniquement fondre ou se transformer en flux Stripe, avec une logique de merchant of record différente.
- **Interprétation.** Pour un SaaS français, la combinaison typique est Stripe seul, ou Stripe + PayPal. Pour un e-commerçant, c'est Shopify Payments/Stripe + PayPal, parfois Mollie. Paddle et Lemon Squeezy concernent surtout des indie hackers, qui sont souvent en micro-entreprise, non soumis au FEC et très sensibles au prix.\[20\]\[21\] Le « multi-processeurs » pertinent en France, c'est surtout **Stripe + PayPal (+ Mollie)**, justement le trio que Chift couvre déjà.

### 6. Barrières réglementaires : modérées, mais à clarifier juridiquement

- La DSP2 soumet à enregistrement auprès de l'ACPR les prestataires de services d'information sur les comptes (PSIC/AISP), qui agrègent des informations de comptes de paiement.\[22\]\[23\]
- Lire les données d'un compte marchand via l'API du PSP, avec une clé en lecture seule fournie par le marchand (le modèle de finHero, qui revendique « read-only, ohne Zugriff auf dein Geld »), est un schéma courant.\[1\] finHero, MiracleSync, Chift, ReconcileKit et Acomim opèrent ainsi. Je n'ai toutefois pas vérifié leur statut réglementaire.
- La zone grise concerne PayPal : un compte PayPal est un compte de paiement, et Pennylane choisit de passer par un agrégateur agréé (Powens/Bridge).\[14\]
- **Recommandation.** Consulter un avocat fintech avant de lancer, et privilégier les API marchandes officielles (OAuth Stripe Apps, API PayPal/Mollie/Paddle) plutôt que le scraping ou l'agrégation bancaire.
- Côté RGPD, prévoir un contrat de sous-traitance (DPA) et un hébergement dans l'UE : finHero met en avant ses « Servern in Deutschland ».\[1\]
- La réforme de la facturation électronique n'est pas un obstacle direct, mais elle va pousser les éditeurs et les plateformes agréées à intégrer davantage les flux de paiement.\[24\]

### 7. Tentatives abandonnées : aucune trouvée

- Je n'ai identifié aucun projet mort de ce type, mais faute de budget, la recherche n'a pas été exhaustive.
- Le signal inverse est plus parlant : l'écosystème est rempli de micro-outils (ReconcileKit, Truc de Comptable, Acomim) qui restent tous centrés sur Stripe. Aucun n'est devenu une plateforme. Cela ressemble moins à un espace vierge qu'à un marché où les petits acteurs n'arrivent pas à grossir.

### 8. La « preuve allemande » réexaminée

- **finHero :**
  - « 200+ Unternehmen », « 48.000.000 € » de volume Stripe exporté, un tarif unique affiché de 29 €/mois et un premier export gratuit.\[1\]
  - Même si les 200 clients payaient tous, cela ferait au plus environ 5 800 €/mois (environ 70 k€ d'ARR). C'est un side-business, pas une scale-up.
  - L'éditeur d-automation GmbH mène d'autres projets en parallèle (Sepaheld, NpsHero, un outil de planning poker), ce qui signe un studio indie.\[1\]
  - Les avatars de la section clients sont en partie hébergés sur images.unsplash.com, c'est-à-dire des photos de stock.\[1\] Cela jette un doute sur l'authenticité d'au moins une partie des témoignages.
  - L'extension de Stripe seul vers 6 PSP et 4 logiciels se lit de deux façons : soit une croissance, soit le signe que le marché Stripe → DATEV seul était trop petit.
- **MiracleSync :**
  - 1 seul avis Trustpilot.\[25\]
  - Il se présente comme développé par le fondateur « zusammen mit einem kleinen Team ».\[26\]
  - Il se diversifie vers sevdesk, Lexware Office et l'e-facture (MiracleBill à 0,20 € par facture).\[27\]\[28\]
- **Contexte structurel défavorable pour la France.** L'Allemagne a un point de convergence unique, DATEV, où arrivent presque tous les cabinets (Steuerberater).\[29\] La France est fragmentée entre ACD, Cegid/Quadra, Sage, MyUnisoft, Inqom, EBP et Pennylane. Il y a davantage de formats à maintenir pour un marché de même taille ou plus petit, et le FEC ne sert que de plus petit dénominateur commun.
- **Conclusion.** L'analogue allemand prouve qu'on peut vendre ce produit, pas qu'on peut en vivre confortablement. Aucun signe de levée de fonds n'a été trouvé pour ces acteurs.

## Recommandations

1. **Repositionner.** Abandonner « multi-processeurs » comme message principal. Le positionnement devient : « le connecteur PSP pour les cabinets qui ne sont pas sous Pennylane ». Cela veut dire un import natif ACD, Cegid/Quadra, MyUnisoft et Sage Génération Experts, un lettrage des payouts, les frais en compte 627, les écarts de change en 666/766, et un compte de transit par PSP. Le multi-PSP devient une fonctionnalité, pas la promesse.
2. **Valider avant de coder (condition du GO), en 4 à 6 semaines :**
   - Contacter 30 à 50 cabinets e-commerce ou SaaS hors Pennylane, via LinkedIn, Compta Online et les clubs d'utilisateurs ACD et MyUnisoft.
   - Seuil GO : au moins 5 cabinets qui pré-paient ou signent une lettre d'intention à 49 €/mois ou plus par cabinet, avec au moins 3 dossiers multi-PSP chacun.
   - Seuil NO-GO : moins de 2 engagements, ou des cabinets qui répondent « Pennylane le fait » ou « on facture le temps au client ».
3. **Livrer d'abord Stripe + PayPal vers FEC et un format natif (ACD ou MyUnisoft).** Ajouter Mollie ensuite. Déprioriser Lemon Squeezy, qui migre vers Stripe, ainsi que Paddle, dont le marché est incertain en France.
4. **Surveiller finHero.** Une page en français ou un export FEC de sa part réduirait fortement la fenêtre. Envisager aussi l'option de partenariat ou de licence de son moteur, voire de revente de votre couche française.
5. **Faire valider par un juriste** le mode d'accès aux données PayPal et PSP au regard de la DSP2 et du RGPD avant tout lancement commercial.

## Caveats

- Je n'ai pas pu fetcher les pages d'intégrations détaillées de finHero ni les changelogs 2025–2026 de Chift. L'absence de plan FEC chez finHero et de Paddle ou Lemon Squeezy chez Chift est une absence de preuve, pas une preuve d'absence.
- Les chiffres de clients (finHero 200+, ReconcileKit 120+, Pennylane 700 000 entreprises et 6 000 cabinets selon son communiqué de décembre 2025) sont déclaratifs.
- Les données Wappalyzer sur Mollie sont incohérentes (1 800 contre 9 700 sites) et ne reflètent qu'un échantillon.
- Le calendrier et les conditions de migration de Lemon Squeezy restent mouvants, et les sources secondaires se contredisent sur les tarifs de Stripe Managed Payments.\[30\]\[31\]

**Le risque n°1 à surveiller :** le segment payant pourrait être trop petit pour justifier le coût de maintenance de 5 à 6 formats français. Pennylane capte gratuitement les dossiers Stripe et Mollie, les cabinets absorbent le reste en temps facturé, et un finHero déjà multi-PSP peut ajouter le FEC plus vite que vous ne construirez vos connecteurs.

## Sources

1. [finHero](https://fin-hero.de/)
2. [Best Accounting Software Switzerland 2026: Bexio vs Abacus vs Alternatives - SME Comparison - Scalemetrics](https://www.scalemetrics.ai/best-accounting-software-swiss-smes-2026/)
3. [Stripe et comptabilité française : le guide complet 2025](https://www.reconcilekit.fr/blog/stripe-comptabilite-guide-complet)
4. [Truc de Comptable - Outils & Tutoriels Gratuits pour Experts-Comptables](https://trucdecomptable.fr/)
5. [Le concepteur | Truc de Comptable](https://trucdecomptable.fr/le-concepteur.html)
6. [Les meilleurs outils de comptabilité compatibles avec Stripe pour les entreprises françaises](https://acomim.com/fr/blog/les-meilleurs-outils-de-comptabilite-compatibles-avec-stripe-pour-les-entreprises-francaises)
7. [pypi.org](https://pypi.org/project/odoo8-addon-l10n-fr-fec/8.0.0.2.0.99.dev3/)
8. <https://docs.chift.eu/connectors/payments/overview>
9. [Connecter Mollie à Pennylane | Centre d'aide Pennylane](https://help.pennylane.com/fr/articles/250803-connecter-mollie-a-pennylane)
10. [API Paiement Unifiée | Chift](https://www.chift.eu/fr/categories/paiement)
11. [Intégration API Stripe | Chift](https://www.chift.eu/fr/tools/stripe)
12. [Multi-devises Stripe | Pennylane](https://community.pennylane.com/discussions/forum-integrations/multi-devises-stripe/37021)
13. [Connecter Stripe à Pennylane | Centre d'aide Pennylane](https://help.pennylane.com/fr/articles/18784-connecter-stripe-a-pennylane)
14. [Question sur intégration PayPal à penny Lane | Pennylane](https://community.pennylane.com/discussions/forum-parametre/question-sur-int%C3%A9gration-paypal-%C3%A0-penny-lane/34683)
15. [API Pennylane : Guide Complet 2026 et connecteur](https://blog.tout-pour-la-gestion.com/api-pennylane-guide-complet-2026-automatiser-votre-comptabilite-e-commerce-caisse-negoce/)
16. [Lettrage automatique Pennylane : pourquoi Stripe et Shopify bloquent tout](https://fatoucsdeveloper.com/lettrage-pennylane-impossible-le-vrai-probleme-des-virements-stripe-et-shopify-et-la-solution/)
17. [Expert‑comptable Stripe | Flux, paiements & pilotage e‑com](https://www.excilio.fr/expert-comptable-stripe)
18. [Comptabilisation des flux issus de Stripe](https://www.compta-online.com/comptabiliser-les-flux-issus-de-stripe-plateforme-de-paiement-en-ligne-ao4650)
19. [Websites using Mollie - Wappalyzer](https://www.wappalyzer.com/technologies/payment-processors/mollie/)
20. [Export comptable artisan 2026 : FEC, livre de recettes, délais | Kelyseo](https://www.kelyseo.com/blog/export-comptable-artisan-comment-preparer)
21. [Stripe vs Paddle vs Lemon Squeezy : quel processeur de paiement choisir pour ton SaaS en 2026 ?](https://foundertrace.substack.com/p/stripe-vs-paddle-vs-lemon-squeezy)
22. [DSP2 et RGPD : accès aux données de paiement, consentement et agrégateurs en 2026](https://www.legiscope.com/blog/dsp2-donnees-bancaires-rgpd.html)
23. [Deuxième directive européenne sur les services de paiement – DSP2 - La finance pour tous](https://www.lafinancepourtous.com/decryptages/finance-perso/banque-et-credit/directives-europeennes-sur-les-services-de-paiement/deuxieme-directive-europeenne-sur-les-services-de-paiement-dsp2/)
24. [API Stripe | Pennylane](https://community.pennylane.com/discussions/forum-facturation-electronique/api-stripe/34325)
25. [Bewertungen zu MiracleSync | Lesen Sie Kundenbewertungen zu miraclesync.de](https://de.trustpilot.com/review/miraclesync.de)
26. [Für Kanzleien: Stripe Datev Integration (Export, Schnittstelle)](https://www.miraclesync.de/fuer-steuerberater)
27. [MiracleSync - Stripe in Ihre Buchhaltung integrieren](https://www.miraclesync.de/)
28. [Stripe E-Rechnung MiracleBill](https://www.miraclesync.de/stripe-e-rechnung)
29. [DATEV](https://en.wikipedia.org/wiki/DATEV)
30. [Lemon Squeezy vs Stripe Fees and the MoR Premium - Paritydeals](https://www.paritydeals.com/lemon-squeezy-vs-stripe-fees/)
31. [Lemon Squeezy Acquired by Stripe: What This Means for SaaS Founders in 2026](https://fungies.io/lemon-squeezy-stripe-acquisition-saas-founders-2026/)
