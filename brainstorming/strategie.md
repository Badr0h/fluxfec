# Projet : connecteur de paiements pour cabinets comptables

Document de référence. Tout ce qu'on sait, ce qu'on construit, pourquoi, et dans quel ordre — de l'idée jusqu'au revenu récurrent (section 6, Étapes 1 à 11).
Dernière mise à jour : 30 septembre 2026 (projet arrêté le 16 octobre 2026).

Pour une lecture courte du dépôt, commencer par le [README](../README.md).

## Où on en est

**Projet arrêté le 16 octobre 2026.** Ce document est le plan tel qu'il a été écrit au départ. Le déroulé réel et le bilan sont dans [`PROJET.md`](../PROJET.md).

Les fichiers `semaine-1.md` et `liste-prospects.md`, cités plus bas, ont été retirés du dépôt public : ils contenaient les coordonnées des cabinets contactés.

---

## 1. L'idée en une phrase

Un outil pour les **cabinets d'expertise comptable français qui ne sont pas sur Pennylane** : il transforme les flux Stripe (puis PayPal) de leurs clients en **écritures comptables prêtes à importer** dans leur logiciel (ACD, Cegid, MyUnisoft…), avec le plan comptable propre à chaque dossier.

Ce n'est **pas** « un outil multi-processeurs pour tout le monde ». C'est un outil **de cabinet**, pensé pour le métier comptable français.

---

## 2. Le problème qu'on résout

Quand une entreprise encaisse via Stripe :

