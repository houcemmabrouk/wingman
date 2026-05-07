# Claude Weekly Digest — Spec

> Message hebdomadaire généré par Claude, comparant la situation de la semaine
> en cours à celle de la semaine précédente. Délivré à la première connexion
> en semaine, sous forme d'un mail élaboré.
>
> **Hors scope MVP.** Spec en attente. Référencé depuis [`coach_communication.md`](coach_communication.md) § 6.

Date : 2026-05-06

---

## 0. Décisions verrouillées (haut niveau)

- **Cadence** : 1 message / semaine, déclenché à la **première connexion en semaine** (lundi-vendredi, premier login de la semaine ISO).
- **Generation** : appel LLM (Claude) — c'est l'**exception** au "pas de LLM dans /inbox". Justifié par fréquence basse (1×/sem) et valeur élevée (élaboré, comparatif).
- **Format de sortie** : "mail élaboré" — pas une bulle inbox courte. Structure email à figer § 2.
- **Comparaison** : semaine en cours vs semaine précédente. Le diff est le cœur du message.

## 1. Informations envoyées à Claude — toutes les métriques

Décision : **payload complet, pas de cherry-pick**. Claude reçoit toute la donnée pertinente, charge à lui de hiérarchiser dans le mail. Toujours par paire `current_week` vs `previous_week` quand le diff a du sens.

### Schéma JSON envoyé

