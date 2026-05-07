# Error Log — Spec

> Centre d'erreurs : registre granulaire de **chaque** question ratée, avec
> typologie, retake SRS, et alimentation du Weakness Pool.

**Status:** v1 (manuel via Error Debrief modal, single source, localStorage).
La v2 (auto-log quiz / mock / flashcard / SRS + classification + scheduling)
est en backlog.

---

## 0. Principe central — détection de récurrences

> **L'Error Log ne fait JAMAIS de dédup à l'écriture. C'est sa force.**

Chaque erreur produit **une entrée distincte**, même si la question avait déjà
été ratée auparavant. Le graal du système n'est pas de stocker des erreurs :
c'est de **repérer celles qui reviennent**.

Le `question.id` est la clé qui permet l'agrégation côté lecture :

| # entrées sur la même `question.id` | Interprétation |
|---|---|
| 1 | Erreur isolée — peut-être de l'étourderie. Pas d'action automatique. |
| **2** | **La question devient automatiquement une `weakness` dans le Weakness Pool.** Seuil dur. |
| 3+ | Faiblesse persistante — escalade SRS prioritaire, surfacée en haut de `/error-log`. |

**Implications de design :**
- Aucune fusion d'entrées — même si la question est strictement identique ou
  juste un concept vaguement similaire, deux entrées distinctes sont créées.
- L'agrégation par `question.id` se fait au moment de **lire** le log
  (Weakness Pool, dashboard, T-7 review), jamais au moment d'**écrire**.
- Pour les sources sans `question.id` stable (entrée manuelle), pas de
  détection automatique — l'utilisateur peut toujours lier deux entrées
  manuellement (planned).

---

## 1. Mission — les 5 rôles

L'Error Log fait exactement cinq choses, et rien d'autre :

### 1.1 Logger chaque erreur (granulaire, brute)

Chaque question ratée produit **une entrée** avec :
- `context` — LM, LOS
- `question.stem` — l'énoncé
- `answer.picked` — ta réponse
- `answer.correct` — la bonne réponse
- `correction.pitfall` — le piège dans lequel tu es tombé
- `classification.error_type` — pourquoi tu t'es planté : `calculation` |
  `concept` | `reading` | `known_trap` | `carelessness`

Une entrée = un événement d'erreur. Pas de fusion ni de dédup à ce niveau —
même si tu rates 3 fois la même question, on log 3 entrées (avec
`question_id` partagé pour permettre l'agrégation côté Weaknesses).

### 1.2 Catégoriser automatiquement (révéler les patterns)

Le champ `classification.error_type` est rempli :
- **par le système** quand le contexte le permet (ex : timeout > 90s →
  probable `reading` ou `time pressure` ; mauvais signe vs bon signe sur un
  calcul → `calculation` ; clé "except" raté → `reading`).
- **complété par l'utilisateur** lors de l'Error Debrief si le système n'a
  pas pu deviner.

L'agrégation par `error_type` × `topic` × `lm` révèle les patterns
récurrents — ex : "78% de tes erreurs ETH sont des `known_trap`, donc lis
plus lentement les Standards".

### 1.3 Alimenter le Weakness Pool

Les patterns d'erreurs alimentent les Weaknesses (vue agrégée par
question / LOS / topic). L'Error Log **pousse** ; le Weakness Pool ne crée
jamais d'entrée d'erreur de son côté.

**→ Règles d'agrégation, seuils, lifecycle : voir [weaknesses.md](weaknesses.md).**

### 1.4 Programmer le retake (SRS)

Chaque erreur `open` est inscrite dans un calendrier SRS (J+3 / J+10 / J+30,
sortie à 3 succès consécutifs). L'Error Log fournit la donnée brute
(`review.next_retake_date`, `review.retake_step`,
`review.consecutive_successes`) ; la queue elle-même est exposée par
`/review-queue`.

**→ Algorithme SRS détaillé, ordre de présentation, UI : voir [review_queue.md](review_queue.md).**

### 1.5 Servir de mémoire d'examen (T-7)

À 7 jours de l'examen, le plan de session bascule en mode "exam memory" :
- L'utilisateur ne révise plus du contenu neuf.
- Il **relit froid** son Error Log (ordre chronologique inverse) pour ne
  réviser **que ce qui l'a déjà piégé au moins une fois**.
- L'UI `/error-log` propose un mode "T-7 review" qui pagine entrée par
  entrée et masque les `mastered`.

---

## 2. Error Log vs Weaknesses

| | **Error Log** | **Weaknesses** |
|---|---|---|
| Granularité | Chaque erreur individuelle | Pattern agrégé |
| Nature | Brut, événementiel | Synthèse, dérivée |
| Source de vérité | Oui (registre canonique) | Non (vue calculée) |
| Cycle de vie | open → reviewed → mastered | tracked → developing → weak → critical |
| Qui alimente qui | Push vers Weaknesses | Read-only depuis Error Log |

**Règle :** une faiblesse n'existe que si elle s'appuie sur des entrées du
log. Pas d'entrée → pas de pattern → pas de faiblesse.

