# Wingman

> Plateforme adaptative de préparation à des certifications. CFA Level I est la
> première verticale ; le moteur (LOS, questions, weaknesses, NBA, planner) est
> conçu pour être réutilisable sur d'autres certifs.

---

## Politique produit (mise à jour 2026-05-05)

**Priorité absolue : installation auth propre.** Toutes les autres tâches
sont reportées tant que les trous critiques d'auth (C1, C3, C4 dans
AUDIT_PACKET.md § 2) ne sont pas résolus. L'auth conditionne l'ouverture aux
utilisateurs, le paiement, et la fiabilité du modèle de données user-scoped.

> Note : la règle "3-pour-1" qui interdisait tout ajout de feature sans en
> remplacer trois a été retirée le 2026-05-05 — elle s'est avérée contre-
> productive (bloquait des consolidations utiles et incrémentait le coût
> cognitif de chaque petite décision). On reste sur la priorité auth +
> consolidation des surfaces fragmentées, mais sans veto chiffré.

---

## Axes de développement

Wingman se construit autour de **3 piliers**. Toute fonctionnalité s'inscrit
dans l'un d'eux, sinon on repose la question avant d'ajouter.

1. **Content engine** — générer et qualifier le contenu pédagogique (LOS,
   questions, debriefs, audio, PDF) avec assistance Anthropic.
2. **Adaptive engine** — recommander la prochaine action (NBA), détecter les
   faiblesses, planifier la révision (smart-planner, journey).
3. **Plateforme** — auth, paiement, onboarding, infra, ce qui rend l'outil
   utilisable par quelqu'un d'autre que le builder.

### Hors scope (pour l'instant)