```json
{
  "user": {
    "user_id": "uuid",
    "display_name": "string",
    "language": "fr|en",
    "exam_date": "2026-08-18",
    "days_until_exam": 104,
    "daily_minutes_goal": 90,
    "iso_year_week": "2026-W19"
  },

  "engagement": {
    "current_week":  { "sessions": 7, "study_minutes": 540, "active_days": 5 },
    "previous_week": { "sessions": 4, "study_minutes": 240, "active_days": 3 },
    "streak_current": 12,
    "streak_max":     14,
    "xp_total":       1850,
    "xp_delta_week":  120
  },

  "performance": {
    "current_week":  { "attempts": 145, "correct": 119, "score_pct": 82.0, "avg_confidence": 3.4, "avg_time_sec": 58 },
    "previous_week": { "attempts": 88,  "correct": 60,  "score_pct": 68.2, "avg_confidence": 2.9, "avg_time_sec": 71 }
  },

  "readiness": {
    "exam_readiness_pct":          { "current": 62.5, "previous": 58.1, "delta": 4.4 },
    "global_retention_pct":        { "current": 64.2, "previous": 61.0, "delta": 3.2 },
    "coverage_pct":                { "current": 78.3, "previous": 72.1, "delta": 6.2 },
    "estimated_exam_score":        { "current": 65.0, "previous": 60.0, "delta": 5.0 }
  },

  "velocity": {
    "weekly_pct":              2.2,
    "previous_weekly_pct":     1.4,
    "status":                  "fast",
    "label":                   "Progression rapide",
    "is_sufficient":           true,
    "floor_required":          1.5,
    "projected_at_exam":       72.0,
    "required_to_target":      1.7,
    "on_track_for_exam":       true,
    "schedule_lead_margin_pct": 46
  },

  "topics": [
    {
      "topic_code": "ETH", "topic_name": "Ethics", "weight_pct": 17.5,
      "mastery_pct":   { "current": 65.0, "previous": 53.0, "delta": 12.0 },
      "coverage_pct":  { "current": 75.0, "previous": 60.0, "delta": 15.0 },
      "lm_touched_this_week": ["ETH-01", "ETH-02"],
      "lm_untouched":         ["ETH-04", "ETH-05"],
      "phase_auto":            "consolidation"
    }
  ],

  "lms": [
    {
      "lm_code": "FSA-08", "lm_title": "Long-term Liabilities", "topic_code": "FSA",
      "mastery_pct":  { "current": 42, "previous": 30, "delta": 12 },
      "attempts_this_week": 18, "score_this_week_pct": 75,
      "phase_auto": "consolidation",
      "last_studied_at": "2026-05-04"
    }
  ],

  "weaknesses": {
    "active_total":   8,
    "active_critical": 2,
    "newly_flagged_this_week": [
      { "lm_code": "FI-11", "los_code": "FI-11-LO03", "severity": 4, "weakness_type": "calculation" }
    ],
    "resolved_this_week": [
      { "lm_code": "ETH-02", "los_code": "ETH-02-d", "resolved_at": "2026-05-03" }
    ]
  },

  "plan": {
    "completion_pct":          { "current_week": 82, "previous_week": 64 },
    "completed_blocks":        14,
    "skipped_blocks":          1,
    "pending_today":           2
  },

  "memory_srs": {
    "cards_due_now":           23,
    "cards_reviewed_this_week":  78,
    "fading_count":             12,
    "at_risk_count":             5
  },

  "disputes": {
    "open_count":      0,
    "upheld_this_week":   1,
    "rejected_this_week": 0
  },

  "nba_top3": [
    { "lm": "ETH-02", "los": "ETH-02-d", "priority": "CRITICAL", "urgency_score": 155, "action_text": "..." }
  ],

  "study_pattern": {
    "preferred_hour_block":   "20-22",
    "active_days_distribution": { "Mon": 2, "Tue": 1, "Wed": 1, "Thu": 1, "Fri": 1, "Sat": 1, "Sun": 0 }
  },

  "alerts": {
    "unread_count": 3,
    "by_type":      { "streak_risk": 0, "low_mastery": 2, "review_due": 1 }
  },

  "external_resources": {
    "study_plan_week": {
      "iso_year_week":  "2026-W20",
      "phase_dominant": "consolidation",
      "blocks": [
        { "day": "Mon", "lm_code": "FSA-08", "duration_min": 60, "type": "consolidation" },
        { "day": "Tue", "lm_code": "ETH-04", "duration_min": 45, "type": "discovery" },
        { "day": "Wed", "lm_code": "FI-06",  "duration_min": 50, "type": "mock" }
      ],
      "total_planned_minutes": 540
    },

    "exam_insights": {
      "hot_topics_this_year":     ["FSA-12 (impairment)", "ETH III-B", "FI-06 duration"],
      "common_traps_user_hit":    ["confondre DTA current/non-current", "Standard III-B confidentialité vs criminal acts"],
      "candidate_pace_relative":  "ahead +12% vs cohort moyenne"
    },

    "roi_top_lms": [
      { "lm_code": "FSA-12", "roi_score": 8.7, "reason": "Critical LM, high weight, mastery 38%" },
      { "lm_code": "FI-06",  "roi_score": 7.2, "reason": "Standard difficulty, weight 11%, mastery 42%" },
      { "lm_code": "ETH-04", "roi_score": 6.5, "reason": "Conceptual, weight 17.5%, never touched" }
    ],

    "lm_phases_by_topic": {
      "ETH":  { "discovery": 1, "consolidation": 3, "simulation": 1, "final_sprint": 0 },
      "FSA":  { "discovery": 4, "consolidation": 5, "simulation": 2, "final_sprint": 1 },
      "FI":   { "discovery": 12, "consolidation": 4, "simulation": 1, "final_sprint": 0 }
    }
  }
}
```

### Implémentation prévue

Nouveau service `app/services/weekly_digest.py` qui :
1. Calcule chaque bloc en une requête SQL ciblée (pas une seule mega-query)
2. Réutilise `velocity.compute_velocity()`, `diagnostic_report.classify_lm_phase()`, `roi_scorer`, `NBAService.get_emergency_action()`
3. Sérialise en JSON, envoie à Claude avec le system prompt § 2
4. Persiste la réponse dans `weekly_digests` table (cf. § 3)

Les calculs `current_week / previous_week` se font côté service (groupement ISO week sur `created_at`), Claude ne reçoit que les valeurs déjà comparées.

## 2. Structure du message rendu (email)

### Vue d'ensemble

Format **email long-form**, 9 sections, **600-900 mots** au total. Lisible en 3-4 minutes. Hérite des 6 principes de voix (`coach_communication.md` § 2) — solidaire, chiffré, actionable, vocabulaire positif.

### Sections

