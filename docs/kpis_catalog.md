# KPIs — Catalogue exhaustif

> Inventaire de tous les KPIs envisageables pour Wingman CFA L1, classés par
> dimension. À chaque KPI : définition, formule, seuils, cadence,
> action de remédiation quand 🔴.

**Compléments :**
- [kpis.md](kpis.md) — spec technique (sous-ensemble actif)
- [kpis_manifesto.md](kpis_manifesto.md) — doctrine

**Légende :**
- 🔴 critical · 🟠 watch · 🟢 healthy
- ✅ implémenté · ⚠️ partiel/proxy · ❌ pas encore

---

## A. Couverture & Volume

Mesure l'avancement physique dans le curriculum.

| KPI | Définition / Formule | 🔴 | 🟠 | 🟢 | Cadence | Action 🔴 | Statut |
|---|---|---|---|---|---|---|---|
| **LOS Completion Rate** | LOS validés / total LOS | < 40% à T-90j | 40-80% | 100% à T-30j | daily | Bascule plan en mode rattrapage | ⚠️ |
| **Reading Velocity** | Readings/sem vs rythme cible (4-6 sem buffer) | < 50% cible | 50-100% | ≥ 100% | weekly | Augmenter heures ou réduire scope | ❌ |
| **Burn-down** | Pages restantes / temps restant | Pente < théorique | ≈ | > théorique | daily | Repenser allocation hebdo | ❌ |
| **Topic Coverage Distribution** | Couverture par topic, pondérée par poids examen | 1 topic critique < 30% | tous ≥ 30% | tous ≥ 60% | daily | Forcer le topic en alerte | ⚠️ |
| **Sessions Total** | Nb total de sessions étudiées | < 20 à T-60j | 20-50 | ≥ 50 | daily | Diagnostic engagement | ✅ |
| **Hours Total** | Heures cumulées d'étude | < 100 à T-30j | 100-200 | ≥ 200 | daily | Vanity metric — voir manifeste | ✅ |
| **Questions Attempted** | Questions tentées (QBank) | < 500 à T-30j | 500-1500 | ≥ 1500 | daily | Augmenter cadence QBank | ✅ |

---

## B. Maîtrise & Qualité

Mesure la profondeur de compréhension.

| KPI | Définition / Formule | 🔴 | 🟠 | 🟢 | Cadence | Action 🔴 | Statut |
|---|---|---|---|---|---|---|---|
| **QBank Score Global** | % bonnes réponses, toutes Q | < 50% | 50-70% | ≥ 70% | per-session | Ralentir, retravailler concepts | ✅ |
| **QBank Score / Topic** | % par topic | < 65% (Alerte Rouge) | 65-70% | ≥ 70% | weekly | Replanifier ce topic en priorité | ⚠️ |
| **QBank Score / LOS** | % par LOS individuel | < 50% sur ≥ 5 Q | 50-70% | ≥ 70% | per-LOS | Re-révision ciblée LOS | ❌ |
| **First-pass Accuracy** | % de bonnes réponses au 1ᵉʳ passage uniquement | < 50% | 50-65% | ≥ 65% | per-question | Compréhension faible — revenir au support | ❌ |
| **Second-pass Δ** | Δ% entre 2ᵉ et 1ᵉʳ passage | Δ < 5 pts (mémorisation) | 5-15 | ≥ 15 (apprentissage) | post-retake | Force la rotation des questions | ❌ |
| **Concept Accuracy Rate** | Précision sur Q taguées « concept » | < 60% | 60-75% | ≥ 75% | weekly | Remédiation conceptuelle | ⚠️ |
| **Calculation Accuracy Rate** | Précision sur Q de calcul | < 70% | 70-85% | ≥ 85% | weekly | Drill calculatrice | ❌ |
| **Trap Error Rate** | % de Q taguées « piège CFA » ratées | > 50% | 30-50% | < 30% | weekly | Lecture 2× chaque énoncé | ✅ |
| **Difficulty-adjusted Score** | Score pondéré par la difficulté | < 50% | 50-70% | ≥ 70% | per-session | Trop d'easy — augmenter difficulté | ❌ |

