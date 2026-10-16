# FluxFEC : état du projet

**Projet arrêté le 16 octobre 2026.** Dernière mise à jour : 16 octobre 2026.

Règle : ce fichier est versionné. Aucun nom, email ou téléphone de prospect ici ; le détail reste dans `prospection/` (non versionné).

---

## 0. Bilan d'arrêt (16 octobre 2026)

**Décision : on arrête.** Après trois semaines de prospection, aucun cabinet n'a montré d'intérêt, et la recherche du 16/10 a montré que le créneau est déjà occupé à bas prix.

| Mesure | Résultat |
| --- | --- |
| Cabinets contactés par email | 124 (plus 3 formulaires, 1 WhatsApp) |
| Relances et messages de rupture | 70 relances, 16 ruptures |
| Invitations LinkedIn | environ 90 cabinets, 12 acceptées, 12 messages, 0 réponse |
| Retours | 1 refus, 2 « stop », 1 réponse à côté ; 0 essai, 0 engagement |
| Visites de la landing (mesurées du 15 au 16/10) | 0 venant des prospects |

**Ce qu'on a appris :**

- **La douleur est faible pour un cabinet généraliste.** Il a peu de dossiers Stripe, et les passer au net reste « assez bon ». Sur Compta Online, un développeur a posé en janvier 2026 la même question que nous (« clients utilisant Stripe, vos retours ? ») : 862 vues, une seule réponse en 9 mois.
- **Ceux qui ont vraiment le problème ont déjà une solution.** Pennylane et Tiime ont un connecteur natif. Truc de Comptable (un expert-comptable très présent sur Compta Online) vend un convertisseur Stripe vers FEC dans un pack de 20 outils à 60 € HT par an, trois fois moins cher que notre offre pour Stripe seul.
- **Le message manquait de crédibilité.** Adresse Gmail, lien en vercel.app, pas de société. La demande (envoyer les données d'un client à un inconnu) était trop lourde pour un premier contact.
- **La méthode a marché.** On a validé avant de construire : aucun euro dépensé (ni domaine ni produit en libre-service), et une réponse claire en trois semaines.

Ce qui reste utile : le moteur (`moteur/`), qui transforme deux exports Stripe en FEC lettré et contrôlé, avec 90 tests ; et la page de démonstration.

---

## 1. Le produit en une phrase

FluxFEC transforme les exports CSV Stripe d'un client en un FEC détaillé, lettré et contrôlé, que le cabinet d'expertise comptable importe dans son logiciel de production (ACD, Cegid Loop / Quadra, MyUnisoft, Sage).

**Le problème.** Quand un client e-commerce ou SaaS encaisse par Stripe, la banque ne montre qu'un virement net (« STRIPE PAYMENTS 638,62 € »). Derrière : des ventes au brut, de la TVA, des commissions, des remboursements, des litiges. Saisi tel quel, le chiffre d'affaires est faux et les frais disparaissent. Retraité à la main, c'est un tableur à refaire chaque mois, pour chaque client.

**La cible.** Les cabinets qui ne sont pas sur Pennylane (Pennylane a déjà son connecteur Stripe) et qui ont des dossiers qui encaissent par Stripe.

---

## 2. Ce qui existe aujourd'hui

### Le moteur (`moteur/`)

- CLI TypeScript (tsx), 90 tests automatisés (vitest), `npm test` et `npm run demo`.
- Entrées : export Stripe « Balance change from activity » (Itemized) + export « Payouts » (Itemized), même mois.
- Sortie : FEC au format article A47 A-1 (18 colonnes, tabulation, ISO-8859-15, nommage `SIRENFECAAAAMMJJ.txt`) + rapport HTML de contrôle.
- Schéma comptable :
  - vente : 411 au débit, 707 HT et 44571 TVA au crédit ;
  - encaissement : 517 net + 627 commission au débit, 411 au crédit, lettré avec la vente ;
  - virement vers la banque : 58 au débit, 517 au crédit ; le 58 se lettre avec la ligne du relevé ;
  - remboursement : avoir ; litige : créance rouverte au 411, signalée ;
  - opération inconnue : 471, signalée.
- Contrôles : équilibre par écriture et du fichier, solde du 517 = variation du solde Stripe, dates dans l'exercice, format FEC, lettrage du 411.
- Fonctionne même si la colonne description est vide (données personnelles retirables).

**Limites, à dire honnêtement :**

- Stripe uniquement.
- Pas d'autoliquidation de TVA sur les frais (445662 / 4452) : prévue en option.
- Jamais testé sur un vrai export client ni importé dans un vrai logiciel. Pas passé par Test Compta Demat.
- Pas de self-serve : aujourd'hui c'est le moteur + un service fait à la main (on reçoit les CSV, on renvoie le FEC sous 24 h).

### La landing (`landing/`, https://fluxfec.vercel.app)

- Page statique HTML/CSS, déployée par Vercel depuis GitHub quand on pousse.
- Refonte du 6 octobre :
  - en haut, la ligne du relevé « STRIPE PAYMENTS 638,62 € » décomposée en ventes, remboursement et frais ;
  - le journal présenté sur papier listing zébré ;
  - une comparaison avec le schéma d'un convertisseur du marché ;
  - le rapport et ses points à vérifier ;
  - les fichiers d'exemple à télécharger ;
  - l'essai gratuit, le tarif et la FAQ.
- `export-stripe.html` : comment sortir les deux exports, et comment importer le FEC par logiciel.
- `exemple/` : un mois complet de démonstration (22 opérations Stripe, 39 écritures, 4 points à vérifier).

### Offre et prix

| Formule | Prix |
| --- | --- |
| Essai | Gratuit, un mois d'un dossier, FEC sous 24 h |
| Cabinet | 19 € HT / mois, ou 190 € HT / an, tous dossiers |
| 10 premiers cabinets | 15 € HT / mois, bloqué tant qu'ils restent |
| Garantie | Remboursé si le FEC ne s'importe pas |

Logique : « meilleur produit, meilleur prix ». Les seuls coûts sont l'hébergement ; le but est la rentabilité, pas une grosse structure.

---

## 3. La concurrence (vérifiée le 6 octobre 2026)

| Acteur | Prix | Ce qu'il fait | Faiblesse pour un cabinet |
| --- | --- | --- | --- |
| ReconcileKit | Gratuit 3 conversions / mois, Pro 19 € / mois | Convertisseur Stripe vers FEC | Schéma affiché : vente brute au 706 sans séparer la TVA, virement direct en 512 sans 58, ajustements en 512/706 |
| Truc de Comptable | 60 € HT / an | Boîte à outils comptable, dont un convertisseur Stripe | Outil générique, pas de réglage par dossier ni de rapport de révision |
| ExportCompta | 9 $ / mois | Export pour freelances | Cible les indépendants, pas les cabinets |
| Ermilink | 39 € HT / mois | Connecteurs de flux | Plus cher, plus large |
| finHero | 29 € / mois | Équivalent allemand | Allemagne uniquement |
| Chift | Sur devis | Plateforme d'API comptables unifiées | **Menace structurelle** : les éditeurs peuvent brancher Stripe nativement |
| Pennylane | Inclus | Connecteur Stripe natif | Hors cible : on vise les cabinets qui ne sont pas sur Pennylane |

**Notre angle :** un convertisseur traduit, FluxFEC comptabilise. Concrètement : TVA séparée, transit 58, lettrage, contrôle du 517, opérations inconnues signalées au 471, réglage par dossier, rapport pour la révision. Le tout au même prix que l'offre payante la moins chère.

---

## 4. Notre démarche

### Principe

On ne construit pas le produit complet (MVP en libre-service) avant d'avoir des engagements payants. Le moteur existe déjà ; on le montre et on l'utilise en service manuel pour valider.

### Règle de décision

- **GO** si au moins 3 lettres d'intention ou prépaiements, avec un format de logiciel précis.
- Point d'étape : **20 octobre 2026**.
- Décision finale : **mi-décembre 2026**.

### Ce qu'on demande dans les messages

1. Est-ce que le cabinet a des dossiers qui encaissent par Stripe ?
2. Comment il les traite aujourd'hui : saisie au net, à la main, ou un outil ?
3. S'il le veut : qu'il nous envoie un mois d'exports Stripe d'un dossier ; on renvoie le FEC et le rapport sous 24 h, gratuitement.

### Ce qu'on cherche à apprendre

- La douleur existe-t-elle vraiment, et sur combien de dossiers par cabinet ?
- Quel logiciel et quel format d'import, pour tester le FEC en conditions réelles ?
- Utilisent-ils déjà un concurrent, et pourquoi il ne suffit pas ?
- Ensuite seulement : 3 engagements payants.

### Canaux

- **Email à froid** (canal principal) : sujet court, le monde du lecteur d'abord, une preuve (le mois d'exemple), une demande légère, un seul lien, une ligne « stop ».
- **Relance** dans le même fil, avec du concret plutôt qu'un « je me permets de relancer ».
- **LinkedIn** : invitations « Se connecter » uniquement (les messages aux non-connectés sont payants), puis message après acceptation.
- **WhatsApp** : seulement vers des mobiles publiés par le cabinet lui-même, sans lien, avec « stop ».
- **Communautés** : post sur le forum Compta Online (schéma comptable, sans lien), post LinkedIn.

