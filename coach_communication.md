# Coach Communication — Spec

> Spec dédiée aux messages du Coach IA Wingman : ton, déclencheurs, format,
> intégration avec l'Inbox NBA. Référencé depuis [`v4manifest.md`](v4manifest.md) § 4.

Date : 2026-05-06

---

## 0. Existant à connaître avant tout choix

- **Channel réactif** : `POST /api/coach/session` (Sonnet 4.6 cached, multi-turn). System prompt actuel = "design the next study session, ask one targeted question if vague, emit propose_session tool when ready". Ton anglais, max 2 phrases par réponse.
- **Channel inbox** : `GET /api/v1/inbox` agrège 5 sources (actions, alerts, disputes, plan, SRS). La 6ᵉ source `coach proactive` est **prête côté schéma** mais pas branchée en MVP — c'est ce qu'on spec ici.
- **Cost discipline** (mémoire utilisateur) : Sonnet 4.6 default, jamais Opus en batch, valider sample 3-5 avant tout loop > 10.

Ces faits cadrent le scope ; on ne les rediscute pas sauf incohérence.

## 1. Périmètre — ce que ce doc couvre

| Canal | Endpoint | Couvert ici ? |
|---|---|---|
| **Chat (réactif)** | `POST /api/coach/session` | ✓ Ton + principes — on alignera le system prompt existant après validation. |
| **Proactif (inbox)** | nouvelle source `coach` dans `inbox_aggregator` | ✓ Ton + déclencheurs + format. |
| **Mini-cours (weakness)** | `POST /api/v1/weakness/mini-course` (pas encore construit) | ✗ Hors scope — reporté MVP. À ajouter à ce doc quand on construira. |
| **Debrief / explanations questions** | autre pipeline (génération QBank) | ✗ Hors scope — voix de la question, pas du coach. |

→ **Voix unifiée** entre chat et inbox proactif. Un message coach reconnaissable d'où qu'il vienne.

## 2. Ton — 6 principes non négociables

| # | Principe | Application concrète |
|---|---|---|
| 1 | **Concis — 2 phrases max** | Sauf si l'utilisateur demande explicitement plus de détail. Pas de paragraphes. |
| 2 | **Actionable** | Chaque message se termine par un next step concret (CTA chiffré) ou une question ciblée si info manque. |
| 3 | **Follow the White Rabbit** | Jamais de mauvaise nouvelle sans porte de sortie. "+6h/sem manquantes pour 70%" ✓ ; "tu n'es pas prêt" ✕. |
| 4 | **Solidaire, pas accusateur** | "voici comment rattraper", "on fait X". Jamais "tu devrais", "il faut", "tu n'as pas". |
| 5 | **Quantifier l'écart, pas l'échec** | Un nombre concret est actionnable, un verdict ne l'est pas. |
| 6 | **Vocabulaire positif** | Daily Sharpener, Champion Lap, hero, Never Surrender. Bannis dans le corps : *destroy, kill, sniper, "not ready", "critical"* (le badge UI suffit pour signaler la criticité). |

→ Ces 6 principes s'appliquent identiquement au chat (`/api/coach/session`) et aux messages proactifs en inbox. Voix unifiée.

→ Langue : **français par défaut** (CLAUDE.md FR-first), basculement EN si `user_profiles.language = 'en'`. Activity names restent en anglais (Reading Summary, LOS Sheet, etc.) car mappent sur les filenames assets.

## 3. Application au chat existant — alignement du system prompt

Réalisé 2026-05-06 dans `backend/app/routers/coach_session.py:24-66` :
- Section "Voix du coach" insérée listant les 6 principes en FR.
- Rule 10 reformulée : "harsh tone" retiré, remplacé par "push velocity, jamais de ton accusateur, quantifie l'écart".
- "How to interact" allégée et alignée sur les 6 principes.

Test empirique validé sur `POST /api/coach/session` (FR, 90 min, behind schedule) → réponse 1 phrase solidaire avec plan FSA-04 chiffré, pas de verdict d'échec.