---

## C. Rétention & Long-terme

Mesure la mémoire durable.

| KPI | Définition / Formule | 🔴 | 🟠 | 🟢 | Cadence | Action 🔴 | Statut |
|---|---|---|---|---|---|---|---|
| **Spaced Review Score (>30j)** | Score sur Q dont LOS étudié il y a > 30j | < 50% | 50-70% | ≥ 70% | weekly | Ajouter blocs SRS au plan | ⚠️ |
| **Spaced Review Score (>60j)** | Idem > 60j | < 40% | 40-60% | ≥ 60% | monthly | Idem, plus urgent | ❌ |
| **Decay Rate / Topic** | Δ score d'un topic entre étude initiale et review J+30 | > 25 pts | 10-25 pts | < 10 pts | monthly | Augmenter SRS sur ce topic | ❌ |
| **Retention Score Composite** | % retakes SRS réussis (J+3/J+10/J+30) sur 30j | < 50% | 50-75% | ≥ 75% | daily | Espacer plus, ralentir nouveau contenu | ✅ |
| **Mastered Cards** | Nb d'entrées Error Log passées `mastered` | — | — | + (croissance) | weekly | Bilan SRS | ⚠️ |
| **SRS Adherence** | % de retakes dus effectivement passés à temps | < 50% | 50-80% | ≥ 80% | daily | Cap quotidien SRS | ⚠️ |

---

## D. Vitesse & Efficacité

Le CFA est une course contre la montre.

| KPI | Définition / Formule | 🔴 | 🟠 | 🟢 | Cadence | Action 🔴 | Statut |
|---|---|---|---|---|---|---|---|
| **Time / Question** | Temps moyen par Q | > 120 s ou < 45 s | 90-120 s | ≈ 90 s | per-session | Drill timing strict | ❌ |
| **Time / Reading** | Temps lecture / nb pages | > 8 min/page | 4-8 | < 4 | per-reading | Survol exécutif au lieu de tout lire | ❌ |
| **Time / Mock Q** | Temps en condition mock (pression) | > 105 s | 90-105 s | ≤ 90 s | per-mock | Drill mocks chronométrés | ❌ |
| **Speed-Accuracy Curve** | Trade-off vitesse vs précision | accuracy chute > 15 pts en mode rapide | 5-15 pts | < 5 pts | weekly | Trouver son tempo optimal | ❌ |
| **Avg Session Duration** | Durée moyenne d'une session | < 20 min ou > 90 min | 20-90 | 25-60 (Pomodoro) | daily | Sessions hachées ou trop longues | ✅ |

---

## E. Cognitif & Metacognition

L'écart entre ce que tu crois savoir et ce que tu sais.

| KPI | Définition / Formule | 🔴 | 🟠 | 🟢 | Cadence | Action 🔴 | Statut |
|---|---|---|---|---|---|---|---|
| **Confidence Index (1-5)** | Auto-éval post-lecture | non rempli > 50% | rempli partiellement | systématique | per-reading | Forcer le widget post-lecture | ❌ |
| **Overconfidence Gap** | (Confidence × 20) − QBank% | > +20 pts | +10 à +20 | < +10 | weekly | Alerte biais — recalibrer | ⚠️ |
| **Underconfidence Gap** | QBank% − (Confidence × 20) | > +20 pts | +10 à +20 | < +10 | weekly | Boost moral, présenter les acquis | ❌ |
| **Calibration Score** | Corrélation confidence / accuracy sur 30j | < 0.4 | 0.4-0.7 | ≥ 0.7 | monthly | Travail réflexif post-quiz | ❌ |
| **Self-Reported Stress** | 1-5 par session | mediane > 4 sur 7j | 3-4 | < 3 | daily | Allègement plan, jours OFF | ❌ |

---

## F. Engagement & Comportement

Signaux d'usage. **Jamais des objectifs en soi** (cf. manifeste § VI).

