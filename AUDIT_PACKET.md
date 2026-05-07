# Wingman — Audit packet (multi-perspective)

> Document auto-suffisant à partager avec d'autres LLM (GPT-4o, Gemini 2.5 Pro,
> Mistral Large, DeepSeek…) pour cross-checker un audit produit par Claude.
>
> But : compenser les biais d'un seul modèle. Lis, challenge, complète.

**Date de l'audit** : 2026-04-27
**Méthode** : 5 agents Claude en parallèle (sécurité, backend, frontend, content,
infra) explorant le code source. Synthèse manuelle et factuelle ci-dessous.

---

## 0. Comment utiliser ce packet (instructions pour le LLM reviewer)

Tu reçois ci-dessous le résultat d'un audit produit par Claude. Ton job :

1. **Challenge** — sur quels points serais-tu en désaccord ? Pourquoi ?
2. **Complète** — qu'est-ce que Claude semble n'avoir PAS regardé ?
   Quels angles morts probables ?
3. **Re-prioritise** — si tu devais ranger ces problèmes différemment, quelle
   serait ta priorisation et son rationnel ?
4. **Identifie les fixes risqués** — parmi les "quick wins" listés, lesquels
   pourraient introduire des régressions ou nouveaux risques ?
5. **Vérifie la cohérence** — y a-t-il des contradictions entre sections ?

Réponds en français. Format libre, mais sois précis (file:line si possible).

---

## 1. Contexte projet

**Wingman** est une plateforme web de préparation à des certifications
(CFA Level I en première verticale, futur multi-certifs). Stack :

- **Backend** : FastAPI 0.115 + SQLAlchemy 2.0 async + asyncpg + Postgres 16
  (pgvector) + Redis 7 + Anthropic SDK 0.42 + edge-tts + fpdf2.
- **Frontend** : Next.js 14 (App Router) + React 18 + Tailwind 3.4 +
  Chart.js + Vitest. **23 pages** dans `frontend/app/`.
- **Infra** : Docker Compose en local, prod sur VPS via
  `docker-compose.prod.yml` + Traefik (HTTPS), domaine
  `wingman.veridis.shop`.
- **Content engine** : 8+ scripts Python à la racine du backend qui génèrent
  questions, flashcards, audio TTS, PDF — pilotés par Anthropic Sonnet 4.

**État** : MVP en construction, déployé en prod, **pas encore d'utilisateurs
payants** mais l'ouverture est imminente. Builder solo, polyvalent.

**Code volumes (estimation)** :
- Backend : ~5 700 SLOC Python (18 routers, 6+ services)
- Frontend : ~10 000 SLOC TS/TSX, 233 composants
- Content seed : `questions_seed.sql` = 5 259 lignes (~5 200 questions
  pré-générées)

---

## 2. Top findings consolidés (cross-cutting, par criticité)

### 🔴 Critiques

**C1 — Sécurité applicative : `user_id` accepté du client sans validation**
Endpoints comme `/api/plan/generate`, `/api/sessions/checklist`,
`/api/knowledge/...`, `/api/alerts` reçoivent `user_id: str` directement
depuis le body/params. Aucune vérification que c'est l'utilisateur connecté.
Un user authentifié peut donc lire/modifier les données d'un autre.
*Refs* : `backend/app/routers/planning.py:43`, `sessions.py:56,86`,
`knowledge.py:47,54,61`.

