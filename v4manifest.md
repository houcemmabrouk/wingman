# NBA v4 — Manifest

> Co-écrit. Captures les décisions au fil des questions/réponses.
> Une fois figé, sert de référence unique pour le code à venir.

Date : 2026-05-05

---

## 1. Principe de découpage

**Un tab = une fonctionnalité.** "Tab" = item de la nav globale (sidebar Wingman), pas onglet interne. Chaque tab héberge une fonctionnalité unique et autonome. Pas de tab fourre-tout, pas de fonctionnalité éclatée sur plusieurs tabs.

→ Conséquence : la définition d'un tab commence toujours par "quelle fonctionnalité unique sert ce tab ?"

## 2. Répartition des 3 fonctionnalités sur 3 tabs

| Tab (sidebar) | Route | Fonctionnalité |
|---|---|---|
| **Inbox** (nouveau) | `/nba` | Agrégateur unifié : actions NBA, alertes, disputes, messages coach — une seule liste triable. |
| **AI Coach** (existant) | `/coach` | Conversation directe avec le coach IA. Le chat NBA y est intégré, pas dupliqué ailleurs. |
| **Instant Report** (nouveau) | `/instant-report` | **Implémentation reportée** — hors scope MVP v4. Sidebar entry pas ajoutée. Backend `/api/v1/diagnostic/auto` reste disponible pour usage futur. |

### 2.1 Décisions verrouillées

- Label sidebar de la nouvelle entrée : **"Instant Report"** (groupe Diagnostic).
- Pas de tabs internes nulle part — chaque fonctionnalité a sa route propre.
- Pas de duplication : le chat coach existe une seule fois, dans `/coach`.
- Spec détaillée des messages coach (ton, déclencheurs, format, intégration inbox) → fichier dédié [`coach_communication.md`](coach_communication.md). Non couverte ici.

## 3. Tab Inbox — `/nba`

### 3.1 Anatomie de la page

```
┌──────────────────────────────────────────┐
│  HERO CARD — Next Best Action            │  ← une seule action, mise en avant
│  (action #1 unique, CTA Start →)         │
├──────────────────────────────────────────┤
│  INBOX LIST                              │
│  agrégat trié de toutes les              │
│  notifications/actions/alertes           │
│  (l'action hero apparaît aussi ici)      │
└──────────────────────────────────────────┘
```

→ La carte hero = **la** prochaine meilleure action choisie par le moteur.
La liste dessous = tout le reste, plus l'action hero pour cohérence (l'utilisateur retrouve ce qu'il a vu en haut).

### 3.2 Hero card — calcul

Calcul **séparé** de la liste. Source unique : [`next_best_action.md`](next_best_action.md) (slots A-F, scoring `exam_weight × gap × matrix_priority`, filtres 14 règles, clause Never Surrender). Pioche le slot le plus prioritaire au moment du chargement.

→ Backend : nouvel endpoint `GET /api/v1/nba/hero` qui orchestre `nba_service` + `planning_skill` + `roi_scorer` selon la spec. Pas de duplication de logique côté liste.

### 3.3 Référence existante — v2 sur :3001

La page `/nba` existe déjà en v2 (port 3001). Elle respecte la charte (`.card`, `bg-accent-blue`, `surface-*`) et contient :

- **Hero card** "Next Best Action" : titre + sous-titre ("The single most urgent thing… picked by mastery × exam weight, rolling 10-attempt average") + bouton Refresh + zone async (skeleton `animate-pulse`).
- **Panel droit "Navigator"** = Priority Matrix :
  - Energy : ⚡ High / 🔋 Medium / 🌙 Low
  - Time : 30 / 60 / 90 / 120 min
  - Tasks list (compteur `N tasks · ~M min · 0/N done`)
  - Chaque task : step badge (S1/S2/…) + priority (P1/P2/P3) + topic + LM + mastery% + titre + reasoning + boutons `Read Now` / `Done`
  - 11-Step Method footer : Reading → Essential → LOS → Concept → QBank → Error → Exam → QBank → Calculator → Decision → Spaced

### 3.4 Décisions tranchées

- **a) Navigator** — **hors scope v4**. Composant global de l'app, indépendant de `/nba`, on n'y touche pas. Reste tel quel.
- **b) Hero card** — on garde le squelette v2 (titre + sous-titre + Refresh) **et** on l'enrichit pour rendre l'action réelle au format `next_best_action.md` § 6 : slot (A-F) + titre action + impact chiffré (mastery / exam weight / temps) + CTA `Start →` qui ouvre la session correspondante. Le skeleton devient la carte complète une fois la donnée chargée.
- **c) Inbox = bloc séparé** sur `/nba`, **dessous** la hero card. Pas de fusion avec le Navigator (qui reste un panel global orthogonal). Layout `/nba` = hero (full width) + inbox list (full width) empilés.

### 3.5 Sources de la liste Inbox