| KPI | Définition / Formule | 🔴 | 🟠 | 🟢 | Cadence | Action 🔴 | Statut |
|---|---|---|---|---|---|---|---|
| **Streak Days** | Jours consécutifs ≥ 1 session | 0 | 1-6 | ≥ 7 | daily | Reprise via NBA | ✅ |
| **Days Since Last Session** | Inactivité | > 7 j | 3-7 | 0-2 | daily | Notification, allègement | ✅ |
| **Consistency Score** | Régularité 14j (streak + écart-type minutes) | < 30 | 30-65 | ≥ 65 | daily | Plan plus court mais quotidien | ✅ |
| **Session Completion Rate** | % de sessions planifiées effectivement faites | < 50% | 50-80% | ≥ 80% | weekly | Plan trop ambitieux — réduire | ✅ |
| **Abandon Rate** | % de sessions abandonnées en cours | > 30% | 10-30% | < 10% | weekly | Sessions plus courtes | ✅ |
| **Focus Score** | Inv. normalisé du temps inter-action | < 40 | 40-70 | ≥ 70 | per-session | Mode pomodoro strict | ✅ |
| **Pomodoro Adherence** | % sessions en mode pomodoro | — | — | informational | weekly | — | ❌ |
| **Time of Day Distribution** | Heures préférées d'étude | — | — | informational | weekly | Détecter la fenêtre productive | ❌ |
| **Velocity %/w** | Δ readiness_score par semaine | < +0.5 | +0.5 à +2 | > +2 | weekly | Méthode inefficace | ⚠️ |

---

## G. Mock Exams & Simulation

La seule vérité finale (cf. manifeste § I.8).

| KPI | Définition / Formule | 🔴 | 🟠 | 🟢 | Cadence | Action 🔴 | Statut |
|---|---|---|---|---|---|---|---|
| **Mock Score** | Score brut sur mock complet | < 60% | 60-70% | ≥ 70% | per-mock | Diagnostic complet | ❌ |
| **Mock Δ Progression** | Score Mock N+1 − Mock N | < 0 | 0-3 pts | ≥ 3 pts | per-mock | Méthode à revoir | ❌ |
| **Mock Score / Section** | Score AM/PM ou par section | section < 55% | 55-65% | ≥ 65% | per-mock | Section à prioriser | ❌ |
| **Time Adherence Mock** | % du temps respecté par section | dépassement > 10% | 0-10% | dans les temps | per-mock | Drill timing | ❌ |
| **Mock Coverage** | % des LOS rencontrés dans tes mocks cumulés | < 70% à T-30j | 70-90% | ≥ 90% | weekly | Choisir mocks couvrant les gaps | ❌ |
| **Mock Pass Rate** | % de tes mocks ≥ 70% | 0% sur 3 derniers | 1-2 sur 3 | 3 sur 3 | weekly | Pas prêt pour examen | ❌ |
| **Best vs Average Mock** | Δ entre meilleur et moyenne | > 15 pts (instable) | 5-15 | < 5 | per-mock | Stabiliser via drill | ❌ |

---

## H. Diagnostic d'erreurs (Error Patterns)

Issus de l'Error Log. Vue détaillée [errors_log.md](errors_log.md).

| KPI | Définition / Formule | 🔴 | 🟠 | 🟢 | Cadence | Action 🔴 | Statut |
|---|---|---|---|---|---|---|---|
| **Error Type Distribution** | % par catégorie : knowledge / misinterpretation / calculation / known_trap / carelessness | une catégorie > 50% | une 30-50% | équilibré | weekly | Remédiation ciblée par type | ⚠️ |
| **Recurrent Errors** | Nb de questions ratées ≥ 2× (cf. errors_log § 0) | > 20 | 10-20 | < 10 | daily | Forcer SRS prio | ⚠️ |
| **Critical Recurrences** | Questions ratées 3+× | > 5 | 2-5 | 0-1 | daily | Intervention manuelle (Coach) | ❌ |
| **Error Quality Score** | Erreurs concentrées (haut) vs dispersées (bas) | < 40 | 40-65 | ≥ 65 | weekly | Errors trop hétérogènes — trier | ✅ |
| **Time-to-Resolution** | J entre création d'une entrée et son passage `mastered` | > 60 j | 30-60 | < 30 | per-entry | SRS pas assez aggressif | ❌ |
| **Open Errors Count** | Entrées Error Log avec status=open | > 100 | 50-100 | < 50 | daily | Nettoyer via Error Debrief | ⚠️ |