| # | Section | Longueur cible | Contenu | Sources JSON |
|---|---|---|---|---|
| **1** | **Subject line** | ≤ 60 chars | Capture le delta principal de la semaine. Ex : "Semaine 19 : readiness +4.4%, velocity dans le green" | `readiness`, `velocity` |
| **2** | **Greeting** | 1 phrase | Personnalisé, ton solidaire. Ex : "Salut Houcem 👋 — bilan de ta semaine 19 (4-10 mai)." | `user.display_name` |
| **3** | **Verdict en 1 ligne** | 1-2 phrases | Le headline narratif chiffré. Diff la métrique la plus signifiante de la semaine. Ex : "Tu as gagné +4.4% de readiness — projection passe de 67% à 72% le jour J. Bon rythme à tenir." | `readiness`, `velocity.projected_at_exam` |
| **4** | **Wins concrets** | 3-4 bullets, ≤ 120 mots | Faits chiffrés positifs. Ex : "+12% sur ETH-02 — Standards III enfin clos · 7 sessions vs 4 la semaine d'avant · Q995 résolu en ta faveur (+5 XP)". Pas de bullet vide. | `topics[].mastery_pct.delta`, `engagement`, `disputes`, `weaknesses.resolved_this_week` |
| **5** | **Points d'attention** | 3-4 bullets, ≤ 180 mots | Chaque point = 1 gap chiffré + 1 next step. Clause Follow the White Rabbit obligatoire. Ex : "FI reste à 30% mastery (cible 55% à 4 sem) → 2 sessions de 45 min cette semaine suffisent". Bannis : "tu n'as pas", "tu devrais". | `topics[].mastery_pct` faibles, `weaknesses.newly_flagged`, `velocity` si insuffisant |
| **6** | **Commentaire & avis du coach** | 1 paragraphe, ≤ 100 mots | Recul interprétatif sur la semaine. Claude prend la parole, pas la donnée brute : pattern observé, alerte d'habitude, ou bravo qualitatif. **1 conseil** explicite pour la suite (méta-conseil, pas opérationnel — ça c'est le Top 3). Ex : "Ce qui me frappe : tu as concentré 70% du temps sur ETH cette semaine, ce qui explique le saut mastery, mais FI s'éloigne en miroir. Mon conseil pour la semaine 20 — alterne ETH/FI tous les 2 jours plutôt que blocs monothématiques, pour éviter que la rétention FI ne décroche." | Synthèse narrative du payload entier — Claude choisit ce qui mérite commentaire |
| **7** | **Plan & conseils stratégiques semaine en cours** | 1 paragraphe d'angle + 3-5 bullets, ≤ 200 mots | **Scope large** — mobilise toutes les ressources externes (`study_plan_week`, `exam_insights`, `roi_top_lms`, `lm_phases_by_topic`) en plus des métriques. Donne l'angle de la semaine (méthode + ratio temps recommandé) avant de dérouler les blocs. Ex : "La semaine entre en phase consolidation dominante (5 LMs FSA mid-mastery). Combiné aux Exam Insights qui flaggent FSA-12 hot, le ratio recommandé est 50% FSA, 25% mocks ETH, 15% FI catch-up, 10% SRS. · Concentre les sessions FSA-12 et FSA-08 en début de semaine (énergie haute) · Mocks ETH thématiques mardi/jeudi pour éviter le blocage Standards III · Blocks FI courts (30 min) en fin de journée pour la rétention sans cramer le focus · SRS daily 10 min en wake-up routine". | `external_resources.*`, `velocity`, `topics[].phase_auto`, `nba_top3` |
| **8** | **Top 3 actions concrètes** | 3 bullets numérotés, ≤ 100 mots | Tactique pure. Hiérarchie nette, combine NBA + plan + ROI. Ex : "1. Drill ETH-02 (clore les 2 derniers LO) · 2. Onboarding FSA-09 (jamais touché, 15% poids) · 3. 2 mocks FI thématiques (rattraper la projection)". | `nba_top3`, `roi_top_lms`, `topics[].lm_untouched`, `plan` |
| **9** | **Projection & cadence** *(closing)* | 2-3 phrases, ≤ 80 mots | **Closing directif et motivant.** Claude est **invité à anticiper et spéculer** au-delà des données brutes. Deux modes mutuellement exclusifs selon la cadence : <br><br>**Mode A — momentum positif** (`velocity.is_sufficient=true` ET `velocity.on_track_for_exam=true`) : extrapolation inspirante. Ex : "Tu n'es plus qu'à 8% de la zone 70%. Si tu tiens cette cadence 5 semaines, tu touches 78% à J−60 et tu peux passer en mode mocks pur le dernier mois — le luxe absolu." <br><br>**Mode B — alerte cadence** (`velocity.is_sufficient=false` OU `on_track_for_exam=false` OU `lead_margin < 10%`) : prévention chiffrée des conséquences. Ex : "Si la cadence reste à +1.4%/sem, projection 64% le jour J — sous le seuil. Une semaine encore en dessous de la velocity floor te coûte ~3% de readiness rattrapable seulement avec 8h supplémentaires en sprint final. Le levier prioritaire ce mois : passer FSA en consolidation finale avant J−60." <br><br>Toujours respecter les 6 principes — mode B reste solidaire (jamais "tu es foutu"), juste lucide sur le coût d'inaction. | `velocity.*`, `readiness.*`, `engagement.streak_*`, `external_resources.*` |

