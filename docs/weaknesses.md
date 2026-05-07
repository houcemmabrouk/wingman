# Weaknesses — Spec

> Vue agrégée des patterns récurrents extraits de l'Error Log. Pas une source
> de vérité — c'est une **dérivée** du log.

**Status:** planned. UI sidebar entry existe (`/weaknesses` actuellement
redirigée vers `/readiness`), pas encore d'agrégation.

**Dépend de :** [errors_log.md](errors_log.md) (schéma des entrées + principe
de récurrence). Cette doc ne définit que **les règles d'agrégation** et l'UI
qui les expose.

---

## 1. Mission

Transformer le flux brut d'erreurs (Error Log) en **2 niveaux de patterns
exploitables** :

1. **Par question** — quand la même question a été ratée plusieurs fois.
2. **Par LOS** — quand un Learning Outcome Statement accumule des erreurs sur
   plusieurs questions différentes.

Le but : donner à l'utilisateur **3 tableaux de bord** (Q-recurrentes,
LOS-fragiles, topic-fragiles) pour répondre à la question "sur quoi je dois
me concentrer cette semaine ?"

---

## 2. Règles d'agrégation

### 2.1 Niveau Question — récurrence stricte (signal fort)

Trigger sur le **`question.id`** d'entrées du log avec `review.status ∈ {open, reviewed}` :

| # entrées sur la même question | Statut weakness |
|---|---|
| 1 | (rien — pas une weakness) |
| **2** | `weak` ⚠️ |
| 3+ | `critical` 🔥 |

Aucun fenêtrage temporel à ce niveau — une question ratée 2 fois reste une
weakness tant qu'elle n'est pas `mastered` (3 succès consécutifs au retake,
cf. [review_queue.md](review_queue.md)).

### 2.2 Niveau LOS — agrégation (signal faible)

Trigger sur le `context.los` (ou `context.lm` si LOS absent) :

| Condition | Statut weakness |
|---|---|
| ≥ 3 entrées open sur le même LOS | `developing` |
| ≥ 5 entrées open sur le même LOS dans les 14 derniers jours | `weak` |
| ≥ 8 entrées open + ≥ 2 SRS lapses sur le même LOS | `critical` |

Les seuils sont des **defaults** ; à calibrer après 2-3 semaines de data
réelle.

### 2.3 Niveau Topic — vue d'ensemble

Roll-up : un topic est `weak` si il contient ≥ 2 LOS `weak`+, `critical` si
≥ 1 LOS `critical`. C'est ce qu'affiche `/readiness` aujourd'hui (vue
"Skills Assessment").

---

## 3. Lifecycle

```
       (rien)
         │
   2 entrées sur Q
         ↓
       weak  ←──────────┐
         │              │ retake fail
   3+ entrées sur Q     │
         ↓              │
     critical           │
         │              │
   3 succès consécutifs │
         ↓              │
     mastered ──────────┘
```

Une weakness n'est jamais "supprimée" — elle passe `mastered` et reste
visible avec un badge ✓ pour l'historique. Filtrable via toggle "Hide mastered"
dans l'UI.

---

## 4. UI `/weaknesses`

```
┌─────────────────────────────────────────────────────────┐
│ Weaknesses                                              │
│ 12 patterns · 3 critical · 5 weak · 4 developing        │
├─────────────────────────────────────────────────────────┤
│ [ Filter ] All  Critical  Weak  Developing  Mastered    │
│ [ Sort ]   By severity  ·  By LOS  ·  By topic          │
├─────────────────────────────────────────────────────────┤
│ 🔥 Q-RECURRENTES (≥3 fois ratées sur la même question)  │
│   ETH-LM01 · "Standard III(C) — Suitability"            │
│     5 ratés · dernier J-2 · prochaine retake J+3        │
│   FI-LM03 · "Duration formulae for ZCB"                 │
│     3 ratés · dernier J-7                               │
│                                                         │
│ ⚠️  LOS-FRAGILES (≥5 erreurs en 14j sur le même LOS)    │
│   FSA-LM02 — Income Statement                           │
│     7 erreurs (5 questions différentes) · 2 SRS lapses  │
│                                                         │
│ 📊 TOPICS                                               │
│   ETH  ████████░░  weak                                 │
│   FSA  ██████░░░░  developing                           │
└─────────────────────────────────────────────────────────┘
```

Chaque ligne est cliquable → ouvre les entrées sous-jacentes du log
(filtre `topic`+`lm`+`los` appliqué sur `/error-log`).

---

## 5. Backend (planned)

```
GET /api/weaknesses                    → 3 niveaux (question, LOS, topic)
GET /api/weaknesses/by-question        → [{ question_id, count, status, last_ts }]
GET /api/weaknesses/by-los?topic=ETH   → [{ los, count, status, ... }]
GET /api/weaknesses/by-topic           → [{ topic, status, weak_los_count }]
```

Pas d'écriture — les agrégations sont calculées à la volée depuis
`/api/errors`. Mise en cache côté serveur (Redis, TTL 5 min) pour les vues
les plus consultées.

---

## 6. Open questions

- **Seuils calibrables par utilisateur ?** (ex: étudiant rapide veut
  `weak` à 4 plutôt que 5)
- **Décay** : une weakness LOS doit-elle "se calmer" toute seule si pas
  d'erreur depuis 30j, ou attendre les 3 succès consécutifs au retake ?
- **Cross-LM patterns** : si le user rate des questions sur "Bond pricing"
  réparties entre FI-LM03, FI-LM04, FI-LM05 — on agrège par concept
  trans-LM ? (probablement scope C, pas v1)