---

## I. Risque & Santé

Détection précoce du décrochage ou de la fatigue.

| KPI | Définition / Formule | 🔴 | 🟠 | 🟢 | Cadence | Action 🔴 | Statut |
|---|---|---|---|---|---|---|---|
| **Dropoff Risk Score** | Composite (inactivité + abandon + irrégularité) | > 70 | 40-70 | < 40 | daily | Notification + allègement | ✅ |
| **Burnout Indicator** | Heures > 50/sem AND consistency baisse | true 3+ sem | true 1-2 sem | false | weekly | Forcer 1-2 jours OFF | ❌ |
| **Plateau Indicator** | Velocity = 0 sur 3 sem alors que < MPS | true | velocity < +0.3 | > +0.5 | weekly | Repenser méthode | ❌ |
| **Coverage Lag** | LOS Completion vs LOS Completion attendu (linéaire jusqu'à T-30j) | retard > 20% | 5-20% | ≤ 5% | weekly | Replanification | ❌ |
| **Time-to-Exam Health** | Évalue si le temps restant suffit à atteindre MPS au rythme actuel | « pas atteignable » | « tendu » | « OK » | weekly | Réduire scope ou repousser | ❌ |
| **Engagement Decay** | Pente du temps quotidien sur 14j | pente < -10%/sem | -5% à -10% | ≥ 0% | daily | Notification motivation | ❌ |

---

## J. Stratégique & Allocation

Pour piloter l'allocation d'énergie (cf. manifeste § I.4).

| KPI | Définition / Formule | 🔴 | 🟠 | 🟢 | Cadence | Action 🔴 | Statut |
|---|---|---|---|---|---|---|---|
| **Weighted Mastery Index / Topic** | (Tc × 0.3) + (Qacc × 0.5) + (Racc × 0.2) | < 50% sur topic à fort poids | 50-70% | ≥ 70% | daily | Replan plan vers ce topic | ❌ |
| **Score Impact Estimé** | Pts gagnés au mock par heure investie / topic | < 0.3 pt/h | 0.3-0.7 | ≥ 0.7 | weekly | Bascule vers topic à fort ratio | ❌ |
| **Topic Allocation Hours** | Heures investies / topic, vs poids examen | écart > 30% | 10-30% | ≤ 10% | weekly | Redistribuer | ⚠️ |
| **High-leverage Topic Coverage** | Couverture des topics à ≥ 13% poids (Ethics, FSA) | < 70% | 70-90% | ≥ 90% | daily | Prioriser | ❌ |
| **MPS Probability** | Probabilité estimée de passer le MPS, basée sur composite | < 30% | 30-65% | ≥ 65% | daily | Re-stratégie complète | ⚠️ (proxy = readiness) |

---

## K. Composite & Headline

KPIs uniques qui résument tout.

| KPI | Définition / Formule | 🔴 | 🟠 | 🟢 | Cadence | Action 🔴 | Statut |
|---|---|---|---|---|---|---|---|
| **Indice de Vélocité Adaptatif (IVA)** | `(V_réelle / V_requise) × Score_Maîtrise` — fusionne rythme + qualité + pression temporelle | < 0.5 | 0.5-0.9 | ≈ 1.0 (≥ 1.1 buffer) | weekly | Diagnostic ratio (rythme ou maîtrise ?) | ❌ |
| **Readiness Score** | (mastery × 0.45) + (consistency × 0.20) + (retention × 0.20) + (coverage × 0.15) | < 35 | 35-65 | ≥ 65 (≥ 80 confortable) | daily | Diagnostic complet | ✅ |
| **Estimated Exam Score** | Mock-derived ou QBank-pondéré si pas de mocks | < 60% | 60-70% | ≥ 70% | per-session | Re-strat | ✅ |
| **Days to MPS** | Jours estimés au rythme actuel pour atteindre MPS | > jours restants | 80-100% jours rest. | < 80% | weekly | Accélérer ou réduire scope | ❌ |
| **Wingman Health Index** | Méta-KPI : moyenne des composites secondaires (engagement / mastery / risk) | < 50 | 50-70 | ≥ 70 | daily | — | ❌ |

### K.bis — Détail de l'IVA

L'IVA combine **les 3 dimensions critiques** en un seul nombre :
état des lieux, rythme, pression temporelle. Le **multiplicatif** par le
Score de Maîtrise est intentionnel — foncer sans rien retenir donne un
IVA bas même si V_réelle est haute.

```
                  V_réelle
   IVA  =   ─────────────────  ×  Score_Maîtrise
                 V_requise
```

| Variable | Définition |
|---|---|
| `V_réelle` | LOS validés / sem sur les 14 derniers jours |
| `V_requise` | LOS restants / (semaines avant T-30j buffer) |
| `Score_Maîtrise` | QBank Score Global pondéré par poids examen, normalisé 0-1 |

**Interprétation :**

| IVA | État |
|---|---|
| **≥ 1.1** | 🟢 En avance + qualité OK — buffer confortable |
| **≈ 1.0** | 🟢 Sur les rails |
| **0.7 - 0.9** | 🟠 Tendu — soit rythme insuffisant, soit qualité moyenne |
| **0.5 - 0.7** | 🟠 Décrochage — diagnostiquer la composante faible |
| **< 0.5** | 🔴 Pas viable au rythme actuel — re-stratégie obligatoire |

**Diagnostic du ratio (quand IVA est rouge ou orange) :**

1. Si `V_réelle / V_requise` < 0.8 ET `Score_Maîtrise` ≥ 0.7 → **problème
   de rythme**, pas de qualité. Augmenter heures/sem ou réduire scope.
2. Si `V_réelle / V_requise` ≥ 0.9 ET `Score_Maîtrise` < 0.6 → **problème
   de qualité**, pas de rythme. Ralentir, faire plus de QBank/SRS sur
   chaque LOS avant d'avancer.
3. Si **les deux faibles** → re-stratégie complète : envisager de
   repousser l'examen ou de réduire le scope (concentrer sur les topics
   à fort poids).