### Règles de rédaction (system prompt à donner à Claude)

À inclure dans le prompt système de l'appel LLM :

> Tu rédiges le digest hebdomadaire de Wingman pour ce candidat CFA L1.
>
> **Format** : email FR (sauf si `user.language='en'`), 600-900 mots, 9 sections dans l'ordre fixé (Subject · Greeting · Verdict · Wins · Attention · Commentaire & avis · Plan stratégique semaine · Top3 actions · Projection & cadence). Markdown léger autorisé.
>
> **Section finale "Projection & cadence"** — tu es explicitement invité à **anticiper et spéculer** au-delà des données. Deux modes : (A) momentum positif → extrapolation inspirante ; (B) alerte cadence → prévention chiffrée des conséquences si la baisse persiste. Choisis le mode selon `velocity.is_sufficient` + `on_track_for_exam`. Reste solidaire et chiffré dans les deux cas.
>
> **Voix** (les 6 principes Wingman) :
> 1. Concis dans chaque section (longueurs cibles ci-dessous).
> 2. Actionable : chaque point d'attention finit par un next step concret chiffré.
> 3. Follow the White Rabbit : aucun gap sans porte de sortie.
> 4. Solidaire jamais accusateur : "voici comment", jamais "tu devrais".
> 5. Quantifie l'écart, pas l'échec : un nombre, pas un verdict.
> 6. Vocabulaire positif : Daily Sharpener, Champion Lap, hero. Bannis dans le corps : *destroy, kill, sniper, "not ready", "critical"*.
>
> **Ton — humain plutôt que technique** :
> - Écris comme un coach qui connaît bien la personne, pas comme un dashboard. Phrases naturelles plutôt que listes sèches quand le sens passe mieux.
> - Ancre les chiffres dans du ressenti et du contexte ("tu sens que ça paie", "ça faisait 3 semaines que ça traînait", "c'est rare et ça mérite d'être noté"). Le chiffre seul est moins parlant que le chiffre + sa signification.
> - Évite le jargon dashboard quand un mot courant suffit : dis "Fixed Income" plutôt que "FI", "tu as gagné 4 points" plutôt que "+4.5% delta readiness".
> - Permet-toi des respirations conversationnelles ("franchement", "petit signal qui m'intéresse", "pas grave, c'est exactement ce que…"). Pas trop, mais ne sois pas raide.
> - Les longueurs cibles autorisent des phrases pleines, pas seulement des bullets — utilise du paragraphe quand le sujet mérite d'être déroulé.
>
> **Hiérarchie de priorité** :
> - Gap le plus chiffré + le plus actionnable d'abord.
> - Topic à fort `weight_pct` × faible `mastery_pct` prioritaire sur topic léger.
> - Si `velocity.is_sufficient=false`, le verdict doit le dire explicitement avec la `required_to_target`.
>
> **Interdits** :
> - Phrases de remplissage ("Cette semaine a été riche en apprentissages…")
> - Stats orphelines sans interprétation
> - Plus de 6 wins ou 6 attention points (force la sélection)
> - Smileys autres que 🎯 🐇 🔥 ✓ (parcimonie)

### Exemple complet (mock)

