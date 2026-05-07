# Review Queue — Spec

> Spaced Repetition (SRS) construit à partir des entrées de l'Error Log.
> Décide **quoi retester aujourd'hui** et selon quel calendrier.

**Status:** planned. UI sidebar entry existe (`/review-queue` actuellement
"Soon"), pas encore d'algo.

**Dépend de :**
- [errors_log.md](errors_log.md) — schéma des entrées et leur champ `review`.
- [weaknesses.md](weaknesses.md) — utilise le statut weakness pour
  prioriser l'ordre de retake.

---

## 1. Mission

Pour chaque erreur encore `open` dans l'Error Log, calculer **quand la
retester** et **dans quel ordre la présenter** quand le user ouvre la queue.

- Pas de retake sauvage : on respecte un calendrier qui force l'oubli
  partiel pour ancrer durablement.
- Sortie programmée : 3 succès consécutifs → l'entrée passe `mastered` et
  quitte la queue.

---

## 2. Calendrier de retake

```
[entry created]
     │
     ↓ (J+3)
[retake step 1]  ─── pass ──→  step 2
                ─── fail ──→  reset → step 1 dans 3j
     │
     ↓ (J+10 du step 1 réussi)
[retake step 2]  ─── pass ──→  step 3
                ─── fail ──→  reset → step 1 dans 3j
     │
     ↓ (J+30 du step 2 réussi)
[retake step 3]  ─── pass ──→  mastered ✓ (sortie de la queue)
                ─── fail ──→  reset → step 1 dans 3j
```

**Règles :**
1. **3 succès consécutifs requis** pour `mastered`. Pas 3 succès cumulés —
   3 d'affilée, sinon le compteur repart à 0.
2. **Un échec à n'importe quel step** → retour à step 1, prochain retake à
   J+3 du fail.
3. Les dates sont stockées dans l'entrée :
   `review.next_retake_date`, `review.retake_step`,
   `review.consecutive_successes`, `review.history[]`.

---

## 3. "Sur quoi" portent les retakes

C'est l'**open question Q1** d'errors_log.md. Trois options sur la table :

| Option | Description | Pro | Con |
|---|---|---|---|
| **a) Same Q** | Le retake = la **même question** (même `question.id`) | Simple, déterministe | User mémorise la réponse, pas le concept |
| **b) Variant** | Variante générée par Claude sur le même LOS | Anti-mémorisation, force la généralisation | Coûte un appel LLM par retake |
| **c) Random LOS** | N'importe quelle Q du même LOS depuis QBank | Léger, pas de génération | Bruit (Q triviale ≠ Q originale) |
| **d) Hybrid** | Step 1 = same Q, steps 2-3 = variant | Compromis | Implé plus complexe |

**Reco par défaut : (a) Same Q** pour le MVP. (d) hybrid si on veut investir
plus tard.

---

## 4. Ordre de présentation dans la queue

Quand le user ouvre `/review-queue`, on lui montre N entrées dues
aujourd'hui. L'ordre est piloté par **3 critères** :

1. **Severity weakness** (cf. [weaknesses.md](weaknesses.md)) : `critical`
   d'abord, puis `weak`, puis le reste.
2. **Step en cours** : step 1 d'abord (les fragiles), puis step 2, puis
   step 3.
3. **Date d'échéance** : les plus en retard d'abord.

Les retakes en retard de plus de 7 jours sont **regroupés en haut** avec un
badge "Overdue" pour qu'ils ne soient pas noyés.

---

## 5. UI `/review-queue`

```
┌─────────────────────────────────────────────────────────┐
│ Review Queue                                            │
│ 14 dues today · 3 overdue · 47 scheduled this week      │
├─────────────────────────────────────────────────────────┤
│ 🔥 OVERDUE (3)                                          │
│   ETH-LM01 · "Standard III(C) — Suitability"            │
│     critical · step 1 · prévu J-7                       │
│     [ Take retake ]                                     │
│                                                         │
│ ⏰ DUE TODAY (11)                                        │
│   FI-LM03 · "ZCB duration"                              │
│     weak · step 2 · prévu aujourd'hui                   │
│     [ Take retake ]                                     │
│   ... 10 more                                           │
│                                                         │
│ 📆 UPCOMING (this week)                                 │
│   J+1: 8 entries · J+3: 12 · J+5: 9 · J+7: 18           │
└─────────────────────────────────────────────────────────┘
```

Click "Take retake" → ouvre un modal avec la question (mode (a) Same Q
par défaut). User répond → enregistre `pass`/`fail` dans
`review.history`, met à jour `review.consecutive_successes`,
`review.retake_step`, `review.next_retake_date` selon les règles § 2.

---

## 6. Backend (planned)

```
GET   /api/review-queue?date=YYYY-MM-DD     → entries dues à cette date
POST  /api/errors/{id}/retake               body: { result: 'pass' | 'fail' }
                                            → server applique les transitions § 2,
                                              renvoie le nouvel état review.
GET   /api/review-queue/upcoming?days=7     → vue 7 jours
```

Le calcul des prochaines `next_retake_date` se fait **côté serveur** lors
du POST `/retake` — la source de vérité du calendrier reste dans la DB.

---

## 7. Open questions

- **Cap quotidien** : si une session intense produit 50 erreurs, on ne
  veut pas 50 retakes le J+3. Cap à 15 par jour ? Spread sur 2-3 jours ?
- **Skip option** : autoriser le user à dire "skip cette retake aujourd'hui,
  reporte de 1 jour" ? Risque de procrastination.
- **Variant generation** (option b/d) : si on prend ce chemin, qui paye
  l'appel LLM ? Cache ? Pré-génération en batch la nuit ?
- **Mock exam impact** : si le user passe un mock et rate à nouveau une
  question déjà dans la queue, on traite comme `fail` (reset step) ou
  comme un signal indépendant ?