**Avantage vs autres KPIs composites :**

- Le **Readiness Score** est un instantané, l'IVA est une **trajectoire**.
- Les 2 sont complémentaires : Readiness dit « où je suis aujourd'hui »,
  IVA dit « est-ce que je vais arriver à temps avec mon rythme actuel ».
- L'IVA est résistant à Goodhart's law : on ne peut pas tricher sur le
  numérateur (vélocité) sans payer sur le multiplicateur (maîtrise).

---

## L. Framework alternatif — 5 KPIs + Readiness Index v2 🆕 à arbitrer

> Proposition concurrente : ramener à **5 KPIs canoniques** et un composite
> binaire (Strong Pass / Borderline / High Risk). À arbitrer contre l'IVA
> (§ K.bis) et le Readiness Score existant (§ K).

### L.1 — Les 5 KPIs canoniques

| Symbole | Nom | Mesure | Cible | Mapping vers § A-K | 🆕 ? |
|---|---|---|---|---|---|
| **V<sub>c</sub>** | Vélocité de Couverture | Chapitres terminés / planning théorique (« burn-down ») | 100% à T-30j (zone danger sinon) | A.2 (Reading Velocity) + A.3 (Burn-down) | ré-pondéré |
| **Acc<sub>1</sub>** | Taux Réussite Premier Passage | % bonnes réponses sur Q de fin de chapitre (EOC), juste après la lecture | > 70% | B.4 (First-pass Accuracy) — mais spécifique aux EOC | scope précis |
| **T<sub>eff</sub>** | Efficacité Temporelle | Temps moyen / question | ≈ 90 s (L1) ; malus si > 100 s | D.1 (Time / Question) | identique |
| **R<sub>coeff</sub>** | Coefficient de Rétention | Score sur quiz portant sur sujets vus il y a > **15 jours** | Δ (Acc₁ − R) > -15% = alerte SRS | C.1 (Spaced Review > 30j) — fenêtre plus serrée | 15j vs 30j |
| **P<sub>strat</sub>** | Maîtrise des Piliers Stratégiques | Score moyen pondéré sur les **« Big 4 »** : Ethics + FRA + Fixed Income + Equity | ≥ 70% | — | **🆕** |