> **Subject** : Semaine 19 — gros saut, mais un point qui mérite un mot
>
> Salut Houcem ! On est lundi, on fait le point ?
>
> **Le verdict** : franchement, c'était une bonne semaine. Tu as gagné 4 points et demi, ça commence à se voir clairement — au rythme actuel tu touches 73% le jour J, soit 3 points au-dessus du seuil. Tu sens que les heures payent.
>
> **Ce qui m'a plu cette semaine** :
> - Tu as **enfin clos Standards III**, ça faisait trois semaines que ça traînait. Bravo, c'était le morceau le plus inconfortable d'Ethics.
> - 7 jours actifs sur 7. Vraiment 7 sur 7. Ta série monte à 12, tu rentres dans la zone où c'est l'arrêter qui devient mentalement coûteux.
> - Tu as gagné ta dispute sur Q995 — c'est rare et ça mérite d'être noté, ça veut dire que tu lis suffisamment fin pour repérer une question buggée.
> - Ton plan a été fait à presque 90% — quasi tout coché.
>
> **Ce sur quoi je veux qu'on parle** :
> - **Fixed Income s'est éloigné**. Tu n'y as pas touché de la semaine, et la rétention a glissé de 3 points sur ce que tu avais déjà vu. Deux sessions de 45 min cette semaine et c'est rattrapé — pas un sujet, juste à le faire.
> - **Deux questions FI t'ont fait basculer en weakness** (FI-11 sur duration, DER-02). Pas grave, c'est exactement ce que la mécanique est censée capter. Un mini-cours de 10 min sur chacun pendant la semaine et c'est plié.
> - **ETH-04 et ETH-05, jamais ouverts.** Sur 17% du poids de l'examen, c'est une dette qui se cumule en silence. Une session d'onboarding cette semaine et la dette s'arrête.
> - Petit signal qui m'intéresse : **tu doutes en répondant à FI**, même quand tu as juste. Ta confiance moyenne est plus basse que ton score réel — ça veut dire que tu manques d'ancrages conceptuels plutôt que de pratique. Le Concept by Concept avant les drills FI ferait du bien.
>
> **Mon avis sur la semaine** : tu as fait du très bon boulot en concentrant ton énergie sur ETH, et le saut mastery vient de là. Mais en miroir, tout ce qui n'était pas ETH a perdu un peu de terrain. Mon conseil cette semaine : alterne ETH/FI tous les deux jours. Tu garderas le bénéfice du focus sans laisser les autres topics dériver.
>
> **Comment je vois la semaine 20** : tu rentres dans une phase où FSA prend la priorité naturelle — cinq modules FSA sont prêts à être consolidés, et les Insights de l'examen pointent FSA-12 (impairment) comme un sujet chaud cette année. C'est exactement le moment d'y mettre du temps. Le ratio que je te suggère : **environ 45% du temps sur FSA, 25% en mocks ETH, 20% en rattrapage FI, 10% en SRS quotidien**.
> - Garde FSA-12 et FSA-08 pour le début de semaine, là où tu as le plus d'énergie — c'est là que les gains de mastery sont les plus gros.
> - Cale tes mocks ETH mardi et jeudi : ça oblige à réactiver Standards III sans avoir à y "repenser".
> - Tes blocs FI peuvent être courts (30 min en fin de journée) — l'objectif c'est l'entretien, pas l'apprentissage.
> - 10 min de SRS au réveil, tous les jours. C'est le truc le plus rentable que tu peux faire en 10 min.
> - Et bloque-toi vendredi soir ou samedi : le repos volontaire fait partie du plan. Ne le grignote pas.
>
> **Trois choses concrètes à viser cette semaine** :
> 1. **Finir ETH-02** — il te reste deux LO, c'est l'affaire de deux sessions de 30 min et tu passes le module à 80%+.
> 2. **Démarrer FSA-09 lundi** — Reading Summary + LOS Sheet d'abord, puis 5 questions intro. 45 min, et la dette ETH-style ne se reproduit pas sur FSA.
> 3. **Deux mocks FI thématiques** — 25 questions chacun, focus duration + bond valuation. C'est le levier le plus rentable pour remettre FI sur la trajectoire.
>
> Tu n'es plus qu'à **7 points de la zone safe**. Si tu tiens cette cadence cinq semaines, tu touches 73% à J−60 — et là tu peux te permettre de passer le dernier mois en mocks purs, ce qui est le scénario rêvé en CFA L1. Tu y es presque. 🎯

## 3. Déclenchement et persistance

### Table de stockage