**C2 — Clé Anthropic réelle dans des `.env*` locaux + multiples copies dans
`.claude/settings.local.json`**
La clé `sk-ant-api03-…` est en clair dans `.env`, `.env.production`,
`backend/.env`. Gitignored (`.gitignore:1-6` couvre `.env*`, `sk-*`, `sk-ant-*`)
mais **présente sur disque**, donc syncée par OneDrive (le repo est dans
`OneDrive\Apps\`), potentiellement dans des sauvegardes, et copiée plusieurs
fois dans `.claude/settings.local.json` (audit logs Claude Code).
Risque : si un de ces vecteurs fuite, la clé épuise budget Anthropic et
sert à un attaquant.

**C3 — Magic-link auth sans rate limiting + brute-force du code 6 chiffres
possible**
`backend/app/routers/auth.py:188-227` (`/api/auth/send-code`) génère un code
à 6 chiffres (10⁶ combinaisons) sans rate limit ni compteur d'essais.
Un attaquant peut envoyer 1000 tentatives/min sans blocage. Combiné avec
un fallback `?user_id=<target>` query param dans `auth.py:61`, c'est un
trou de sécurité immédiat.

**C4 — `admin_secret_key` default vide**
`backend/app/config.py:26` : `admin_secret_key: str = ""`.
Si la var d'env n'est pas définie en prod, les endpoints `/api/admin/*`
peuvent être appelés avec `key=""` et passer. Le check est là
(`routers/admin.py:22-25`) mais une string vide vs string vide…

### 🟠 Hautes

**H1 — Aucune migration DB formelle**
Alembic est dans `requirements.txt:9` mais **0 fichier Alembic existant**.
Les changements de schéma passent par `db/migrations/00X_*.sql` — 7 fichiers
SQL bruts, pas de versioning, pas de rollback, pas de cohérence garantie
entre prod et local.

**H2 — Backups DB inexistants**
Volume Postgres `pgdata_prod` persisté mais **aucun script de dump
automatique**, aucun cron, aucun S3 sync. Crash VPS = perte totale des
sessions, résultats et progression utilisateur.

**H3 — Tests quasi inexistants**
Backend : 4 fichiers de tests pour 5 700 SLOC (~50 lignes total). Frontend :
9 fichiers de tests sur 233 composants. **Couverture estimée ≤ 5 %**.
Refactor risqué, régressions invisibles.

**H4 — Frontend : 7 / 23 pages non-prêtes pour la prod**
- 🟢 16 pages réelles (UI + logique + data fetching)
- 🟡 5 pages partielles (sessions, memory, data, debrief, planning)
- 🟠 1 stub (nba)
- 🔴 1 morte (journey introuvable)

**H5 — Pas de retry / backoff sur appels Anthropic**
- `routers/ai.py:91-96` capte `APIError` + `Exception` générique → renvoie
  `ChatResponse` vide (`usage={}`).
- `routers/coach_session.py:282-293` capte `BadRequestError` mais pas
  `RateLimitError` ni `APIStatusError`.
- `services/planning_skill.py:568-576` single try-except, **pas de retry
  loop**.

Sous charge, rate-limits et timeouts produisent des réponses nulles silencieuses
au lieu de retry exponentiel.

### 🟡 Moyennes

**M1 — Drift `NEXT_PUBLIC_API_URL` local ↔ prod**
`docker-compose.yml:74` hardcode `http://localhost:8000` en build-arg du
frontend (alors que le Dockerfile utilisé est `Dockerfile.prod` !). Si
quelqu'un lance prod sans override explicite, le frontend bake l'URL locale
dans le bundle JS → API unreachable.

**M2 — Frontend : 100 % `'use client'`, pas de RSC/SSR**
Toutes les 21 pages réelles déclarent `'use client'`. Pas de Server
Components, pas de streaming, pas de fetch côté serveur. Conséquences :
- SEO mort sur landing/pricing
- Hydration overhead sur chaque page
- Perf mobile dégradée

**M3 — Anthropic clients instanciés à chaque requête**
`routers/ai.py:78`, `coach_session.py:273`, `services/planning_skill.py:453`
créent un nouveau `anthropic.Anthropic()` par appel. Pas de réutilisation,
overhead inutile.

**M4 — Modèles Anthropic versions hardcodées et obsolètes**
- `generate_all_assets.py`, `generate_questions_ai.py`, `generate_qm_lm01.py`
  → `claude-sonnet-4-20250514`
- `generate_lm_questions.py` → `claude-sonnet-4-6` (ancienne nomenclature)

À 14+ mois après release initiale (avril 2026), risque de retrait par
Anthropic = breaking change. Aucun script ne lit le model d'une config.

**M5 — Healthcheck frontend prod cassé**
`docker-compose.prod.yml:89` : `wget -q --spider http://0.0.0.0:3000`.
`0.0.0.0` est invalide pour client → le healthcheck **fail systématiquement**
→ container restart en boucle silencieux.

**M6 — Logique métier dispersée entre routers et services**
Beaucoup de raw SQL `text()` directement dans les routers
(`planning.py:53-60`, `knowledge.py:69-78`, `content.py:69-80`). Pas de
modèles ORM SQLAlchemy déclarés → zéro type safety sur résultats DB.

**M7 — `wingman_fallback.db` orpheline (0 bytes)**
SQLite vide dans `backend/`, activé seulement si `WINGMAN_NO_DB=1`. Code mort.

**M8 — Code pipelines fragmenté**
8 scripts de génération à la racine du backend, sans module commun. Doublons
de logique JSON repair, retry, prompt construction. Seul
`generate_lm_questions.py` utilise Anthropic prompt caching — les 4 autres
gaspillent en cache miss.

**M9 — `start.bat` ne fail pas si Postgres/Redis absents**
`start.bat` check `pg_isready` & `redis-cli` mais continue même si KO.
Démarre des process zombies.

**M10 — Pas de centralisation fetch côté frontend**
Chaque page redéfinit `const API = process.env.NEXT_PUBLIC_API_URL || '...'`,
manual fetch / try-catch / setState. Aucun `lib/api-client.ts` ni hook
`useApi()` réutilisable. Duplication massive, retry impossible.

---

## 3. Détails par axe d'audit

### 3.A — Sécurité & Auth

**État réel constaté** :
- `AUTH_DISABLED=false` en prod (`docker-compose.prod.yml:44`) → auth
  **activée** sur le papier.
- `AUTH_DISABLED=true` en local dev (`docker-compose.yml:44`,
  `backend/.env:2`) → bypass complet en dev.
- Squelette JWT existe (HS256 + `secret_key` config).
- Auth via **email magic links + Google OAuth** (pas de password local).
- Pas de password hashing (cohérent avec magic links).

**Trous critiques** : C1, C3, C4 ci-dessus + le fallback `?user_id=` query
param dans `auth.py:61` qui bypass tout.

**Quick wins (< 30 min chaque)** :
1. Retirer la valeur réelle des `.env*` files, mettre placeholder + injection
   runtime via Docker secrets ou `.env.local` machine-only.
2. Validation au startup (`main.py`) : `if AUTH_DISABLED in prod → raise`,
   `if SECRET_KEY == "change-me-in-production" → raise`,
   `if not ADMIN_SECRET_KEY → raise`.
3. Remplacer tous les `user_id` du body/params par
   `request.state.user_id` injecté par le middleware auth.
4. SlowAPI rate-limit `5/minute` sur `/api/auth/send-code` + compteur
   d'essais sur `/api/auth/verify-code`.
5. Supprimer le fallback `?user_id=` query param dans `auth.py:61`.

### 3.B — Backend architecture

**Forces** :
- Bootstrap propre (`main.py:16-55`) : 18 routers, middleware ordonné
  (CORS → Auth → Logging → Security), lifespan correct.
- Async/SQLAlchemy 2.0 conforme (`database.py:18-24`), pool sizing adapté.
- Séparation routers ↔ services pour les morceaux clés (planning_skill,
  mastery, srs, velocity, roi_scorer).
- Pydantic v2 + `response_model` quand présent.
- Redis async + fallback graceful sur Claude timeout
  (`planning_skill.py:488-495, 569-576`).

**Problèmes structurels** :
- Pas d'Alembic (H1 ci-dessus).
- Bare except + retry absent sur Anthropic (H5).
- Raw SQL omniprésent dans routers, pas de modèles ORM.
- `response_model` + `status_code` manquants sur ~half des endpoints.
- Pas de transaction wrapper — chaque endpoint commit manuellement.
- Sessions Redis health-check synchrone dans handler async (`main.py:119-123`).
- 9 / 18 routers exposent `text()` raw directement.

**Score estimé** :

| Axe | /10 | Notes |
|-----|----|-------|
| Structure | 8 | Bootstrap solide, sépare claire, manque ORM + Alembic |
| Async | 9 | Bien, sauf 1 health-check blocking |
| Error handling Anthropic | 5 | Bare except, pas de retry/backoff |
| Tests | 3 | ~50 lignes pour 5 700 SLOC |
| Migrations DB | 2 | Alembic en deps mais 0 utilisation |

### 3.C — Frontend (vérité des 23 pages)

| Page | Statut | Lignes ~ | Note |
|---|---|---|---|
| landing | 🟢 | 135 | Hero + pricing CTAs, prête |
| login | 🟢 | 284 | OTP + Google OAuth complet |
| pricing | 🟢 | 155 | 3 plans + FAQ |
| auth/callback | 🟢 | 46 | Token callback OK |
| admin/users | 🟢 | 236 | CRUD + admin key auth |
| onboarding | 🟢 | 614 | Multi-step + localStorage |
| study-plan | 🟢 | 308 | Gantt + week navigator |
| smart-planner | 🟢 | 468 | Sessions matin/aprem/soir |
| library | 🟢 | 1110 | 93 LMs + asset gen |
| session | 🟢 | 455 | QCM + flashcards + coach |
| sessions | 🟡 | 502 | UI manque pour certains modes |
| results | 🟢 | 367 | 4 onglets dashboard |
| challenges | 🟢 | 435 | Gamification badges |
| memory | 🟡 | 370 | Fetch souvent vide |
| readiness | 🟢 | 230 | Gauges + blockers |
| exam-intel | 🟢 | 1056 | Priority matrix complete |
| nba | 🟠 | 154 | Stub, composants NBA_* orphelins |
| data | 🟡 | 2187 | UI OK, logique backend mêlée |
| debrief | 🟡 | 298 | Fetch mocking, KPI faibles |
| planning | 🟡 | 372 | Eisenhower partial |
| settings | 🟢 | 145 | Profile + danger zone |
| journey | 🔴 | 0 | Introuvable / dead |
| weaknesses | 🟢 | 333 | Retention buckets OK |

**Reco trim immédiate** :
- Garder en core : landing, login, session, sessions, study-plan, library,
  results+readiness fusionnés.
- Feature-flag : exam-intel, challenges, memory, planning.
- Réécrire ou geler : nba, data (split UI/admin), debrief.
- Supprimer : journey (mort), settings/billing si paiement absent.

### 3.D — Content engine (pipelines de génération)

**Carte** :
- `generate_all_assets.py` orchestre 17 assets/module (PDFs, JSON, SVG, MD)
  via Sonnet 4 + fpdf2 + graphviz. Output : `backend/generated_content/`.
- `generate_questions_ai.py` génère ~200 Q/module (qbank+mock), insère DB
  via asyncpg, retry sur RateLimit.
- `generate_lm_questions.py` utilise **Tools API + prompt caching**
  (le seul, ironique). Schema validé via tool input.
- `generate_qbank.py` utilise **Groq Llama 3.3 70B** (pas Anthropic) —
  fragmentation.
- `generate_qm_lm01.py` 16 assets hardcoded pour QM.
- `generate_audio.py` edge-tts FR (`fr-FR-HenriNeural`), 3 retries async.
- `seed_performance.py` données démo aléatoires (pas Anthropic).
- `extract_cfa_los.py` **introuvable** (référencé dans la doc mais absent).
- `questions_seed.sql` 5 259 lignes pré-générées.

**Problèmes** :
- Versions Anthropic obsolètes hardcodées (M4).
- Prompt caching dans 1 script sur 5 (gaspillage tokens).
- `generate_all_assets.py` overgenerates : pas de skip-if-exists, écrase.
- Pas de validation Pydantic sur réponses JSON Anthropic → questions
  malformées peuvent atteindre la DB.
- `extract_cfa_los.py` manquant.
- `generate_all_assets.py:21` importe `from app.routers.content` →
  couplage tight script/runtime.

**Reco** :
- Court terme : `backend/services/claude_pipeline.py` avec
  `_call_claude_cached()` + Pydantic models.
- Moyen terme : orchestrateur unique CLI `python orchestrate.py …`.

### 3.E — Infra & déploiement

**Drift local ↔ prod** :

| Aspect | Local | Prod |
|---|---|---|
| Restart policy | `unless-stopped` | `always` |
| Network | `default` + `proxy-net` | `wingman-internal` + `proxy-net` |
| Backend Dockerfile | `Dockerfile` (uvicorn --reload) | `Dockerfile.prod` (gunicorn 4w) |
| Frontend Dockerfile | (utilise déjà `.prod`!) | `Dockerfile.prod` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` (build-arg!) | `https://wingman.veridis.shop` |
| `AUTH_DISABLED` | `"true"` | `"false"` |
| Volumes | `pgdata`, `assets` | `pgdata_prod`, `assets_prod`, `wingman_logs` |
| Ports exposés | 5432/6379/8000/3000 | aucun (Traefik only) |

**Risques opérationnels** :
- **Critique** : pas de backup DB (perte totale si crash VPS).
- **Critique** : drift `NEXT_PUBLIC_API_URL` (bake l'URL locale en bundle prod
  si script de deploy mal fait).
- **Haute** : healthcheck frontend prod cassé (`0.0.0.0` invalide).
- **Haute** : aucune observabilité (pas de Sentry, Loki, Prometheus).
- **Haute** : `wingman_logs` volume monté mais aucun redirect stdout vers
  fichier → volume vide.
- **Moyen** : tags d'images Docker non pinnés (`python:3.12-slim`,
  `node:20-alpine` peuvent dériver).
- **Moyen** : Traefik labels OK mais pas de rate limit, pas de CORS explicite.

**Quick wins infra (< 1 h chaque)** :
1. Fix healthcheck frontend prod : `0.0.0.0` → `localhost`.
2. Pin tags Docker (`python:3.12.1-slim`, `node:20.11-alpine`).
3. Remplacer Python urllib healthcheck backend par `curl -f`.
4. Sortir `NEXT_PUBLIC_API_URL` du build-arg de `docker-compose.yml`,
   mettre dans `.env.local` machine-only.
5. Script `pg_dump` cron-able vers volume monté + sync hebdomadaire S3/B2.

---

## 4. Quick wins consolidés (< 30 min chacun)

Par ordre de ratio impact/effort :

1. **Retirer la clé Anthropic réelle** des `.env*` + `.claude/settings.local.json`
   et la rotater. (5 min + 5 min de console Anthropic)
2. **Fix healthcheck frontend prod** (`docker-compose.prod.yml:89`).
3. **Validation startup** (`main.py`) : refuser AUTH_DISABLED en prod,
   refuser secret_key par défaut, refuser admin_secret_key vide.
4. **Supprimer le fallback `?user_id=`** dans `auth.py:61`.
5. **Rate limit SlowAPI** sur `/api/auth/send-code` + `/api/auth/verify-code`.
6. **Supprimer `wingman_fallback.db`** (0 bytes, code mort).
7. **`response_model` + `status_code`** sur tous les routers
   (5 min, doc OpenAPI propre).
8. **Pin tags Docker images** (3 fichiers Dockerfile).

## 5. Travaux moyens (½ journée à 2 jours)

- **Auth user-scoped** : remplacer tous les `user_id` du client par
  `request.state.user_id`. ~15-20 endpoints à toucher.
- **Alembic init** + conversion des 7 migrations SQL existantes en versions
  Alembic.
- **Backup DB cron** + retention 14 jours + sync vers cloud chiffré.
- **Centralisation Anthropic** : `app/services/anthropic_client.py` singleton
  + retry exponential + handling rate-limit.
- **Centralisation fetch frontend** : `lib/api-client.ts` + hooks
  `useApi`, `useFetch`, `useLocalStorage` réutilisables.
- **Trim frontend** : feature-flag (off) pour `nba`, `journey`, `debrief`,
  `planning`, `memory` jusqu'à ce qu'ils soient finis.

## 6. Travaux structurants (1+ semaine)

- **Test coverage** : viser 50 % sur services backend critiques (auth,
  planning, content) + 30 % sur composants frontend critiques
  (session, login, onboarding).
- **Refactor pipelines content** en `services/claude_pipeline.py`
  unifié, Pydantic schemas, prompt caching partout.
- **RSC migration** sur landing + pricing + auth/callback (SEO + perf).
- **Observability** : Sentry (errors) + Prometheus + Grafana.

---

## 7. Questions explicites pour le LLM reviewer

1. **Sur la priorisation** : si tu devais conseiller le builder solo de
   wingman, mettrais-tu l'auth user-scoped (C1) ou le backup DB (H2) en
   priorité absolue ? Et pourquoi ?
2. **Risques de fix** : parmi les "quick wins" listés, lequel a le plus
   de chances de **casser quelque chose** sans qu'on s'en aperçoive ?
3. **Angle mort probable** : qu'est-ce que les 5 audits ci-dessus ont
   manqué ? Pense aux dimensions souvent oubliées (perf, accessibilité,
   licences/conformité, gestion du temps réel/SSE, edge cases mobile,
   conformité RGPD vu que c'est un produit destiné à des utilisateurs EU).
4. **Sur la matrice frontend** : 16/23 pages "réelles" — est-ce crédible
   pour un MVP solo, ou suspectes-tu un biais (Claude pourrait sur-estimer
   parce qu'il voit du code sans pouvoir le tester runtime) ?
5. **Sur le content engine** : l'utilisation de Groq dans
   `generate_qbank.py` à côté de Sonnet 4 partout ailleurs, est-ce un
   choix justifiable (coût ? variété ?) ou une dette technique ?
6. **Stratégie globale** : le builder solo doit-il continuer à ajouter du
   contenu produit, ou stopper net pendant 2 semaines pour durcir le
   socle (auth + backup + tests) ? Donne ton avis tranché.

---

## 8. Liste des fichiers critiques (pour référence du reviewer)

```
backend/
  app/
    main.py                       # bootstrap, démo seed, health checks
    config.py                     # secrets defaults dangereux (l.15, 26)
    database.py                   # async engine + fallback SQLite (l.6-12)
    routers/
      auth.py                     # magic link, fallback ?user_id (l.61)
      planning.py                 # accepte user_id du body (l.43)
      sessions.py                 # idem (l.56, 86)
      knowledge.py                # idem (l.47, 54, 61) + raw SQL
      ai.py                       # client Anthropic à chaque request
      coach_session.py            # error handling partial
      admin.py                    # admin_secret_key check
    services/
      planning_skill.py           # Redis fallback silent (l.488-495)
  generate_all_assets.py          # orchestrateur content (Sonnet 4)
  generate_questions_ai.py        # 200 Q/module via asyncpg
  generate_lm_questions.py        # Tools API + prompt caching (seul!)
  generate_qbank.py               # Groq Llama 3.3 (fragmentation)
  questions_seed.sql              # 5259 lignes pré-générées
  wingman_fallback.db             # 0 bytes orphelin
  tests/                          # 4 fichiers, ~50 lignes total
frontend/
  app/
    nba/page.tsx                  # stub
    journey/                      # introuvable
    sessions/page.tsx:382         # @ts-expect-error CSS prop
    library/page.tsx              # 1110 lignes monolithiques
    data/page.tsx                 # 2187 lignes admin/UI mêlés
  components/                     # 233 fichiers, pas de barrel exports
  lib/auth.tsx                    # useAuth() localStorage
docker-compose.yml                # AUTH_DISABLED=true (dev), build-arg API URL
docker-compose.prod.yml           # AUTH_DISABLED=false, healthcheck cassé l.89
.env / .env.production            # clé Anthropic réelle (gitignored mais sur disque)
.gitignore                        # protège .env*, sk-*, sk-ant-*
```

---

**Fin du packet.** Le reviewer (toi, autre LLM) peut maintenant challenger
section par section, ou répondre directement aux questions du § 7.
