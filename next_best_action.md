# Next Best Action — Spec & Principes

> Document vivant — capture des principes, décisions et corrections au fil de
> la conception. Référence pour le code à venir.

Date d'init : 2026-05-05

---

## 1. Objectif (par hiérarchie)

1. **Se concentrer sur le candidat** : sa situation, ses besoins.
2. **Comprendre puis lui expliquer** sa situation (pas dumper de la donnée brute — la traduire).
3. **Lui proposer les meilleures options** en fonction de son **état du moment** :
   - Énergie disponible
   - Motivation
   - Temps disponible
4. **L'informer précisément** sur sa situation pédagogique :
   - Par **Topic**
   - Par **LM**
   - Par **LOS**
5. **Proposer la meilleure solution possible** en respectant l'**avancement pédagogique** — on ne saute pas dans DER-09 sans onboarding préalable. Toujours se référer aux **14 règles de planification** (cf. `backend/app/services/planning_skill.py:22-66`).

---

## 2. La clause "Never Surrender"

> **Credo** : *"Je fais le max que je peux, même une petite action, même si je suis mort."*

C'est **le principe central** de la NBA — pas une option parmi d'autres. La page NBA garantit qu'**il y a toujours quelque chose à faire**, jamais "rien", jamais "reviens demain".

Quand le candidat est en état :
- **Motivation basse** ET
- **Peu de temps disponible** ET
- **Peu d'énergie**

→ proposer quand même une **mini-action** dégradée mais réalisable. Le candidat n'est **jamais bloqué**.

Format de mini-action en mode Never Surrender, en 3 paliers d'intensité croissante (le système choisit le palier selon l'inférence d'état) :

| Palier | Action minimale garantie | Énergie requise | Durée |
|---|---|---|---|
| **Tier 1** — Passif pur | Écoute Audio Reading Summary OU lecture LOS Sheet | low | 5-10 min |
| **Tier 2** — Encoding léger | Lecture Reading Summary **+** LOS Sheet | low/mid | 10-15 min |
| **Tier 3** — Encoding + check | Reading Summary + LOS Sheet **+ quiz easy** (3-5 questions) | mid | 15-20 min |

→ La clause garantit que **chaque palier reste réalisable** quand le candidat est "à plat". Le quiz easy en Tier 3 cible des LOS déjà maîtrisés (refresh, pas drill) pour avoir un win rapide qui relance la motivation.

Source des assets :
- Reading Summary → `09_reading_summary.{pdf,md}` du LM cible
- LOS Sheet → `03_los_sheet.{pdf,md}`
- Audio Reading → fallback `00_full_course.mp3` ou `14_audio_script.pdf` lu

**Affichage** : Never Surrender est **toujours visible** dans le menu, pas gatée par un seuil arbitraire — sans friction. Le candidat choisit selon son état. Le système met en évidence le palier inféré (Tier 1/2/3) sans masquer les autres.

→ Pas de logique de "déclencher la clause". Elle est toujours dispo en option faible-effort.

> Slot E "Never Surrender" du menu (mini-cours + quiz weakness) hérite du **même esprit** mais est plus structuré. Esprit identique = jamais abandonner, juste à des intensités différentes. **Pas de conflit nominal** — on garde le nom partout.

---

## 3. Les 14 règles de planification

**Source unique de vérité** : `backend/app/services/planning_skill.py:22-66`.

→ Pas de copie dans ce doc (sans friction, single source). Le NBA orchestrator
appelle directement `planning_skill` qui les applique. Si une règle change,
elle change à un seul endroit.

Règles à priorité absolue :
- **Rule 1** — Module Onboarding mandatory avant tout drill
- **Rule 2** — No Error Debrief sans exercice antérieur

Toute proposition NBA passe d'abord par ces deux filtres.

---

## 4. Hiérarchie fonctionnelle (4 étapes)

**Décision (2026-05-05)** : la page NBA suit un **flow fonctionnel**, pas une hiérarchie spatiale Topic/LM/LOS.

```
1. Où je suis             →  Status GPS (Schedule + Velocity)
       ↓
2. Où je dois aller       →  Target J-examen, palier semaine
       ↓
3. Mes options + conséquences  →  6 slots A-F, chacun avec impact chiffré
       ↓
4. J'agit (en toute circonstance)  →  Clause Never Surrender garantit toujours une action possible
```

Les niveaux Topic / LM / LOS sont **absorbés** dans ce flow :
- Le **status** agrège global (Topic) + détail (LM weakness, LOS faillis récents)
- Les **options** ciblent un LM ou un LOS spécifique selon le slot
- L'**Instant Report** (collapsable) reste disponible pour qui veut le drill-down complet