- Multi-langue (FR-only pour l'instant)
- Apps mobiles natives (web responsive suffit)
- Live tutoring / sessions humaines
- Marketplace de contenu tiers

---

## 1. Vision

### Public cible
Candidats à des certifs longues et denses (CFA L1 d'abord). Le pari : la plupart
des candidats sous-performent parce qu'ils étudient mal (pas la quantité, le
ciblage). Wingman concentre l'effort là où ça paye : LOS faibles, questions
adaptatives, debriefs structurés.

### Promesse fonctionnelle
1. Tu vois en temps réel **où tu es**, **où tu vas**, et **quoi étudier maintenant**.
2. Le contenu (questions, explications) est de **qualité examen**, pas du remplissage.
3. La plateforme **se trompe à ta place** sur le « par quoi commencer ? ».

---

## 2. État du projet

**MVP en construction.** Le code est riche (23 pages frontend, 6 modules backend),
mais l'usage réel est encore limité.

### Priorité critique #1 — Auth (vérités factuelles après audit)
- `AUTH_DISABLED=true` en **dev** (`docker-compose.yml:44`, `backend/.env:2`)
- `AUTH_DISABLED=false` en **prod** (`docker-compose.prod.yml:44`) → auth
  **activée** sur le papier
- **Mais l'implémentation a des trous critiques** :
  - `user_id` accepté du client (body/params) sans validation contre
    `request.state.user_id` du middleware → un user peut lire/modifier les
    données d'un autre
  - Magic-link `/api/auth/send-code` sans rate limit, code 6 chiffres
    brute-forçable
  - Fallback `?user_id=<target>` dans `auth.py:61` qui bypass tout
  - `admin_secret_key` default vide (`config.py:26`)

Voir `AUDIT_PACKET.md` § 2 (C1, C3, C4) et § 3.A pour les fixes proposés.

### Ce qui est probablement instable / à valider
- Migrations Alembic : présent en deps (`alembic==1.14.0`) mais pratique
  réelle à confirmer
- Tests : `pytest` et `vitest` installés, couverture inconnue
- Génération de contenu IA : pipelines à `backend/app/services/` ou aux scripts
  racine (`generate_*.py`) — séparation pas encore claire
- Pricing page existe mais paiement réel ?

---

## 3. Stack technique

### Backend
| Couche | Choix | Notes |
|--------|-------|-------|
| Runtime | **Python 3.11+** + FastAPI 0.115 | uvicorn[standard] |
| ORM | **SQLAlchemy 2.0** async + asyncpg | Migrations via Alembic |
| DB | **Postgres 16 + pgvector** | Embeddings prévus (pas encore confirmés) |
| Cache | **Redis 7** | Sessions, rate limiting, files d'attente |
| AI | **Anthropic SDK 0.42** | Claude pour génération + debrief + NBA |
| TTS | **edge-tts 7.2** | Audio des explications |
| PDF | **fpdf2 2.8** | Export de fiches |
| Auth | python-jose + passlib | Squelette présent |

### Frontend
| Couche | Choix | Notes |
|--------|-------|-------|
| Framework | **Next.js 14** (App Router) | React 18 |
| Styling | **Tailwind 3.4** | Pas de CSS modules, pas de styled-components |
| Charts | **Chart.js 4 + react-chartjs-2** | Pour les dashboards de progression |
| Tests | **Vitest 2** + Testing Library + happy-dom | Pas Jest |
| Lang | **TypeScript 6** | À utiliser sérieusement (pas de `any` flemmard) |

### Infra / déploiement
- **Docker Compose** en local (`docker-compose.yml`)
- **Prod sur VPS** via `docker-compose.prod.yml` + Traefik
- Domaine : `wingman.veridis.shop` (HTTPS via Let's Encrypt / `certresolver=myresolver`)
- Réseau Traefik externe : `proxy-net`
- Volumes persistants : `pgdata`, `assets`

### Anthropic API — usages actuels
- **Génération QM/QBank** — créer des questions à partir des LOS
- **Debriefs** — explications structurées des réponses (juste/faux + pourquoi)
- **Recommandations adaptatives** — NBA (Next Best Action), smart-planner
- *(Pas encore : embeddings pgvector, recherche sémantique)*

---

## 4. Architecture

### Backend — `backend/app/`
```
app/
├── main.py            ← entrée FastAPI
├── config.py          ← Settings Pydantic
├── database.py        ← engine SQLAlchemy + session
├── routers/           ← endpoints REST (1 fichier par domaine)
├── services/          ← logique métier (génération, NBA, etc.)
└── middleware/        ← auth, logging, CORS, etc.
```

### Backend — scripts racine
Pipelines de génération de contenu, exécutés à la demande (pas dans le runtime API) :
- `extract_cfa_los.py` — extraction des LOS depuis sources brutes
- `generate_questions.py`, `generate_questions_ai.py` — génération de questions
- `generate_lm_questions.py`, `generate_qm_lm01.py` — variantes par LM (Learning Module)
- `generate_qbank.py`, `generate_all_assets.py` — orchestration complète
- `generate_audio.py` — TTS des explications
- `seed_performance.py` — données de seed pour tests perf

### Frontend — `frontend/app/`
23 pages organisées par domaine fonctionnel :
- **Identité / accès** : `landing`, `login`, `auth`, `pricing`, `settings`
- **Apprentissage** : `journey`, `study-plan`, `smart-planner`, `library`, `session`, `sessions`
- **Adaptatif** : `nba`, `weaknesses`, `readiness`, `exam-intel`, `memory`
- **Engagement** : `challenges`, `debrief`, `results`, `planning`
- **Onboarding** : `onboarding`
- **Admin** : `admin`, `data`

Composants partagés : `frontend/components/`, hooks : `frontend/hooks/`, libs : `frontend/lib/`.

---

## 5. Workflow de développement

### Local (recommandé)
```bash
docker compose up -d db redis        # DB + cache uniquement
cd backend && uvicorn app.main:app --reload  # backend hot-reload
cd frontend && npm run dev           # frontend hot-reload sur :3000
```

Variante full-Docker (plus lent à itérer mais plus iso prod) :
```bash
docker compose up
```

### Tests
```bash
cd backend && pytest                 # tests Python
cd frontend && npm test              # tests Vitest
```

### Migrations DB
```bash
cd backend
alembic revision --autogenerate -m "add foo_table"
alembic upgrade head
```

### Push en prod
*(à compléter — workflow réel à confirmer)*
```bash
# typiquement : git push, ssh VPS, docker compose -f docker-compose.prod.yml pull && up -d
```

---

## 6. Conventions de code (proposées par défaut)

> L'utilisateur n'a pas de préférence forte — ces conventions sont des
> defaults raisonnables. À ajuster en cours de route.

### Backend Python
- **Type hints** sur toutes les fonctions publiques (paramètres + retour).
- **Pydantic v2** pour tous les schémas API (request/response).
- **Async partout** pour les I/O (DB, HTTP, Redis).
- **Pas de logique métier dans `routers/`** — déléguer à `services/`.
- **Anthropic** : passer par un client centralisé dans `services/ai.py` (à créer
  si absent), jamais d'appel direct à `anthropic.Anthropic()` dans les routers.
- **Tests pytest** sur tout nouveau endpoint API : au moins le happy path + 1 cas d'erreur.
- **Migrations Alembic obligatoires** pour tout changement de schéma — pas de
  modif directe via la console DB.
- **Logs** via `loguru` (déjà en deps), niveau INFO en prod.

### Frontend TypeScript
- **TypeScript strict** : pas de `any`, pas de `// @ts-ignore` sans commentaire.
- **App Router** Next 14, pas de pages router.
- **Server Components par défaut**, `"use client"` uniquement quand nécessaire.
- **Tailwind only** pour le style — pas de CSS Modules, pas d'inline styles.
- **Fetch via `lib/api.ts`** (à centraliser si pas déjà fait), pas de `fetch()` éparpillés.
- **Vitest** pour les composants critiques (parcours apprentissage, paiement).
- **Composants découpés** : un composant = un fichier dans `components/<domain>/`.

### Git
- Commits en français OK (le projet est FR-first).
- Messages au présent, courts : `ajoute …`, `corrige …`, `refacto …`.
- Pas de push direct sur `main` quand un déploiement prod est dessus —
  toujours via PR ou branche dédiée si on touche prod.

---

## 7. Choses à savoir / pièges

- **`AUTH_DISABLED=true` est en prod** — ne pas oublier de retirer/conditionner
  avant ouverture aux utilisateurs.
- **Microsoft Store python.exe** sur PATH chez l'utilisateur (Windows) —
  préférer `py -3` ou un venv explicite, pas `python` nu.
- **`wingman_fallback.db`** dans `backend/` — SQLite de fallback (à
  documenter : fallback de quoi, quand l'utiliser, quand ne pas l'utiliser).
- **`results.html`** + **`wingman-architecture.html`** à la racine — semblent
  être des artefacts générés ou de la doc statique. Ne pas modifier sans
  vérifier d'où ils viennent.
- **2 lockfiles côté frontend** : `package-lock.json` ET `yarn.lock`. À
  trancher (npm OU yarn, pas les deux) pour éviter la dérive de versions.
- **Préférer les binaires des `assets/` volumes** plutôt que de les commit en repo.

---

## 8. Priorités à court terme (ordre suggéré)

1. **Auth fonctionnelle** — login/register/JWT, retirer `AUTH_DISABLED` de prod.
   Probablement le single biggest unblock pour tout le reste.
2. **Couvrir l'auth de tests** — c'est le morceau qui ne pardonne pas les bugs.
3. **Onboarding** — premier écran post-signup, guide vers la 1ère session.
4. **NBA / smart-planner solide** — le différenciant produit.
5. **Pricing + paiement** — quand auth + onboarding sont OK.

---

## 9. Points ouverts à clarifier

- Workflow exact de déploiement prod (commandes, secrets, monitoring).
- Couverture de tests actuelle (pytest + vitest) — à mesurer avant de durcir.
- Usage réel de pgvector — embeddings prévus pour quoi exactement ?
- Status du paiement (Stripe ? autre ? pas encore ?).
- Rôles utilisateurs prévus (single role / admin+user / multi-tenant ?).
- Stratégie de seed du contenu pédagogique (manuel ? auto ? mix ?).
