# KPIs — Manifeste

> Les principes qui pilotent les KPIs du système. Le « pourquoi » avant le
> « comment ». À lire avant d'ajouter un nouvel indicateur.

**Spec technique :** [kpis.md](kpis.md). Ce manifeste fixe la doctrine ;
le spec décrit l'implémentation.

---

## I. Principes non-négociables

### 1. La donnée brute ne vaut rien sans contexte
Compter des heures, des sessions ou des questions ne mesure pas le progrès.
**Aucun KPI n'est exposé sans cible et sans seuil de surveillance.** Un
chiffre seul est un piège — un chiffre face à un seuil est une décision.

### 2. Maîtrise > Couverture
Un chapitre lu n'est pas un chapitre acquis. Lire 100% du curriculum sans
maîtriser ne fait pas passer le MPS. Quand on doit choisir entre largeur
et profondeur, **on choisit la profondeur**.
Pondération canonique :
`(Couverture × 30) + (Maîtrise × 50) + (Révision × 20)`.

### 3. MPS, pas perfection
L'objectif n'est jamais 100% partout. **L'objectif est le Minimum Passing
Score, atteint avec l'effort minimum nécessaire.** Toute énergie investie
au-delà de 80% sur un topic à faible poids est une énergie volée à un
topic à fort poids.

### 4. Le poids examen est la vérité d'allocation
Tous les topics ne se valent pas. **L'allocation horaire doit refléter le
poids examen, pas la difficulté ressentie.** Plafonner à 60% sur Ethics
(15-20%) coûte plus cher que plafonner à 60% sur Derivatives (5%).

### 5. Détection de récurrences, pas accumulation d'erreurs
Le système est utile quand il **repère ce qui revient**, pas quand il
stocke. Une question ratée 2× vaut 10× une question ratée 1× — la
récurrence prouve la fragilité durable.

### 6. La rétention long-terme prime sur la performance instantanée
Un score parfait sur du contenu lu hier est un faux positif. **Le KPI
canonique est le score sur du contenu vu il y a > 30 jours.** Tout le
reste est proxy.

### 7. Le subjectif doit être confronté à l'objectif
La confiance auto-déclarée n'est pas accessoire. Elle est la moitié de
l'équation. **Confidence 5/5 + QBank 40% = biais cognitif majeur, alerte
prioritaire.** Plus dangereux qu'un score bas avec confidence basse
(qui, lui, sait qu'il ne sait pas).

### 8. Le mock exam est la seule vérité
Tous les KPIs intermédiaires sont des proxies. **Le mock exam est le
bench finale.** Si un proxy s'écarte du mock, c'est le proxy qui se
trompe, pas le mock. Recalibrer.

### 9. Un KPI doit pouvoir déclencher une action
Si un KPI passe 🔴 et que personne ne sait quoi faire, **le KPI est mal
conçu**. Chaque seuil critique doit pointer vers une remédiation
concrète et opérable dans la session du jour.

### 10. Le temps est un signal, pas une fierté
Heures cumulées, streaks, sessions consécutives — ce sont des **signaux
d'engagement**, pas des proofs de progrès. Ne jamais célébrer 100h
d'étude qui n'ont pas bougé le mock score.

---

## II. Anti-patterns

À éviter dans la conception de tout futur KPI :

| Anti-pattern | Symptôme | Antidote |
|---|---|---|
| **Vanity metric** | « Tu as étudié 47h cette semaine ! » sans lien causal vers le score | Toujours coupler à un KPI de mastery ou rétention |
| **Single-shot accuracy** | « Quiz Score 80% » sur le contenu lu il y a 1h | Pondérer par fraîcheur ; favoriser le > 30j |
| **Goodhart's law** | Le candidat optimise le KPI au lieu d'apprendre | Un KPI ne doit jamais être à la fois objectif et optimisable trivialement |
| **Perfection bias** | Pousser 100% sur Derivatives car « presque fini » | Toujours afficher le coût d'opportunité (poids du topic abandonné) |
| **Dashboard porn** | 30 KPIs sur la même page | 4 catégories (Couverture / Maîtrise / Rétention / Mock) ; tout le reste est secondaire |

---

## III. Cycle de vie d'un KPI

Un nouveau KPI doit traverser 4 portes avant d'être affiché :

1. **Justification produit** — quel comportement utilisateur ce KPI doit-il
   modifier ? Si la réponse est « informer », rejeter.
2. **Source de données identifiée** — quelle table, quel endpoint, quelle
   fréquence de mise à jour ? Si la source est manuelle uniquement,
   marquer le KPI « v0 / aspirational ».
3. **Seuils calibrés** — 🔴 / 🟠 / 🟢, basés sur des données réelles
   (≥ 30 utilisateurs après lancement, sinon valeurs par défaut sourcées).
4. **Action de remédiation associée** — quand le KPI passe 🔴, quelle
   surface de l'app agit ? Si rien, le KPI n'est pas prêt.

Sans les 4, le KPI reste dans `docs/kpis.md` § 7 (mapping incomplet),
**pas dans la modale d'aide**.

---

## IV. Ce que le système refuse de faire

- ❌ **Comparer à d'autres utilisateurs.** Chaque candidat a son contexte
  (heures dispo, base initiale, examen visé). Le seul comparable est
  soi-même hier.
- ❌ **Récompenser le streak pour le streak.** Étudier 14 jours d'affilée
  sur du contenu déjà maîtrisé n'est pas un succès.
- ❌ **Cacher un KPI parce qu'il est mauvais.** La transparence sur les
  zones rouges est la seule manière de les corriger.
- ❌ **Créer des KPIs « motivationnels » sans fond.** Pas de XP, pas de
  niveaux, pas de badges décoratifs. Tout indicateur doit pointer vers
  une décision d'étude.

---

## V. Hiérarchie des KPIs (du plus important au moins)

1. **Mock Exam Score** — vérité finale
2. **QBank Score / Topic** — proxy le plus fidèle du mock
3. **Spaced Review Score (> 30j)** — vérité de la rétention
4. **First-pass Accuracy** — proxy de la compréhension réelle
5. **Confidence × Performance Gap** — détecteur de biais cognitif
6. **LOS Completion Rate** — préalable, pas suffisant
7. **Time / Question** — qualité d'exécution
8. **Reading Velocity / Burn-down** — pilotage projet
9. **Heures cumulées / streak / sessions** — signaux d'engagement, jamais
   des objectifs

Quand deux KPIs entrent en conflit, **le plus haut dans la liste tranche**.

---

## VI. Engagement de l'outil envers le candidat

L'outil s'engage à :

- Ne pas mentir par omission (pas d'auto-félicitation déconnectée du score)
- Signaler les écarts entre confiance et performance dès qu'ils dépassent
  15 points
- Repondérer automatiquement le plan vers les topics à fort poids quand
  l'examen approche
- Refuser de planifier un mock tant que la couverture < 50% — un mock
  prématuré donne un signal faux et démoralise sans informer
- Préserver l'historique brut des erreurs (Error Log) — toute agrégation
  est dérivable, jamais destructrice

---

*Dernière révision : 2026-04-29.*