---

## 3. Sources (entrée du log)

| Source | Trigger | Auteur | Statut |
|--------|---------|--------|--------|
| `session` | Error Debrief modal sur `/` (réflexion manuelle sur la tâche précédente) | User | ✅ v1 |
| `quiz` | Mauvaise réponse en Targeted QBank / QM | Auto | planned |
| `mock` | Items ratés à la fin d'un Mock Exam (batch) | Auto | planned |
| `flashcard` | "Don't know" / fail recall sur une carte | Auto | planned |
| `srs` | Lapse sur une relance SRS programmée | Auto | planned |
| `manual` | Bouton "Flag" depuis n'importe quelle vue de contenu | User | planned |

Toutes les sources convergent sur **le même schéma** d'entrée (§ 4).

---

## 4. Schéma d'entrée

```ts
{
  id: 'err_<timestamp>'
  ts: ISO
  source: 'session' | 'quiz' | 'mock' | 'flashcard' | 'srs' | 'manual'
  context: {
    topic: 'ETH'
    lm:    'LM01'
    los?:  'LOS_ETH_01_1'
  }
  question: {
    stem:    string
    choices?: { A: string; B: string; C: string }   // MCQ
    id?:     string                                  // pour dédup côté Weaknesses
  }
  answer: {
    picked:           string
    correct:          string
    time_spent_sec?:  number
  }
  correction: {
    pitfall?:    string         // libre — "raté le mot 'except'"
    why_wrong?:  string
    why_right?:  string
  }
  classification: {
    error_type: 'calculation' | 'concept' | 'reading' | 'known_trap' | 'carelessness'
    auto:       boolean         // true si rempli par le système
  }
  review: {
    status:               'open' | 'reviewed' | 'mastered'
    consecutive_successes: number   // 0..3 ; 3 → mastered
    next_retake_date:     ISO       // J+3, J+10, J+30 selon le step
    retake_step:          1 | 2 | 3
    history: Array<{ ts: ISO; result: 'pass' | 'fail' }>
  }
  tags?: string[]
}
```

v1 actuel : sous-ensemble libre (juste `notes` free-text + meta). Migration
vers ce schéma au moment de wirer la 1ʳᵉ source `auto` (probablement quiz).

---

## 5. UI surfaces

| Surface | Rôle | Lecture | Écriture |
|---------|------|---------|----------|
| Error Debrief modal sur `/` | Saisie manuelle d'une erreur post-session | — | ✅ source=`session` |
| `/error-log` | Liste brute, chrono inverse, filtre par topic | ✅ | (delete only) |
| Quiz / Mock runners (planned) | Auto-log à chaque mauvaise réponse | — | ✅ source=`quiz` / `mock` |
| `/weaknesses` (planned) | Agrégation par `question.id` + LOS — affiche les patterns récurrents (cf. §0) | ✅ | — |
| `/review-queue` (planned) | SRS — cartes dues à J+3 / J+10 / J+30 ; priorité aux entrées issues de `/weaknesses` (≥ 2 récurrences) | ✅ | ✅ (status `pass`/`fail` côté `review.history`) |
| `/coach` (planned) | Détection de patterns transverses ; injecte des suggestions de session | ✅ | ✅ source=`coach` (méta-entrées) |
| Mode T-7 sur `/error-log` (planned) | Relecture froide pré-examen — masque les `mastered` | ✅ | — |

---

## 6. Backend (planned)

Endpoints propres à l'Error Log (CRUD sur les entrées) :

```
POST   /api/errors                       # créer
GET    /api/errors?topic=&lm=&status=    # filtrer
PATCH  /api/errors/{id}                  # enrichir / changer status
DELETE /api/errors/{id}
```

Les endpoints d'agrégation (`/api/weaknesses/...`) et de SRS
(`/api/review-queue/...`, `POST /api/errors/{id}/retake`) sont définis
dans leurs propres specs : [weaknesses.md](weaknesses.md) /
[review_queue.md](review_queue.md).

Stockage v1 = `localStorage.wingman_error_log` (≤200 entrées). Migration
backend dès la première source auto.

---

## 7. Open questions

Questions propres à l'Error Log (les autres sont dans
[weaknesses.md](weaknesses.md) et [review_queue.md](review_queue.md)) :

- ~~**De-dup**~~ — **résolu** (cf. §0) : jamais de fusion à l'écriture.
- **Auto-classification** : précision du moteur de catégorisation
  (`error_type`). Heuristiques simples au début, ML plus tard si données.
- **Édition de la classification** quand l'auto-tag se trompe — UI d'override.
- **Source `coach`** : méta-entrées générées par l'AI Coach ou interdit ?
- **Pruning au-delà de 200 entrées** localStorage avant migration backend.
- **Mode T-7** : trigger automatique (depuis `exam_date`) ou choix
  utilisateur ?
- **Métriques de succès** : KPIs qui prouvent que le log "marche" (% mastered
  à 30j, baisse du taux de récurrence, couverture LOS, etc.).
