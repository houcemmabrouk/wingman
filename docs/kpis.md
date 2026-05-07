# KPIs — Framework CFA Level 1

> Indicateurs de performance pour piloter une révision CFA L1 sans se noyer
> dans les heures cumulées. La donnée brute ne vaut rien sans contexte.

**Philosophie :** un chapitre lu n'est pas un chapitre acquis. Le but n'est
pas 100% partout, mais d'atteindre le MPS (Minimum Passing Score) avec une
allocation d'énergie qui respecte le poids de chaque topic à l'examen.

**Surface UI :** modale d'aide accessible via le **?** sur `/results` et
`/progression` (à venir).

---

## 1. KPIs de Couverture (quantitatifs)

Mesurent l'avancement « physique » dans le curriculum.

| KPI | Définition | Cible / Seuil |
|---|---|---|
| **LOS Completion Rate** | % de Learning Outcome Statements validés / total | 100% requis avant T-30j |
| **Reading Velocity** | Readings terminés / semaine, comparé au rythme nécessaire pour finir 4-6 sem. avant l'examen (« buffer zone ») | ≥ rythme cible |
| **Burn-down** | Pages ou chapitres restants / temps disponible (graphe linéaire descendant) | Pente ≥ pente théorique |

---

## 2. KPIs de Maîtrise (qualitatifs)

C'est ici que se joue la réussite.

| KPI | Définition | Cible / Seuil |
|---|---|---|
| **QBank Score / Topic** | Précision moyenne en QBank par topic | 🟢 ≥ 70% · 🟠 65-70% · 🔴 < 65% (Alerte Rouge) |
| **First-pass vs Second-pass Accuracy** | Précision au 1ᵉʳ passage d'une question vs au 2ᵉ. Un gap large = apprentissage réel ; un gap nul = mémorisation des réponses | 1ᵉʳ pass < 70% mais 2ᵉ ≥ 85% = sain |
| **Time / Question** | Temps moyen passé par question | Cible ≈ **90 s** pour L1 |

---

## 3. KPIs de Rétention (long-term)

Le programme est si vaste que l'on oublie les premiers chapitres en avançant.

| KPI | Définition | Cible / Seuil |
|---|---|---|
| **Spaced Review Score** | Score sur quiz aléatoire portant uniquement sur des chapitres étudiés **il y a > 30 jours** | ≥ 60% sinon décrochage |
| **Confidence Index (1-5)** | Auto-éval par lecture (« je me sens à 4/5 sur ce chapitre ») | Comparer avec QBank du topic. Confidence 5 + QBank 40% = biais cognitif → corriger |

---

## 4. KPIs des Mock Exams (phase finale)

À activer dans le dernier mois.

| KPI | Définition | Cible / Seuil |
|---|---|---|
| **Delta Progression** | Score Mock N+1 − Score Mock N | Trend ≥ 0 entre 2 mocks consécutifs |
| **Error Type Distribution** | Répartition des fautes en 3 buckets : `knowledge_gap` / `misinterpretation` / `calculation` | Si `calculation` > 30% → fatigue ou vitesse, si `misinterpretation` > 30% → relire 2× chaque énoncé |

---

## 5. Indice de Maîtrise Pondéré (par topic)

Score composite calculé à la volée pour chaque topic :

```
Score_Topic = (T_c × 0.3) + (Q_acc × 0.5) + (R_acc × 0.2)
```

| Variable | Définition |
|---|---|
| `T_c` | Taux de complétion du chapitre (0-100) |
| `Q_acc` | Précision sur les questions d'entraînement (0-100) |
| `R_acc` | Précision lors des sessions de révision globale (0-100) |

La **maîtrise** pèse plus que la couverture (50% vs 30%) : avancer sans
maîtriser est un piège.

---

## 6. Allocation MPS-orientée

> **L'objectif n'est pas 100% partout — c'est d'atteindre le MPS.**

Si un topic plafonne et représente un faible poids à l'examen, **bascule
l'énergie** vers les topics à fort poids :

| Topic | Poids L1 (~) | Stratégie |
|---|---|---|
| Ethics | 15-20% | Toujours prioritaire — tiebreaker au MPS |
| FSA | 13-17% | Forte rentabilité points/heure |
| FI / Equity | ~10% chacun | Standard |
| Quants / Eco / Corp / PM | 8-12% chacun | Solidifier, ne pas viser l'excellence |
| Derivatives / Alternatives | 5-8% chacun | Plafond OK — n'y mets pas tes meilleures heures |

**Règle de pouce :** un topic à 5% du poids dont tu plafonnes à 60% coûte
moins cher à l'examen qu'un topic à 17% à 60% — bascule vers le 17%.

---

## 7. Mapping vers les KPIs backend actuels

Tableau de passage entre ce framework et les champs renvoyés par
`/api/kpis` aujourd'hui (incomplets — à compléter au fil des
implémentations).

| Framework | Champ backend | Statut |
|---|---|---|
| LOS Completion Rate | `coverage_pct` (proxy) | ⚠️ approximation |
| QBank Score / Topic | `avg_quiz_score` (global, pas par topic) | ⚠️ à raffiner |
| Time / Question | — | ❌ pas exposé |
| Spaced Review Score | `retention_score` (proxy) | ⚠️ à raffiner |
| Confidence Index | — | ❌ pas implémenté (besoin d'un input post-lecture) |
| First-pass vs Second-pass | — | ❌ pas implémenté |
| Mock Delta | — | ❌ pas de stockage Mock distinct |
| Error Type Distribution | `error_quality_score` (proxy) | ⚠️ à raffiner |
| Indice Maîtrise Pondéré | — | ❌ à calculer côté frontend depuis 3 champs |

Les champs ❌ devront être ajoutés progressivement quand chaque feature
upstream existe (ex : Confidence Index nécessite un widget post-lecture
puis une persistance).