### Règles de prospection

- Respecter tout « stop » ou refus (RGPD), immédiatement et définitivement.
- Ne jamais utiliser les emails ou numéros pris uniquement dans des offres d'emploi.
- Ne jamais cliquer sur les liens reçus dans les emails.
- Données des prospects : uniquement dans `prospection/` (non versionné).

---

## 5. Ce qui est fait

| Date | Étape |
| --- | --- |
| Septembre 2026 | Étude de marché, stratégie, revalidation de la concurrence (`brainstorming/`) |
| Septembre 2026 | Moteur Stripe vers FEC, 90 tests, mois de démonstration |
| Fin septembre | Landing en ligne sur fluxfec.vercel.app, page d'export Stripe, exemple téléchargeable |
| Début octobre | Base de prospection : environ 187 cabinets qualifiés (logiciel identifié quand possible) |
| 29 septembre au 6 octobre | 49 premiers emails (17 le 29/09, 6 le 30/09, 5 le 05/10, 21 le 06/10) ; première vague relancée le 5 et le 6 octobre |
| 6 octobre | 1 envoi WhatsApp ; 151 profils LinkedIn vérifiés, liste d'invitations prête |
| 6 octobre | Nouveaux messages (premier email, relance, rupture, LinkedIn, forum) avec le skill cold-email |
| 6 octobre | Tarif revu : 19 € / mois ou 190 € / an, 15 € pour les 10 premiers |
| 6 octobre | Refonte de la landing (skill frontend-design) et création de ce fichier |
| 7 octobre | Landing refaite poussée en ligne |
| 7 octobre | 30 nouveaux premiers emails (modèle « vos dossiers stripe », cabinets Cegid, MyUnisoft, ACD) ; 1 adresse rejetée puis renvoyée à l'adresse alternative publiée par le cabinet |
| 7 octobre | 5 filtres anti-spam Mailinblack validés à la main : les emails bloqués sont délivrés |
| 9 octobre | LinkedIn, lot 1 sur 8 : 17 invitations envoyées (3 avec note, puis quota de notes gratuites épuisé), 1 déjà connecté, 1 déjà en attente, aucun avertissement LinkedIn |
| 10 octobre | LinkedIn, lot 2 sur 8 : 18 invitations envoyées sans note, 1 profil erroné à retrouver, 1 invitation impossible (LinkedIn demande l'email), aucun avertissement |
| 10 et 11 octobre | LinkedIn, lots 3, 4 et une partie du 5 : environ 47 invitations de plus (détail du lot 3 non remonté), 2 profils douteux écartés ; environ 82 invitations en 3 jours, aucun avertissement |
| 12 octobre | Audit LinkedIn en lecture seule : 7 acceptations, 74 en attente, aucun message reçu ; 7 messages LinkedIn préparés (dont 5 qui remplacent la relance email) |
| 12 octobre | Emails : 20 relances (vagues du 5 et du 6 octobre), 16 messages de rupture (vague du 29-30 septembre), 24 nouveaux premiers emails (Cegid, ACD, Isacompta, Sage, Inqom) |

**Résultats à ce jour :** environ 105 cabinets contactés par email, 3 par formulaire, 1 par WhatsApp. 1 réponse sans suite, 1 refus, 2 demandes de retrait (stop), 1 adresse toujours introuvable. Aucun essai reçu, aucun engagement.

---

## 6. Ce qui restait (abandonné le 16/10/2026)

Plus rien de cette liste n'est suivi depuis l'arrêt du projet. Les relances prévues n'ont pas été envoyées.

### Cette semaine

- [x] Pousser la nouvelle landing.
- [x] Valider les filtres anti-spam Mailinblack en attente.
- [ ] Chaque jour : vérifier les réponses et les retours d'erreur, puis faire les envois prévus.

**LinkedIn (Badreddine)**

- [ ] Invitations « Se connecter » : 146 profils en 8 lots de 20 (`prospection/prompt-linkedin-invitations.md`), un lot par jour au plus. Lots 1 à 4 et une partie du 5 faits (9 au 11/10, environ 82 invitations) ; pause jusqu'au vendredi 16/10 (plafond hebdomadaire), puis lot 5 bis (11 profils), 6, 7 et 8 (57 profils). Plus de note jusqu'au mois prochain (3 notes gratuites par mois).
- [x] 12/10 : message envoyé aux 7 personnes qui ont accepté, et au contact déjà connecté.
- [ ] Vers le 17/10 : une seule relance LinkedIn à celles qui n'ont pas répondu.
- [ ] Message aux prochaines personnes qui acceptent, puis une seule relance à 5 jours.
- [ ] Signaler les profils sans bouton « Se connecter » pour les retirer de la liste.

**Emails**

- [x] 12 octobre : relances des vagues du 5 et du 6 octobre, message de rupture pour la vague du 29-30 septembre, 24 nouveaux premiers emails.
- [x] 14 octobre : relance de la vague du 7 octobre (30 relances dans le même fil).
- [ ] Vers le 24 octobre : message de rupture pour la vague du 7 octobre.
- [x] 15 octobre : 21 premiers emails issus des recherches du 13/10 et du 14/10 (`prospection/vague-2026-10-15.md`).
- [ ] 22 octobre : relance des 21 premiers emails du 15/10, nouveau message, lien étiqueté `relance-2210`.
- [x] 15 octobre : messages LinkedIn aux 2 relations acceptées le 15/10 (`prospection/messages-linkedin-acceptes-2026-10-15.md`).
- [ ] Vers le 20 octobre : relance LinkedIn de ces 2 relations si pas de réponse.
- [x] 14 octobre : messages LinkedIn aux 2 nouvelles relations du 13-14/10 (`prospection/messages-linkedin-acceptes-2026-10-14.md`).
- [ ] Vers le 19 octobre : relance LinkedIn de ces 2 relations si pas de réponse.
- [ ] Vers le 17 octobre : message de rupture pour le cabinet dont les emails n'ont été délivrés que le 07/10.
- [ ] 19 octobre : relance des 24 premiers emails du 12/10, avec le nouveau message (demande légère « quel logiciel ? », signature Fondateur, lien étiqueté `relance-1910`).
- [ ] Vers le 22 octobre : message de rupture pour les vagues du 5 et du 6 octobre.
- [ ] Une vingtaine d'adresses plus anciennes à revérifier avant envoi (dont 1 adresse non vérifiée).

**Posts**

- [ ] Post LinkedIn (mardi ou jeudi matin, lien en premier commentaire).
- [ ] Post sur le forum Compta Online (sans lien).

**Cas à débloquer**

- [ ] 2 cabinets contactés par formulaire le 30/09 sans réponse : relance courte par le même formulaire.
- [ ] 1 cabinet à l'adresse introuvable : appeler le standard ou passer par LinkedIn.
- [ ] 1 cabinet sans email ni WhatsApp : LinkedIn uniquement.
- [ ] WhatsApp du 06/10 : relance courte le 09/10 sans réponse ; la personne a changé de cabinet, viser le nouveau.
- [ ] 11 cabinets sans aucun contact trouvé : en attente.

### Dès le premier essai reçu

- [ ] Traiter le mois sous 24 h, régler les comptes et journaux du cabinet.

- [ ] Faire importer le FEC dans le vrai logiciel ; corriger le moteur si besoin.

- [ ] Demander : combien de dossiers concernés, et à quel prix ils s'engageraient.

### Avant le 20 octobre

- [x] Bilan : taux de réponse, nombre d'essais, logiciels rencontrés (préparé le 15/10, fichier local de prospection).

- [x] Mesure d'audience : Vercel Web Analytics actif du 15/10 au soir au 16/10, puis retiré à l'arrêt du projet.

- [x] Décider : arrêt le 16/10 (voir section 0).

### Si GO (3 engagements)

- [ ] Autoliquidation en option.

- [ ] Interface d'envoi en libre-service (dépôt des CSV, réglage du dossier, téléchargement).

- [ ] Passage par Test Compta Demat.

- [ ] Autres prestataires de paiement (PayPal, Mollie, SumUp) dans l'ordre demandé.

---

## 7. Journal des mises à jour

- **6 octobre 2026** : création du fichier.
- **7 octobre 2026** : aucune réponse de cabinet ; 31 premiers emails envoyés (dont un renvoi) ; anti-spam validés ; landing poussée ; README remis à jour (nouveau tarif) ; prochaines relances les 12 et 13 octobre (vagues du 5 et du 6), puis le 14 octobre (vague du 7).
- **9 octobre 2026** : toujours aucune réponse de cabinet ; lot 1 des invitations LinkedIn envoyé via Claude in Chrome (17 envoyées) ; envois d'emails reportés au lundi 12 octobre au matin (relances, rupture et 25 premiers emails).
- **12 octobre 2026** : aucune réponse de cabinet ; audit LinkedIn (7 acceptations, messages préparés) ; 60 emails envoyés (20 relances, 16 ruptures, 24 premiers emails) ; LinkedIn en pause jusqu'au 16/10.
- **13 octobre 2026** : audit LinkedIn en lecture seule : aucune nouvelle acceptation de cabinet, aucune réponse aux 8 messages du 12/10 ; 183 invitations en attente sur le compte (toutes campagnes confondues) ; 6 vieilles invitations hors comptabilité retirées (177 en attente) ; 5 invitations du lot 5 bis envoyées, aucun avertissement. Emails : 1 « stop » reçu (coordonnées supprimées, retiré de la liste LinkedIn), 2 filtres anti-spam Mailinblack à valider. Recherche de contacts sur 80 cabinets « à contacter » : 16 adresses retenues pour une vague le 15/10, 3 cabinets exclus (100 % Pennylane), 55 sans e-mail public.
- **14 octobre 2026** : aucune nouvelle réponse de cabinet ; 30 relances envoyées (vague du 7 octobre). Vérification LinkedIn : aucune réponse aux 8 messages du 12/10, 2 nouvelles relations (cabinets déjà contactés par email), 180 invitations en attente. Sites bloqués revus dans Chrome : 5 adresses ajoutées à la vague du 15/10, 1 cabinet exclu (Pennylane), 11 sites hors service. Le soir : 2 messages LinkedIn envoyés aux nouvelles relations ; 7 profils trouvés pour des cabinets sans e-mail (lot 9 d'invitations) ; 4 cabinets sous Pennylane retirés des lots 7 et 8.
- **15 octobre 2026** : aucune réponse de cabinet ; 21 premiers emails envoyés (vague du 15/10), aucun rebond ; 2 nouvelles relations LinkedIn, contactées le jour même par message. Bilan préparé pour le 20/10 (0 engagement ; hypothèse principale : message peu crédible et demande trop lourde). Mesure d'audience ajoutée à la landing (Vercel Web Analytics, sans cookie).
- **16 octobre 2026** : aucune réponse de cabinet. Recherche sur Compta Online : la question Stripe n'y intéresse presque personne, et un concurrent connu vend le même convertisseur à 60 € HT par an dans un pack. **Projet arrêté.** Dépôt nettoyé (listes de prospects retirées) et rendu public ; mesure d'audience retirée ; la landing reste en ligne comme démonstration, sans offre.
