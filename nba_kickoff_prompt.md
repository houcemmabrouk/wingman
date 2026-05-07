# Prompt — Démarrer la refonte Next Best Action

> Copie-colle ce bloc dans une nouvelle discussion Claude Code à la racine de `wingman-vps`. Tout le contexte y est.

---

Salut. Je veux refondre la page **`/nba`** (Next Best Action) de Wingman.

## Contexte du projet

Wingman = plateforme de prep CFA Level I. Stack : FastAPI + SQLAlchemy async + Postgres 16 + Redis + Anthropic SDK 0.42 + Next.js 14. Code à `C:/Users/houce.000/OneDrive/Apps/wingman-vps`. Prod sur :3003 (image `wingman-vps-frontend:variant-v3-2026-05-05d`), backend hot-reload sur :8000.

CLAUDE.md à la racine couvre la stack et les conventions. Auth disabled en dev (donc tous les requests deviennent demo user).

## La spec à respecter

**Lis d'abord** `next_best_action.md` à la racine — tout le design, les principes (clause Follow the White Rabbit, credo Never Surrender, hiérarchie fonctionnelle 4 étapes, anti-pattern bâton brutal) y est figé. Ne re-discute pas ces décisions sauf si tu vois une incohérence.

**Mock HTML retenu** : `wireframes/nba_v3.html` (servi sur `frontend/public/wireframes/nba_v3.html` à `/wireframes/nba_v3.html`). C'est la cible visuelle. 3 tabs en haut : 📬 Inbox · 💬 Chat · 📊 Instant Report.

## Ce qui est déjà construit (à réutiliser, pas à refaire)

- `backend/app/services/diagnostic_report.py` — auto-classification phase par LM + Instant Report Sonnet 4.6 cached. Endpoints `POST /api/v1/diagnostic/auto` et `/api/v1/diagnostic/{phase}` opérationnels.
- `backend/app/services/question_calc_verifier.py` + `question_calc_corrector.py` — pipeline calc avec [CONTESTED] marker.
- `backend/app/services/question_python_audit.py` — audit gratuit (pas LLM).
- `backend/app/services/dispute_arbiter.py` + table `question_disputes` + endpoint `/api/v1/questions/{id}/dispute`.
- `backend/app/services/nba_service.py` — scorer NBA legacy (à plugger).
- `backend/app/services/roi_scorer.py` — ROI par LM.
- `backend/app/services/planning_skill.py` — 14 règles de planification (lignes 22-66). Source unique pour le séquencement pédagogique.
- `backend/app/services/weakness_detector.py` + table `weakness_log`.
- Frontend déjà cablé : `/sessions?mode=weaknesses|focus_lm|full_topic` (réutiliser ces routes pour les CTA).

## Ce qu'il reste à construire

### Backend (~1h30)

1. **`GET /api/v1/inbox`** — agrège dans une seule réponse :
   - Actions NBA (top 6 slots A-F : Daily Sharpener, Marco Polo Challenge, Champion Lap, Walkman Mode, Never Surrender weakness, Superman Challenge — voir doc § 6 pour la logique de scoring)
   - Alerts (streak en risque, nouvelle weakness, etc.)
   - Disputes récentes (status d'arbitrage)
   - Coach messages non lus
   Chaque item a `id`, `category`, `title`, `snippet`, `cta_label`, `cta_url`, `time`, `unread`, `urgent`.

2. **`POST /api/v1/coach/message`** — endpoint chat. Input : message user + historique session. Output : réponse Sonnet 4.6 (cached system prompt). System prompt doit incarner le coach Wingman avec ton positif, GPS-aware, propose mini-actions, respecte la clause Follow the White Rabbit.

3. **`POST /api/v1/inbox/{id}/mark-read`** — marquer un item comme lu. Storage minimal : nouvelle table `inbox_state` (user_id, item_id, read_at) ou réutiliser un mécanisme existant.

### Frontend (~2h)

`frontend/app/nba/page.tsx` refonte complète :
- Header avec page title + GPS chip condensé (Schedule + Velocity + Streak depuis `/api/diagnostic`)
- 3 tabs : 📬 Inbox · 💬 Chat · 📊 Instant Report
- Tab Inbox : liste filtrable (chips All / Actions / Alerts / Disputes / Coach) + sidebar Never Surrender 3 tiers
- Tab Chat : thread avec coach + quick replies + input
- Tab Instant Report : bouton régénérer + render markdown du `/api/v1/diagnostic/auto`

Code TS strict (pas de `any`). Tailwind. Réutiliser `lib/wingmanApi.ts` pour les fetch (pas de fetch direct).

## Contraintes (rappels)

- **Cost discipline** : Sonnet 4.6 par défaut, jamais Opus en batch. Estimer avant tout loop > 10. Cf. mémoire `feedback_anthropic_cost_discipline.md`.
- **Anti-zombie** : `TaskStop` ne tue pas le process Python à l'intérieur du container docker exec. Vérifier après chaque stop avec `docker exec wingman-backend sh -c "for f in /proc/[0-9]*/cmdline; do cmd=\$(tr '\\0' ' ' < \$f); [ -n \"\$cmd\" ] && echo \"\$f: \$cmd\"; done" | grep <pattern>` puis kill manuellement.
- **Calc verifier pattern** : pour toute génération impliquant arithmétique, utiliser `question_calc_verifier.safe_eval` + corrector. Ne jamais faire confiance au LLM sur les chiffres.
- **14 règles de planification** : pointer toujours vers `planning_skill.py:22-66` plutôt que recopier.
- **Ton** : positif, Follow the White Rabbit (aucune mauvaise nouvelle sans porte de sortie), pas de "destroy/critical/not ready".

## Ordre d'exécution proposé

1. Lis `next_best_action.md` + ouvre `wireframes/nba_v3.html` dans le browser pour voir la cible.
2. Construis le backend (3 endpoints) avec mocks intelligents pour `/api/v1/inbox` (peut hardcoder partiellement pour valider l'UI).
3. Frontend `/nba/page.tsx` qui consomme les 3 endpoints.
4. Test E2E sur le dev preview (port 3004 si actif, sinon `npm run dev` dans frontend).
5. Rebuild prod via `cd frontend && npm run sync-lms && docker compose build frontend && docker tag wingman-vps-frontend:latest wingman-vps-frontend:variant-v3-YYYY-MM-DDx && docker stop wingman-frontend-v3 && docker rm wingman-frontend-v3 && docker run -d --name wingman-frontend-v3 -p 3003:3000 -e BACKEND_INTERNAL_URL=http://wingman-backend:8000 --restart unless-stopped wingman-vps-frontend:variant-v3-YYYY-MM-DDx && docker network connect wingman-vps_default wingman-frontend-v3`.

## Première chose à faire

Lis `next_best_action.md` et `wireframes/nba_v3.html`, puis dis-moi ce que tu en comprends et par où tu commences. Pas de code avant que je valide ton plan.