- Stripe verse sur la banque un **virement groupé net** (le « payout »), qui mélange des dizaines de ventes, moins les frais, moins les remboursements.
- Le comptable voit « STRIPE 1 243,57 € » sur le relevé et doit retrouver **quelles ventes**, **quels frais**, **quelle TVA**, **quels remboursements** composent ce montant.
- Stripe ne sort **pas de FEC** et ne passe pas par les canaux bancaires habituels des cabinets (Jedeclare, SoBank).
- Résultat : saisie manuelle, macros Excel maison, ou dossier saisi « au net » (chiffre d'affaires faux, frais oubliés).

Preuves que la douleur existe :

- Fabrice Heuvrard, expert-comptable, sur Compta Online : Stripe est « un casse-tête pour le cabinet », il a dû coder une macro VBA, et termine par « Une idée de plateforme à lancer ? ».
- Forum Pennylane : frais Stripe manquants, multi-devises limité à une devise.
- Des cabinets se vendent comme « expert-comptable Stripe » : la douleur est aujourd'hui payée en heures humaines.

---

## 3. Le marché et la concurrence

### Ce qui existe

| Acteur | Ce qu'il fait | Prix | Pourquoi il ne nous bloque pas |
|---|---|---|---|
| **Pennylane** | Connexion Stripe incluse, écritures automatiques | Inclus dans l'abonnement | Ne sert qu'aux cabinets **sous Pennylane**. Inutile pour un cabinet ACD ou Cegid. |
| **ReconcileKit** | Dépôt d'un CSV Stripe, sortie FEC, Sage, EBP, Cegid, Pennylane | 19 €/mois | Outil ponctuel pour une personne : Stripe seul, pas d'ACD ni de MyUnisoft, pas de multi-dossiers, mapping simplifié (TVA absente). |
| **Truc de Comptable** (Heuvrard) | Convertisseurs FEC locaux (Stripe, SumUp, GoCardless…) | 60 € HT/an (toute la boîte à outils) | Convertisseur de fichier, sans paramétrage par dossier, sans PayPal, sans suivi cabinet. |
| **finHero** (Allemagne) | Exactement notre produit : Stripe, PayPal, Mollie, Paddle… par clé API | 29 €/mois | **Aucun format français**. Allemagne, Autriche, Suisse uniquement. |
| **MiracleSync** (Allemagne) | Stripe vers DATEV, sevdesk | à partir de 11 €/mois | Allemagne, Stripe seul. |
| **Acomim** | Stripe, Shopify, Amazon vers Pennylane, Abby, Indy | Freemium | Vise les petites entreprises, pas les logiciels de production des cabinets. |
| **Chift** | Tuyaux API pour éditeurs de logiciels | Vendu aux éditeurs | Ne vend pas aux cabinets et ne fait pas la logique comptable française. |

### Lecture du marché

- **Autour** de nous, c'est plein. **Au milieu**, là où on se place, c'est presque vide.
- Personne ne vend aujourd'hui à un cabinet ACD, Cegid ou MyUnisoft un outil qui gère **tous ses dossiers Stripe** proprement.
- Le vrai risque n'est **pas la concurrence**, c'est que ce trou soit **trop petit** pour faire vivre un produit.
- Menaces à surveiller : finHero qui ajoute un FEC ; Pennylane qui continue de gagner des cabinets ; un éditeur (Cegid, ACD) qui branche Stripe via Chift.

### Pourquoi y aller quand même

1. **Tester ne coûte presque rien** : un mois d'appels, zéro code.
2. **La douleur est écrite** par des experts-comptables eux-mêmes.
3. **Le modèle est prouvé en Allemagne** : on ne parie pas sur l'existence du besoin, seulement sur sa taille en France.
4. **On part avec de l'avance** : l'expérience de comptyx (exports DATEV, Xero, QuickBooks).

---

## 4. Notre positionnement et nos points forts

**Message à dire aux cabinets :**
> « Le connecteur Stripe/PayPal pour les cabinets qui ne sont pas sous Pennylane. Vos écritures, à votre plan comptable, dans votre logiciel. »

On ne gagne **ni sur le nombre de PSP** (finHero en a plus), **ni sur le prix** (ReconcileKit est à 19 €). On gagne parce qu'on est **pensé pour le cabinet français** :

| Point fort | Ce que ça veut dire concrètement | Qui ne le fait pas |
|---|---|---|
| **Multi-dossiers** | Un seul compte cabinet, tous ses clients Stripe dedans | ReconcileKit, Truc de Comptable |
| **Paramétrage par dossier** | Comptes, journaux, TVA propres à chaque client. Pas de 411000/706000 codés en dur. | ReconcileKit |
| **Le vrai schéma comptable** | Stripe en 517, frais en 627, virements en 58 lettrés avec la banque, TVA séparée, change en 666/766 | Les convertisseurs simples |
| **Choix du niveau de détail** | Une écriture par paiement (SaaS) ou un journal par virement / par jour (e-commerce à 3 000 commandes) | La plupart |
| **Format natif du logiciel** | Import ACD, Cegid (TRA), MyUnisoft, en plus du FEC | finHero (pas de France), ReconcileKit (pas d'ACD ni MyUnisoft) |

**Honnêteté :** aucun de ces points n'est impossible à copier. Notre protection à terme :
1. la **relation avec les cabinets** (on ne change pas d'outil une fois installé dans les habitudes) ;
2. l'**accumulation de cas particuliers bien gérés** (litiges, devises, remboursements partiels, Stripe Capital…).

---

## 5. Comment fonctionne le produit

### Le schéma comptable de base (méthode Heuvrard)

| Flux Stripe | Écriture générée |
|---|---|
| **Encaissement** (`charge`) | Débit 517 (net) + débit 627 (frais) / crédit 411 (TTC). Vente séparée : débit 411 / crédit 706-707 (HT) + 44571 (TVA). Numéro de pièce = identifiant Stripe. |
| **Virement vers la banque** (`payout`) | Débit 58 / crédit 517. Le 58 se lettre avec la ligne « STRIPE » du relevé bancaire, que le cabinet importe déjà. |
| **Remboursement** (`refund`) | Sortie du 517, contrepartie client ou vente. |
| **Litige** (`dispute`) | Montant repris + frais de litige en 627. |
| **Devise étrangère** | Conversion en euros, écart en 666 (perte) ou 766 (gain). |

Contrôle final : le **solde du compte 517** doit être égal au **solde Stripe** du rapport financier.

Important : **on ne se connecte pas à la banque**. Le rapprochement se fait par le compte 58, contre le relevé que le logiciel du cabinet reçoit déjà. Se brancher aux banques, c'est un autre métier (agrément, coût, support).

### Le parcours du cabinet (version finale)

1. Le cabinet crée son compte et choisit son logiciel (ACD, Cegid, MyUnisoft…).
2. Il ajoute ses dossiers clients et **paramètre chaque dossier une fois** : comptes, journaux, TVA, niveau de détail.
3. Il fournit les données Stripe du client : **CSV** au début, **clé API en lecture seule** plus tard.
4. Le moteur calcule les écritures (ventes, frais, virements, remboursements, change).
5. Le cabinet télécharge le fichier au format de son logiciel et l'importe.
6. Un écran montre, dossier par dossier, **ce qui reste à vérifier** : devises, litiges, remboursements, écart entre solde Stripe et compte 517.

### Les étapes du produit (on ne passe à la suivante que si la précédente est payée)

| Étape | Contenu | Déclencheur |
|---|---|---|
| **0. Démo** | Un fichier d'écritures généré à partir d'un CSV Stripe anonymisé, montré en appel | Maintenant |
| **1. MVP** | Dépôt du CSV Stripe d'un dossier, choix des comptes, téléchargement au format d'**un seul** logiciel (celui que les pilotes demandent) | 3 lettres d'intention |
| **2. Produit cabinet** | Liste des dossiers, paramétrage sauvegardé, PayPal, écran des anomalies | Premiers retours des pilotes |
| **3. Automatique** | Connexion Stripe en lecture seule, synchronisation mensuelle, Mollie, 2e et 3e format | Demande explicite des cabinets |

**Prix de départ à tester :** environ **49 €/mois par cabinet**, avec un tarif fondateur (ex. 39 €/mois bloqué) pour les 5 premiers pilotes.

### Sécurité et confiance (à dire dès le premier appel)

- Hébergement dans l'Union européenne.
- Mode CSV : les données ne sont pas conservées après la génération du fichier.
- Clé API en lecture seule : aucun accès à l'argent.
- Contrat de sous-traitance RGPD (DPA) disponible.
- Transparence : développeur indépendant basé au Maroc, données hébergées en UE.

---

## 6. La démarche, étape par étape

Chaque étape a : **pourquoi**, **comment**, **quand**, **résultat attendu**, et **critère pour passer à la suivante**.

---

### Étape 1 — Préparer la prospection

- **Pourquoi :** sans liste, messages et tableau de suivi, on contacte au hasard et on perd les réponses. Un suivi propre est aussi une obligation RGPD (savoir d'où vient chaque contact, gérer les « stop »).
- **Comment :**
  - Créer un tableau de suivi (Google Sheets ou Notion) avec les colonnes de la section 7.
  - Mettre à jour son profil LinkedIn : « Développeur full-stack · exports comptables · étudiant ingénieur ».
  - Préparer les messages (voir `semaine-1.md`).
- **Quand :** lundi 28 et mardi 29 septembre 2026.
- **Résultat attendu :** tableau prêt, profil propre, 7 messages personnalisés prêts à envoyer.
- **Passage à l'étape suivante :** dès que les 7 messages sont prêts.
- **Fait.** Les messages sont dans `semaine-1.md`. Le suivi est le fichier Excel `prospection/suivi_prospection_cabinets.xlsx`.

---

### Étape 2 — Construire la démo (étape 0 du produit)

- **Pourquoi :** en appel, montrer un vrai fichier d'écritures prouve qu'on connaît le métier. Ça vaut plus qu'un CV. C'est aussi le premier test technique du moteur.
- **Comment :**
  - Prendre un CSV Stripe d'exemple (« balance transactions ») anonymisé.
  - Générer à la main ou par script un fichier FEC avec le schéma 517 / 627 / 58 / 411 / 706 / 44571.
  - Vérifier : débit = crédit, un payout tombe bien sur le 58, le solde 517 colle au solde Stripe.
- **Quand :** mercredi 30 septembre au vendredi 2 octobre 2026.
- **Résultat attendu :** un fichier d'exemple + une capture lisible à envoyer après un appel.
- **Passage à l'étape suivante :** fichier équilibré et compréhensible par un comptable.
- **Fait le 30 septembre 2026.** Le moteur est dans `moteur/`. La commande `npm run demo` produit un FEC et un rapport HTML à partir d'un mois fictif. La validation dans Test Compta Demat (DGFiP, Windows) n'est pas encore faite.

---

### Étape 3 — Premiers contacts (semaine 1)

- **Pourquoi :** tester le message et obtenir les premiers retours de cabinets déjà spécialisés Stripe, avant d'élargir.
- **Comment :** contacter les 12 cabinets de `semaine-1.md`, en double canal (email ou formulaire + LinkedIn), avec un message court, sans vente, qui pose une seule question : « plutôt 1 h ou 10 h par mois, et sur quel logiciel ? ». On ne contacte que des cabinets (clients possibles), jamais des éditeurs d'outils concurrents. Fabrice Heuvrard (Truc de Comptable, concurrent partiel) est mis de côté jusqu'à avoir des lettres d'intention.
- **Quand :** du mardi 29 septembre au vendredi 2 octobre 2026.
- **Résultat attendu :** 12 cabinets contactés, 2 à 4 réponses, idéalement 1 à 2 appels planifiés.
- **Passage à l'étape suivante :** messages envoyés, relances programmées. Si 0 réponse sur 12, on réécrit le message avant d'élargir.
- **Où on en est le 30 septembre au soir.** 23 cabinets contactés. Aucune réponse notée pour l'instant.

---

### Étape 4 — Élargir la prospection

- **Pourquoi :** 7 cabinets ne suffisent pas pour décider. Il faut environ **30 appels**, donc **120 à 200 cabinets** contactés (taux de réponse attendu : 8 à 15 %).
- **Comment :**
  - Tier 1 et Tier 2 de la liste dans `liste-prospects.md`.
  - Google : `"expert-comptable" "Stripe" "PayPal" site:.fr` ville par ville (Lille, Toulouse, Marseille, Rennes, Montpellier…).
  - Annuaire de l'Ordre : annuaire.experts-comptables.org.
  - Communautés : publier une question ouverte sur Compta Online (« comment traitez-vous Stripe et PayPal dans ACD ou Cegid ? »), contacter le podcast CodEC et le think tank CEG.
  - Rythme : 80 à 100 invitations LinkedIn et 40 à 60 emails par semaine. Pas d'outil d'automatisation.
  - Cadence par contact : J0 message, J+3 message LinkedIn, J+5 relance, J+10 un élément utile (schéma d'écritures), J+14 message de clôture.
- **Quand :** du 5 octobre au 13 décembre 2026 (meilleure fenêtre de l'année).
- **Résultat attendu :** 30 appels réalisés.
- **Passage à l'étape suivante :** au 30e appel, on décide (étape 6).

**Les canaux, dans l'ordre de priorité :** le cold email et les formulaires restent en tête, parce que c'est le seul canal qui produit un chiffre exploitable pour la décision GO/NO-GO. Tout le reste vient en appui, jamais à sa place.

| Canal | Priorité | Pourquoi |
|---|---|---|
| Cold email / formulaire | Haute, dès maintenant | Seul canal qui alimente directement le compteur des 30 appels |
| Contenu réutilisé en relance J+10 + SEO (schéma d'écritures, FAQ TVA/devises) | Haute, mais un seul travail pour deux usages | Sert la relance tout de suite, et indexe sur Google pendant des mois sans effort supplémentaire |
| Page LinkedIn entreprise | Basse | Sans audience, une page ne convertit rien. 30 minutes une fois, puis on n'y revient plus avant d'avoir des cabinets clients à montrer |
| Articles sponsorisés / backlinks payants sur des blogs comptables | À ne pas commencer avant la décision GO (Étape 6) | Payer pour de la visibilité avant d'avoir validé que le produit convertit, c'est dépenser sur une hypothèse non testée |
| Backlinks en commission / affiliation | Envisageable après la décision GO | Ne coûte rien tant que ça ne convertit pas — mais vérifier d'abord que le blog a une vraie audience de comptables, pas juste du trafic |

---

### Étape 5 — Les appels de découverte

- **Pourquoi :** c'est là qu'on apprend si le problème vaut de l'argent. On ne vend pas, on écoute.
- **Comment (15 à 20 minutes) :**
  1. Combien de dossiers au total, combien avec Stripe, PayPal, Mollie ?
  2. Quel logiciel de production (ACD, Cegid, Sage, MyUnisoft, Pennylane) ?
  3. Racontez le dernier dossier Stripe traité, étape par étape. Qui, combien de temps ?
  4. Où ça casse : frais, remboursements, virements qui ne collent pas, devises, litiges ?
  5. Qu'avez-vous déjà essayé (macro, Excel, ReconcileKit, saisie au net) ?
  6. Ce travail est-il facturé au client ou perdu ?
  7. Détail par paiement ou journal par virement ? Quels comptes utilisez-vous (517, 511, 58) ?
  8. Quel format exact faudrait-il (FEC, import ACD, TRA Cegid, MyUnisoft) ?
  9. « Ce serait autour de 49 € par mois pour tout le cabinet. Qu'est-ce que ça vous inspire ? »
  10. Si positif : proposer un pilote (3 mois à 39 €/mois, remboursé si le fichier ne passe pas dans leur logiciel), par lettre d'intention ou prépaiement.
  11. Toujours finir par : « Qui d'autre dans votre réseau a ce problème ? »
- **Quand :** au fil de l'eau, octobre à décembre 2026. Mardi à jeudi, 8 h–9 h 30 ou 13 h–14 h.
- **Résultat attendu :** chaque appel noté dans le tableau (heures, logiciel, format, réaction au prix, engagement).
- **Passage à l'étape suivante :** 30 appels notés.

**Signaux verts (continuer) :** bricolage existant (macro, Excel), plus de 5 h par mois, format précis demandé, PayPal ou devises en plus de Stripe, accepte une lettre d'intention, présente un confrère.

**Signaux rouges (arrêter) :** « on saisit le net », « Pennylane le fait », moins de 3 dossiers Stripe, « on facture le temps au client », enthousiasme poli sans engagement.

---

### Étape 6 — Décision GO / NO-GO

- **Pourquoi :** fixer la règle avant, pour ne pas se mentir après. Coder sans engagement payant, c'est le piège classique.
- **Comment :**
  - **GO** : au moins **3 lettres d'intention ou prépaiements**, avec un **format précis nommé** (ex. « import FEC ACD » ou « TRA Cegid »).
  - **PIVOT** : 2 engagements ou un seul logiciel qui revient partout → réduire la cible (ex. uniquement l'écosystème MyUnisoft).
  - **NO-GO** : moins de 2 engagements, ou les signaux rouges dominent → on arrête, sans regret : on aura perdu un mois, pas six.
- **Quand :** au 30e appel, au plus tard mi-décembre 2026.
- **Résultat attendu :** une décision écrite, avec les chiffres.

---

### Étape 7 — Construire le MVP (si GO)

- **Pourquoi :** livrer aux pilotes ce qu'ils ont payé, sur le format qu'ils ont demandé, rien de plus.
- **Comment :**
  - Stripe uniquement, entrée CSV uniquement.
  - Un seul format de sortie : celui demandé par la majorité des pilotes.
  - Paramétrage par dossier (comptes, journaux, TVA, niveau de détail).
  - Hébergement UE, données non conservées.
- **Quand :** 2 à 3 semaines, entre mi-décembre 2026 et janvier 2027. La saison des bilans (janvier à mi-mai) est le moment de construire, pas de prospecter.
- **Résultat attendu :** les pilotes importent un vrai mois de Stripe dans leur logiciel sans ressaisie.
- **Passage à l'étape suivante :** au moins 3 pilotes qui l'utilisent sur un vrai mois.

---

### Étape 8 — Pilotes, puis élargissement

- **Pourquoi :** transformer les pilotes en clients qui paient et qui recommandent, puis ajouter seulement ce qu'ils demandent.
- **Comment :**
  - Point toutes les deux semaines avec chaque pilote.
  - Ajouter, dans l'ordre de la demande réelle : PayPal, écran des anomalies, deuxième format, connexion API en lecture seule, Mollie.
  - Relancer la prospection dans la deuxième fenêtre (fin mai à début juillet 2027).
  - Préparer l'autonomie avant le PFE (février 2027) : onboarding en libre-service, tests automatiques par format, support par écrit uniquement.
- **Quand :** janvier à juillet 2027.
- **Résultat attendu :** 5 à 10 cabinets payants, premiers revenus récurrents.
- **Passage à l'étape suivante :** au moins 5 cabinets qui ont dépassé le pilote de 3 mois et continuent de payer au tarif plein.

---

### Étape 9 — Consolider avant de grandir

- **Pourquoi :** 5 à 10 cabinets à 49 €/mois, c'est 245 à 490 €/mois — ça valide le modèle, ce n'est pas un revenu. Le danger à ce stade, c'est d'ajouter des fonctionnalités à la demande de chaque pilote sans regarder si ça coûte plus cher en temps que ça ne rapporte en argent.
- **Comment :**
  - Chronométrer le temps de support réel par cabinet et par mois. Si un cabinet prend plus de temps que ce qu'il paie, soit le prix monte pour ce profil, soit on n'accepte plus ce type de dossier (ex. trop de devises, trop de litiges).
  - Demander à chaque pilote satisfait une recommandation concrète : un message tout prêt à transférer à un confrère, pas juste « si vous connaissez quelqu'un ».
  - Mesurer le churn : un cabinet qui arrête après le pilote est un signal plus important que dix réponses polies à un cold email. Comprendre pourquoi à chaque fois (format qui casse, prix, temps gagné insuffisant).
  - Repasser le fichier FEC de chaque nouveau format dans Test Compta Demat avant de le livrer, pas seulement en interne.
- **Quand :** été à automne 2027 (une fois la charge du PFE retombée).
- **Résultat attendu :** coût de support connu par cabinet, taux de churn mesuré, au moins une recommandation convertie sans prospection active.
- **Passage à l'étape suivante :** churn sous 20 % sur les pilotes, et le canal recommandation a produit au moins un client.

---

### Étape 10 — Sortir des premiers profils

- **Pourquoi :** les cabinets de `semaine-1.md` et du T2 sont tous déjà sensibilisés à Stripe (ils ont une page « expert-comptable e-commerce »). Pour dépasser 10-15 clients, il faut aller vers des cabinets généralistes qui ont juste *un* client sous Stripe sans être spécialisés — signal plus faible par cabinet, mais un bassin bien plus large.
- **Comment :**
  - Élargir la prospection aux cabinets généralistes (pas seulement e-commerce), avec un message adapté : on ne peut plus supposer qu'ils connaissent le problème, il faut le poser.
  - N'ajouter PayPal, Mollie ou un deuxième format que si au moins 3 clients payants le demandent explicitement — jamais en anticipation, même si ça semble une bonne idée.
  - Construire le premier vrai palier d'autonomie : onboarding sans appel obligatoire, connexion Stripe en lecture seule en option. Sans ça, chaque nouveau client repasse par un appel avec toi, et la croissance plafonne à ton temps disponible, pas à la taille du marché.
- **Quand :** fin 2027 à 2028, au rythme réel des pilotes (ne pas forcer un calendrier ici).
- **Résultat attendu :** 15 à 30 cabinets payants, le produit tourne sans appel de découverte obligatoire par nouveau client.
- **Passage à l'étape suivante :** le temps de support par cabinet ne grandit plus au même rythme que le nombre de cabinets (sinon, ça ne passe pas à l'échelle, ça se plafonne à ta disponibilité).

---

### Étape 11 — Les paliers de revenu, pour savoir où ça mène

Ce tableau sert à répondre honnêtement à « ça vaut le coup ou pas », à chaque étape. Hypothèse optimiste : 49 €/mois par cabinet, zéro churn. En réalité, viser large — il faut compter deux fois plus de cabinets contactés que ce chiffre pour l'atteindre, et le vrai coût n'est pas l'argent mais le temps de support.

| Cabinets payants | Revenu mensuel | Ce que ça représente concrètement |
|---|---|---|
| 3 à 5 | 150 à 245 € | Validation du modèle, pas un revenu — couvre l'hébergement et rien de plus |
| 10 | ~490 € | Argent de poche d'étudiant, encore loin d'un salaire |
| 30 | ~1 470 € | Complément sérieux, proche d'un mi-temps au SMIC |
| 60 | ~2 940 € | Proche d'un salaire junior en France — la question devient sérieuse : temps plein ou pas |
| 100+ | ~4 900 € | La question n'est plus « est-ce viable » mais « je gère ça seul ou j'ajoute du support » |

- **Décision à prendre autour de 30-60 cabinets, probablement fin 2027 ou en 2028 :** rester en revenu d'appoint à côté d'un poste salarié, passer à temps partiel dessus, ou y aller à plein temps. Ne pas décider ça sur une intuition — décider sur le churn (Étape 9) et sur le temps de support réel par cabinet, pas sur le MRR seul.
- **Ce qui protège le revenu dans la durée :** la relation installée avec les cabinets (ils ne changent pas d'outil une fois dans leurs habitudes) et l'accumulation de cas particuliers bien gérés — c'est déjà écrit en section 4, et ça reste vrai à 60 cabinets comme à 5.

---

## 7. Tableau de suivi (colonnes)

| Colonne | Contenu |
|---|---|
| ID / Tier | T1, T2, T3, relais |
| Cabinet, ville, site, LinkedIn | |
| Preuve de spécialisation | URL de la page Stripe/e-commerce |
| Logiciel de production | Déclaré sur le site ou confirmé en appel |
| Contact (rôle), canal, source | Obligatoire pour le RGPD |
| Dates J0, J+3, J+5, J+10, J+14 | |
| Statut | À contacter, contacté, répondu, appel planifié, appel fait, pilote, lettre d'intention, perdu, stop RGPD |
| Dossiers PSP, PSP utilisés, heures/mois | |
| Format demandé | FEC, ACD, TRA, MyUnisoft |
| Outil actuel / concurrents cités | |
| Réaction au prix (–2 à +2) | |
| Signaux verts / rouges | |
| Recommandations obtenues | |
| Prochaine action et date | |

---

## 8. Calendrier récapitulatif

| Période | Ce qu'on fait |
|---|---|
| 28 sept. – 2 oct. 2026 | Préparation, démo, 12 premiers cabinets |
| 5 oct. – 13 déc. 2026 | Prospection élargie, 30 appels |
| Mi-décembre 2026 | Décision GO / PIVOT / NO-GO |
| Mi-déc. 2026 – janv. 2027 | MVP si GO |
| Janv. – mi-mai 2027 | Saison des bilans : on construit pour les pilotes, pas de prospection |
| Février 2027 | Début du PFE : le produit doit tourner presque seul |
| Fin mai – début juillet 2027 | Deuxième fenêtre de prospection |
| Été – automne 2027 | Étape 9 : consolider (churn, coût de support, recommandations) avant de grandir |
| Fin 2027 – 2028 | Étape 10 : sortir des profils e-commerce, viser 15 à 30 cabinets, onboarding en libre-service |
| Autour de 30-60 cabinets | Étape 11 : décision temps d'appoint / temps partiel / temps plein, sur le churn et le temps de support réel |

---

## 9. Règles RGPD pour la prospection

- Email à un professionnel : autorisé sans consentement préalable si le message concerne son métier (règle CNIL B2B).
- Adresses génériques (contact@…) : canal le plus sûr.
- Chaque message contient : nom complet, statut réel, d'où vient le contact, but du message, et une phrase pour refuser (« répondez stop »).
- Tenir une liste des « stop » et supprimer les coordonnées demandées.
- Ne jamais dire « notre solution », « nos clients » ou « nous » : on est seul et on n'a pas encore de clients.

---

## 10. Les risques et comment on les surveille

| Risque | Comment on le voit | Réponse |
|---|---|---|
| Marché trop petit | Moins de 2 engagements au 30e appel | NO-GO, on arrête |
| finHero ajoute le FEC ou le français | Page française ou mention FEC sur fin-hero.de | Accélérer sur les formats natifs, ou proposer un partenariat |
| Pennylane gagne tous les cabinets | Les appels répondent « on passe sous Pennylane » | Réduire la cible à un écosystème (MyUnisoft) |
| Blocage sur l'accès aux données | Refus des clés API | Rester en mode CSV |
| Temps disponible pendant le PFE | Support trop lourd | Libre-service, tests automatiques, support écrit |
| Un autre indépendant ou une petite structure vise le même créneau (« hors Pennylane ») | Repéré sur LinkedIn ou en recherche, sans qu'on sache encore s'il a des pilotes payants | Vérifier ce qu'il a vraiment (juste une idée postée, ou des clients ?) avant de réagir. Si rien de payant chez lui non plus, ça confirme la douleur sans changer le plan. S'il a déjà des pilotes, accélérer l'Étape 4 plutôt que le produit : la relation avec les cabinets compte plus vite que les fonctionnalités (section 4) |
| Support qui grandit plus vite que le nombre de cabinets (Étape 10) | Le temps passé par cabinet et par mois augmente au lieu de rester stable | Arrêter d'accepter de nouveaux profils qui demandent du sur-mesure, revenir au produit standard avant de reprendre la croissance |