| # | Source | Backend | Notes |
|---|---|---|---|
| 1 | Actions NBA (slots A-F) | `nba_service`, `roi_scorer`, `planning_skill` | Le slot déjà rendu en hero est exclu de la liste (pas de doublon). |
| 2 | Alerts système | `/api/alerts` + heuristiques règles | Streak en risque, new weakness, SRS due |
| 3 | Disputes (résolutions arbiter) | `/api/v1/disputes/me` | 7 derniers jours |
| 4 | Messages coach proactifs | règles deterministes côté serveur | Pas de LLM dans /inbox (cost) |
| 5 | ~~Tâches du plan du jour~~ | ~~`plan_entries`~~ | **Retiré 2026-05-06** : faisait doublon avec coach daily check-in (§ 4 `coach_communication.md`) qui lit la cache `planning_skill` — même donnée que la Today Mission UI. La voix coach surface 1 résumé "Plan du jour : N min, M blocs" plutôt que N items individuels. |
| 6 | SRS due aujourd'hui | `srs_queue` | `next_review <= now()` |

→ Toutes les sources convergent vers un format unifié `InboxItem` avec : `id, item_key, category, icon, title, snippet, meta[], cta_label, cta_url, time, unread, urgent, priority_score, source`.

### 3.6 Tri par défaut de la liste

3 niveaux, dans cet ordre :

1. **Urgent** d'abord (`urgent: true` — streak en risque, J-3, weakness critique flaggée)
2. Puis **unread** (non lus)
3. Puis **chronologique** (récent → ancien) au sein de chaque groupe

→ Cohérent avec Follow the White Rabbit : l'urgent saute aux yeux, mais chaque item garde son CTA actionnable. Pas de tri par priorité numérique floue — juste 3 buckets clairs.

### 3.7 Comportement et actions par item

- **Click sur un item = ouvre directement le CTA** (URL de l'action). Pas de panneau détail intermédiaire. Focus CTA, pas de contemplation. Le mark-read est implicite au clic (déclenché côté client puis persisté côté serveur).
- **Actions MVP** : `mark-read` + `dismiss` (masque l'item définitivement).
- **Reportées en v2** : Archive, Snooze, Star.

→ Backend implication : 2 endpoints suffisent en MVP — `POST /api/v1/inbox/mark-read` et `POST /api/v1/inbox/dismiss`, tous deux prennent `{item_key}` et sont idempotents.

### 3.8 Filtres / catégories visibles

Filtres présents en MVP. Forme exacte (chips visibles d'emblée vs toggle qui les révèle) à trancher § 3.8.1.

### 3.8.1 Forme du filtrage

Chips **cachés derrière un toggle `Filtrer ▾`** au-dessus de la liste. Au clic, révèle 7 chips : `Tous · ⚡ Actions · 🔔 Alerts · ⚖ Disputes · 💬 Coach · 📅 Plan · 🧠 SRS`. Cache la complexité par défaut, l'utilisateur la convoque quand il en a besoin.

→ Cliquer une chip filtre la liste (single-select). `Tous` reset.

### 3.9 Notifications invasives (canal push, distinct de l'inbox)

L'inbox = canal **passif** (l'utilisateur revient quand il veut).
Les notifications invasives = canal **actif** : toast / banner qui interrompt l'utilisateur quand l'urgence l'exige.

→ Coexistent. L'item de l'inbox **et** la notif invasive peuvent pointer vers la même action ; la notif est juste un boost de visibilité.

#### Décisions

| Axe | Décision |
|---|---|
| **Événements déclencheurs** | 3 cas : (1) Streak en risque < 3h avant rupture · (2) Weakness critique fraîchement flaggée · (3) J-3 critique (readiness < 60%) |
| **Forme visuelle** | Mix toast/banner : **toast** (auto-dismiss 6s, bas-droite) pour info ; **banner** (sticky en haut, persiste jusqu'à action) pour urgent. Pas de modal MVP (trop brutal). |
| **Portée** | In-app uniquement en MVP. Browser push + Email = v2. |

### 3.10 Bulle de comptage non-lus (sidebar)

Item sidebar `Next Best Action` (groupe "Now") porte un **badge rouge** avec le nombre d'inbox items non lus.

- Visible sur **toutes** les routes de l'app (pas seulement `/nba`).
- Met à jour dès qu'un nouvel item arrive dans l'inbox (polling 30s, alignement avec le `fetchAlerts` existant dans `LayoutShell`).
- 0 unread → badge masqué.
- ≥ 10 → affichage `9+`.

→ Réutilise le pattern existant de la `Sidebar.tsx` : `badgeKey: 'nba_unread'` dans le NavItem `Next Best Action`, fetch dans le `useEffect` du `Sidebar`, couleur `red` (BADGE_STYLE déjà défini).

→ Backend implication : `GET /api/v1/inbox/unread-count` (lightweight, juste le nombre). Endpoint dédié pour éviter de retourner toute la liste à chaque polling.

### 3.11 Empty state

Quand la liste filtrée est vide : carte **Never Surrender** affichant les 3 tiers (Audio · Reading+LOS · +Quiz easy) avec le tier suggéré highlighted selon l'inférence d'état (énergie/temps).

→ Colle au credo `next_best_action.md` : jamais "rien à faire". Le candidat a toujours une mini-action low-effort à portée. Click sur un tier → `/sessions?mode=audio|discovery|reinforce&module=…` ciblant le LM weakness top-priority (sinon le LM le plus en retard du plan).

→ S'applique aussi au filtre vide (ex. catégorie sans item) — pas seulement l'inbox totalement vide.