```sql
CREATE TABLE weekly_digests (
    id              BIGSERIAL    PRIMARY KEY,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    iso_year_week   VARCHAR(8)   NOT NULL,            -- "2026-W19"
    generated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    payload_json    JSONB        NOT NULL,            -- snapshot du JSON envoyé à Claude
    content_md      TEXT         NOT NULL,            -- markdown rendu (les 7 sections)
    model_used      VARCHAR(60)  NOT NULL,            -- "claude-sonnet-4-6"
    tokens_in       INT,
    tokens_out      INT,
    cost_usd        NUMERIC(8,4),
    seen_at         TIMESTAMPTZ,                      -- quand le user l'a ouvert
    UNIQUE (user_id, iso_year_week)                   -- idempotence
);
CREATE INDEX idx_weekly_digests_user ON weekly_digests (user_id, iso_year_week DESC);
```

→ Stockage **durable** (pas ephemeral). Le user revient consulter ses digests passés via `/digest` (cf. § 5 affichage).
→ `payload_json` archivé pour audit/debug du prompt.
→ `cost_usd` tracké pour respecter `feedback_anthropic_cost_discipline.md` — alarme si > $0.10/digest.

### Logique de déclenchement

```python
async def maybe_generate_weekly_digest(user_id: str, db: AsyncSession) -> Optional[Digest]:
    """Called on /api/auth/session or any first-of-week endpoint hit."""
    iso_week = current_iso_year_week()  # "2026-W19"

    # Idempotent: skip if already generated this week
    existing = await db.execute(text("""
        SELECT id FROM weekly_digests
        WHERE user_id = :uid AND iso_year_week = :week
    """), {"uid": user_id, "week": iso_week})
    if existing.scalar():
        return None

    # Skip if first week of usage (no comparison data)
    if not await has_previous_week_data(user_id, db, iso_week):
        return None

    payload = await build_payload(user_id, db)        # § 1 schema
    response = await claude_generate_digest(payload)   # § 2 system prompt
    return await persist_digest(user_id, iso_week, payload, response, db)
```

Déclencheur : appelé en best-effort depuis `/api/auth/session` (le hit de login). Si le digest existe déjà pour cette semaine → noop.

### Notification au user

Trois canaux combinés quand un digest est fraîchement généré :

1. **Banner sticky en haut de toute page** (clause § 3.9 v4manifest) — couleur `accent-blue`, persiste jusqu'à clic. "📬 Ton bilan de la semaine 19 est prêt — ouvrir."
2. **Item inbox `coach`** — `item_key: "coach:digest:{iso_week}"`, urgent=false, CTA `/digest/{iso_week}`. Permet de retraiter plus tard.
3. **Badge unread sidebar** (existant § 3.10 v4manifest) — incrémenté de 1.

→ Pas d'email externe, pas de push browser MVP — tout in-app.

## 4. Voix

Hérite des **6 principes** de [`coach_communication.md`](coach_communication.md) § 2. Le digest est un message coach long-form, mais reste solidaire, chiffré, actionable.

## 5. Décisions par défaut (verrouillables)

| Question | Décision MVP | Pourquoi |
|---|---|---|
| **Modèle** | `claude-sonnet-4-6` avec system prompt cached | Aligné `feedback_anthropic_cost_discipline.md`. Opus seulement si qualité jugée insuffisante après 4 semaines de mesure. |
| **Heure de génération** | À la première connexion semaine, pas pré-généré | Évite des digests générés pour des users absents toute la semaine (waste). Latence ~3-5s acceptée au login (pas critique). |
| **User absent toute la semaine** | Digest saute (pas d'accumulation) | Un digest qui parle de "la semaine d'avant" est obsolète si on l'envoie 2 semaines après. La semaine N+2 reprendra contre N+1 réelle. |
| **Format d'affichage** | Page dédiée `/digest/{iso_week}` (route + entrée sidebar groupe Diagnostic) | Cohérent avec les routes Wingman (1 fonctionnalité = 1 route, cf. v4manifest § 1). Pas de modal. La page liste aussi les digests passés. |
| **Coût alarmant** | Hard cap à $0.15/digest, log warning si > $0.05 | `tokens_in` plafonné côté payload (truncate listes longues à top 20). |

→ Toutes ces décisions sont défaut MVP. Re-discutables une fois la feature en main et qu'on voit le comportement réel.