### L.2 — Readiness Index v2

Formule composite proposée :

```
RI = (V_c × 0.20) + (Acc_1 × 0.30) + (R_coeff × 0.25) + (P_strat × 0.25)

Malus appliqué si T_eff > 100 s.
```

Note : `T_eff` n'entre pas dans la pondération mais agit comme **gate
multiplicatif** (pénalité). Logique : pas la peine d'avoir 90% de bonnes
réponses si c'est en 3 min/Q — tu échoues le jour J par timeout.

### L.3 — Interprétation du signal

| RI | Statut | Action immédiate |
|---|---|---|
| **> 80%** | 🟢 Strong Pass | Simuler examens complets — gérer le stress |
| **65 - 80%** | 🟠 Borderline | Identifier le KPI le plus faible des 5 → deep dive ciblé |
| **< 65%** | 🔴 High Risk | Re-stratégie : prioriser Éthique + gros coefficients (Big 4) |

### L.4 — Visualisation Radar

Les 5 KPIs se prêtent parfaitement à un **Radar Chart** (5 axes, valeurs
normalisées 0-100) :
- **Forme équilibrée + large** = préparation saine
- **Forme étoilée pointue** = lacunes critiques (ex: rapide mais imprécis,
  ou bonne mémoire mais trop lent)

Pourquoi pertinent : permet en un coup d'œil de voir **quelle dimension
manque**, là où un score composite (RI seul) cache l'asymétrie.

### L.5 — Comparaison avec les autres composites

| Composite | Domaine | Force | Faiblesse |
|---|---|---|---|
| **Readiness Score** (§ K) | Composite global pondéré (mastery+consistency+retention+coverage) | Tient compte de l'engagement | Ne tranche pas binaire prêt/pas prêt |
| **IVA** (§ K.bis) | Rythme × Maîtrise | Capture la trajectoire (« vais-je arriver à temps ») | Pas de prise en compte topic-weight |
| **Readiness Index v2** (§ L) | 5 KPIs pondérés + malus temps + Big 4 explicites | Statut binaire actionnable, intègre la stratégie poids-examen | Ignore engagement/régularité |

**À trancher :**
- Garde-t-on les 3, ou on consolide en 1 seul composite headline ?
- L'IVA est plus orienté « pilotage en cours », le RI v2 plus « décision finale » → potentiellement complémentaires
- Le **P<sub>strat</sub>** (Big 4) est la vraie nouveauté — à garder dans tous les cas, indépendamment du composite choisi

---

## Implémentation prioritaire

Si l'on devait câbler les KPIs un à un, l'ordre recommandé est :

1. **A1 LOS Completion** — le préalable de tout
2. **B2 QBank Score / Topic** — le proxy le plus fidèle du mock
3. **C1 Spaced Review Score (>30j)** — la vérité de la rétention
4. **B4 First-pass Accuracy** — diagnostic compréhension réelle
5. **E2 Overconfidence Gap** — détecteur de biais critique
6. **G2 Mock Δ Progression** — quand les mocks démarrent
7. **J1 Weighted Mastery Index** — le headline produit
8. Le reste, à mesure que les data sources existent.

---

*Dernière révision : 2026-04-29.*