→ **Pas de tab "Topic / LM / LOS"** sur la page NBA. Le drill-down vit dans l'Instant Report.

---

## 5. Capture de l'état du candidat

**Décision (2026-05-05)** : **inférence silencieuse**, pas de sélecteur à l'arrivée. Pas de friction d'entrée.

Heuristiques d'inférence à partir de l'existant :

| Dimension | Signal source | Règle |
|---|---|---|
| **Énergie** | `sessions.energy` (last N) | Moyenne pondérée des 3 dernières sessions. Décai temporel si gap > 48h. |
| | Heure de la journée | Tôt matin (6-9h) → mid ; après-midi (14-17h) → high ; soirée (20+) → low |
| | Jour de la semaine | Lundi/Mardi → high ; Samedi/Dimanche après-midi → mid |
| **Motivation** | `streak_current` | High si ≥ 7 jours, mid si 3-6, low si 0-2 |
| | Completion rate des 7 derniers `plan_entries` | Boost motivation si > 70% |
| | Recent disputes / engagement | Bonus si > 0 dispute ces 7 derniers jours (engagement actif) |
| **Temps disponible** | Median des `sessions.duration_sec` 14 derniers jours | "Pattern habituel" du candidat |
| | Heure courante vs prochain événement calendrier | (futur, si on a accès au calendrier) |

**Override implicite** : la clause Follow the White Rabbit assume que le candidat **choisira** l'option qui matche son temps réel — donc on lui en propose plusieurs avec durées variées (12-18-30-50 min), et le bon match émerge naturellement.

**Pas d'écran de sélection énergie/motivation** — c'est de la friction inutile.

---

## 5bis. Réutiliser les schémas préétablis

Principe : **ne pas réinventer**. Le NBA s'appuie sur des schémas déjà figés
dans le code et la pédagogie Wingman.

| Schéma préétabli | Source | Usage NBA |
|---|---|---|
| **14 règles de planification** | `backend/app/services/planning_skill.py:22-66` | Filtre absolu — toute proposition NBA respecte Rule 1 (onboarding) et Rule 2 (debrief sans exercice) |
| **Phase classifier par LM** (4 phases) | `backend/app/services/diagnostic_report.py::classify_lm_phase()` | Détermine le type d'action recommandé par LM (discovery → onboarding, consolidation → drill, simulation → mock, final_sprint → top quick wins) |
| **Asset matrix Topic × Content type** | `planning_skill.py` (matrice 0-5) | Choix de l'asset : pour un LM Calculation-heavy en consolidation → Targeted QBank prioritaire ; pour Conceptual en discovery → Learning Map |
| **SESSION_MODES** (5 modes) | `frontend/app/page.tsx:119-125` | Routes existantes : `discovery`, `reinforce`, `eval`, `audio`, `flashcards`. Chaque slot A-F mappe sur un de ces modes. |
| **Topic groups** | `planning_skill.py` § Content matrix | Profil cognitif : Conceptual / Hybrid / Calculation-heavy / Light. Influence le séquencement encoding ↔ practice. |
| **session_type taxonomy** | `sessions.session_type` | `study`, `exercise`, `mock_exam` — filtre additionnel pour scorer l'option (durée, intensité). |

**Conséquence** : la logique NBA n'est pas un nouvel algorithme, c'est une
**combinaison** des schémas existants :

```
1. Pull diagnostic per LM (phase auto)
2. Pour chaque LM, asset matrix dit quel content_type est prioritaire
3. Filter via 14 rules (skip si onboarding pas fait, etc.)
4. Score chaque candidat par (exam_weight × gap × matrix_priority)
5. Render dans le slot A-F qui correspond au session_mode
```

→ **Aucun service nouveau** : juste un orchestrateur qui appelle les services existants.

---

## 6. Menu d'options (état actuel)

6 slots, priorité descendante :

| Slot | Nom | Icône | Type | Conditions |
|---|---|---|---|---|
| **A** ⭐ | Daily Sharpener | 🎯 | Drill mastery équilibré | Toujours présent |
| **B** | Marco Polo Challenge | 🧭 | Coverage explore | LM jamais touché |
| **C** | Champion Lap | 🏁 | Mock thématique | Topic en retard |
| **D** | Walkman Mode | 🎧 | Audio passive | MP3 dispo |
| **E** | Never Surrender | 💪 | Mini-cours + quiz weakness | Weakness active ≥ 1 |
| **F** | Superman Challenge | 🦸 | Action max ROI Critical LM | Critical LM avec gap |

Logique de résolution weakness (slot E) : marquée `resolved=true` si **≥ 80% correct sur ≥ 3 questions** dans la session.

### Slot E — Source du mini-cours