## 4. Cadence minimale des messages proactifs (à valider)

Pour que le coach **existe** réellement et ne soit pas un panel mort, plancher proposé :

| Slot | Fréquence min | Contenu | Source de déclenchement |
|---|---|---|---|
| **Daily check-in** | 1× par jour actif | "Aujourd'hui : 30 min sur X — on y va ?" | Cron quotidien matin (heure locale user) |
| **Streak guard** | 1× si `last_session_at > 24h` ET streak ≥ 3 | "36h sans session — 15 min protègent ta série de N jours" | Trigger sur dépassement délai |
| **Win recognition** | 1× après mastery delta ≥ +10% sur un LM | "Bon job sur ETH-02 — mastery 65 → 78%" | Hook post-session |
| **Weakness fresh** | 1× si nouvelle weakness flaggée < 4h | "ETH-02-d : 3 erreurs consécutives — mini-cours dispo" | Hook post-attempt |
| **Schedule drift** | 1× hebdo si lead margin < 10% | "Tu glisses : +3h/sem cette semaine pour rester sur le rythme 70%" | Cron hebdomadaire |

→ **Plancher absolu** : **1 message minimum par jour actif** (le daily check-in). En dessous, le coach disparaît.

→ **Plafond raisonnable** : 3-4 messages/jour. Au-delà, on devient du spam. Les 5 slots ci-dessus se déclenchent rarement ensemble.

→ **Pas de LLM dans la génération de ces messages** : règles deterministes côté serveur (templates avec données réelles injectées). Le LLM reste réservé au chat réactif.

**Validé** — 5 slots, plancher 1/jour, plafond 3-4/jour, génération deterministe.

## 5. Templates des messages proactifs

Chaque slot rend un `InboxItem` avec catégorie `coach`. Variables `{snake_case}` substituées côté serveur depuis la donnée réelle.

| Slot | item_key | Title (≤ 60 chars) | Preview (≤ 140 chars) | CTA url | Urgent |
|---|---|---|---|---|---|
| Daily check-in | `coach:daily:{YYYY-MM-DD}` | `Plan du jour : {minutes} min sur {lm_code}` | `On attaque par {lm_title} ?` | `/sessions?mode=full_topic&module={lm_code}` | non |
| Streak guard | `coach:streak_guard:{YYYY-MM-DD}` | `Ta série de {streak_days} jours est en jeu` | `{hours_since}h sans session — 15 min suffisent à la sauver.` | `/sessions?mode=audio` | **oui** |
| Win recognition | `coach:win:{lm_code}:{YYYY-MM-DD}` | `Bon job sur {lm_code} — mastery {prev}% → {now}%` | `Tu peux enchaîner sur {next_lm_code} pour capitaliser.` | `/sessions?mode=full_topic&module={next_lm_code}` | non |
| Weakness fresh | (couvert par alerts source — pas de doublon) | — | — | — | — |
| Schedule drift | `coach:drift:{YYYY-WW}` | `Tu glisses : +{gap}h/sem pour rester aligné` | `{current_velocity}%/sem actuel, cible {required_velocity}%/sem.` | `/smart-planner` | non |

→ Tous les templates respectent les 6 principes : 2 phrases max, actionable, porte de sortie, solidaire, chiffré, positif.

→ Premier cut implémenté : **daily check-in** + **streak guard** dans `inbox_aggregator._coach_items()`. Les 3 autres slots sont ajoutés au fil de l'eau.

## 6. Exception future — Weekly Digest LLM

> Hors scope MVP, à construire plus tard.

Un message hebdomadaire généré par Claude (un appel LLM par user × semaine), délivré à la **première connexion en semaine**. Compare la semaine en cours à la précédente, sous forme d'un mail élaboré.

→ C'est l'**exception** à la règle "pas de LLM dans /inbox" (§ 4). Justifié par fréquence basse + valeur élevée du diff comparatif.

→ Spec dédiée : [`claude_weekly_digest.md`](claude_weekly_digest.md) — informations envoyées + structure du mail.