**Décision (2026-05-05)** : appel Claude (pas lecture de `.md` statique). Coût ~$0.01-0.02 par clic, gain en pertinence contextualisée.

Pour chaque weakness ciblée, le mini-cours produit par Claude contient :

| Bloc | Contenu |
|---|---|
| **Concept** | Explication pédagogique du LOS en 1-2 paragraphes (vulgarisée, exam-grade) |
| **Pourquoi tu t'es trompé** | Named misconception déduite de la réponse erronée (`question_attempts.selected_answer` vs `correct_answer`) |
| **Citation** | Référence standard (CFA Curriculum Vol.X §Y, IAS, IFRS, ASC selon le cas) — pour ancrer la mémoire |
| **Pivot** | Phrase de transition vers le quiz : "Voilà, maintenant teste-toi" |

Input du prompt (par weakness) :
- LOS code + description
- Module title + topic
- La question ratée + bonne réponse + réponse user (les 1-3 plus récentes)
- Phase auto-classifiée du LM (donne le ton — discovery vs final_sprint)

Output strict (markdown structuré, < 400 tokens / weakness pour rester rapide).

→ Endpoint : `POST /api/v1/weakness/mini-course` qui renvoie le markdown complet du briefing (toutes les weaknesses chained dans une réponse).

---

## 6bis. Pattern motivationnel de référence — Progression Velocity

Capture d'écran validée par l'utilisateur (2026-05-05) — exemple de carte qui
motive vraiment. À reproduire dans le header GPS de la page NBA.

**Anatomie** :

| Bloc | Contenu |
|---|---|
| **Headline numérique** | `+2.2%` per week, en gros, vert si positif |
| **Label qualitatif** | `Fast progress` / `Steady` / `Slowing` (positif d'emblée) |
| **Trend chart** | Line chart des N derniers snapshots (14 ici) → preuve visuelle du mouvement |
| **Verdict** | Texte honnête : "+2.2% mais below pace needed" — pas démotivant car on dit ensuite quoi faire |
| **Projection** | Barre `CURRENT 11.4% — PROJECTED 44.4% — TARGET 70%` au rythme actuel |
| **Required velocity** | "Push to +3.9%/week" — action concrète chiffrée |
| **Details** | Tableau pace actuel vs pace requis |

**Principes à retenir** :

1. **Mouvement > état statique** — afficher le delta (vélocité), pas juste le score absolu.
2. **Preuve visuelle** — la trend line concrétise le progrès cumulé.
3. **Verdict honnête + actionnable** — "below pace" mais immédiatement "push to +X" pour transformer la vérité dure en plan.
4. **Projection au target date** — le candidat voit où il atterrit s'il continue.
5. **Tone toujours positif d'abord** : "Fast progress" même si below pace.

→ **Sur la page NBA**, le header "Tu es ici" doit reproduire ce pattern :
- Vélocité hebdo (mastery delta) en headline
- Mini trend (sparkline ou line)
- Verdict + required velocity
- Projection au J-examen

Source : services existants `services/velocity.py` + `services/roi_scorer.py` ont déjà la logique de mastery delta. Réutiliser, ne pas réinventer (cf. § 5bis).

### Anti-pattern à corriger — Bâton brutal

Capture validée par l'utilisateur (2026-05-05) : le bandeau actuel `CRITICAL — NOT READY · 11.4% / 70%` + `DROP-OFF RISK 80` est **démotivant** parce qu'il diagnostique sans proposer de chemin.

| Élément actuel | Pourquoi ça démotive | Correction |
|---|---|---|
| `CRITICAL — NOT READY` rouge | Verdict d'échec, pas un plan | "Voici comment rattraper en X semaines" |
| `tu as beaucoup de rattrapage` | Vague + accusateur | "Il te manque 6h/sem pour cibler 70%" |
| `DROP-OFF RISK 80` rouge | Chiffre orphelin, pas d'action attachée | "Sans 1 session avant vendredi, ton momentum chute. 15 min suffisent." |
| Toutes les barres rouges | Cerveau lit "danger" → évitement | Orange pour warning, rouge **seulement** en urgence absolue (J-3 et inactif) |

### Clause "Follow the White Rabbit" 🐇

Référence : Matrix / Alice in Wonderland — un guide qui **conduit** le candidat
vers la prochaine porte, plutôt qu'un juge qui constate le retard.

Toute alerte / mauvaise nouvelle / friction doit ouvrir une porte. Si on n'a pas
de porte à montrer, on ne montre pas l'alerte.

**6 règles de la clause** :

1. **Quantifier l'écart, pas l'échec.** L'écart est un nombre concret ("6h/sem manquantes"), l'échec est un verdict ("not ready"). Le candidat agit sur un nombre, pas sur un verdict.
2. **Montrer le chemin.** Toute alerte rouge/orange est suivie d'un plan : "5h/sem × 12 sem → 70%". La peur devient un plan, donc gérable.
3. **Mini-objectif court terme.** Plutôt qu'un target final ("70%"), donner le palier de la semaine ("cette semaine, +6% — faisable en 4h").
4. **Traduire les risques en action.** "Drop-off risk 80" → "fais 15 min avant vendredi pour reset le risque".
5. **Couleurs sobres.** Rouge réservé aux 48 dernières heures avant un drop-off réel. Orange = warning. Bleu = neutral. Vert = ahead.
6. **Ton solidaire, pas accusateur.** "Voici comment rattraper" ≠ "tu n'es pas prêt".

→ La clause Follow the White Rabbit s'applique partout dans la NBA : alertes, verdicts, schedule status, drop-off risk, weakness flags. Aucune mauvaise nouvelle sans porte de sortie.

### Pattern complémentaire — Schedule Status

Validé par l'utilisateur (2026-05-05). Bar simple, motivante.

**Anatomie** :

| Bloc | Contenu |
|---|---|
| Label | `SCHEDULE STATUS` (+ tooltip d'explication) |
| Score actuel / target du jour | `75% / 29% target` (à droite) |
| **Lead margin** | `+46%` en grand vert, à droite de la barre |
| **Barre dégradée** | Bleu (départ) → Vert (lead) — la couleur encode visuellement l'avance |
| Marker target | Trait vertical sur la barre = position attendue aujourd'hui |

**Différence vs Progression Velocity** :
- **Velocity** = rythme (`+2.2%/week`, derivative)
- **Schedule** = position relative au calendrier (`+46% ahead`, integral)

Les deux sont complémentaires et doivent **coexister** dans le header GPS :
- Schedule Status en gros bandeau (motivation immédiate, lead margin)
- Velocity en carte secondaire (rythme, projection, required pace)

---

## 7. UX style — référence AI Coach

Inspiration : page `/coach` existante.

Principes :
- **Ton positif** — pas de "destroy", "kill", "sniper". Ahead-of-schedule, never surrender, daily sharpener, hero mode.
- **Pousser micro-action** — l'objectif n'est pas un grand chantier mais le **prochain petit pas**.
- **Métaphore GPS** — "tu es ici" → "voici les routes" → "voici l'itinéraire".
- **Surface motivante** — chaque retour sur la page rappelle au candidat qu'**il avance**.

---

## 8. Décisions actées

- Phase auto-classifiée par LM (discovery / consolidation / simulation / final_sprint) — backend `diagnostic_report.py` opérationnel.
- "Live Report" → renommé **"Instant Report"**.
- 4 phases pour le diagnostic, mais l'utilisateur ne choisit pas — auto-assignée par LM selon stats.
- Règle 3-pour-1 retirée le 2026-05-05 (CLAUDE.md mis à jour).
- Mock HTML statique d'abord (`frontend/public/wireframes/nba_mock.html`) avant code lourd.
- **Layout retenu** : v3 (3 tabs en haut) — fichier `wireframes/nba_v3.html`. Pas Gmail-style. Tabs : 📬 Inbox · 💬 Chat · 📊 Instant Report.
- Inbox = unifie Actions / Alerts / Disputes / Coach messages avec filtre chips. Sidebar Never Surrender 3-tier persistante à droite de l'Inbox.
- Chat = conversation directe avec le coach IA, quick-actions au-dessus de l'input.
- Instant Report = rapport diagnostic auto-classifié par LM (Sonnet 4.6, ~$0.015/clic), bouton régénérer.
- État GPS condensé en chip dans le header de page (Schedule + Velocity + Streak), pas de pleine carte sur la page NBA — ça libère du vertical.

---

## 9. Open questions

- [ ] Self-rate énergie/motivation/temps explicite à l'arrivée sur `/nba` ?
- [ ] Slot E garde le nom "Never Surrender" malgré la clause globale du même nom ? Ou rename ?
- [ ] Compléter le tableau des 14 règles (lecture intégrale de `planning_skill.py`)
- [ ] Comment afficher les 3 niveaux Topic/LM/LOS sur la même page sans la noyer ?
- [ ] Persistence Instant Report : ephemeral ou stocké en DB pour historique ?

---

## 10. Erreurs / corrections du LLM (audit perso)

> Section pour capturer les biais récurrents à corriger.

- Tendance à **proposer des features lourdes** alors que l'utilisateur veut du minimal / réutiliser l'existant.
- Tendance à **utiliser un ton négatif** (destroy, slay, sniper) — corriger vers positif.
- Tendance à **dumper toute la donnée** plutôt que la traduire en action.
- (à compléter)
