# Active Discovery Manifest — Level 1

Spécification exécutable pour produire les fiches **Level 1 — Active Discovery**
de Wingman, à partir de la QBank d'un LM. Conçu pour être consommé directement
par Claude Code et le builder backend sans aller-retour.

Version 1.0 · Maintenu par Maison Lumière · Pipeline Wingman · 2026-05-07

---

## 1. Mission pédagogique

**Encoder, pas tester.** Le Level 1 est une fonction d'**encodage actif** —
graver chaque concept du LM via un geste cognitif minimal. Ce n'est PAS une
évaluation. L'étudiant ne doit jamais avoir à réfléchir à un prérequis : si
une carte mobilise un concept secondaire, un rappel intégré l'explique au
sein même de la carte.

**Principe directeur** : tout doit être le plus simple possible. C'est du
Niveau 1.

---

## 2. Périmètre et volumétrie

- **1 LM = 1 fiche PDF.**
- **Source des cartes** : QBank Wingman.
- **Critères de sélection** : `difficulty IN (1, 2)` (very_easy + easy),
  `disabled_at IS NULL`.
- **Plafond** : **20 cartes maximum par fiche** (les questions au-delà sont
  ignorées dans l'ordre de tri).
- **Ordre des cartes** : par `standard_citation` (l'ordre des sections du
  curriculum CFA) puis par `id` pour la stabilité.

> Note : la spec initiale parlait de N = nombre total de questions
> very_easy + easy, sans plafond. Le plafond de 20 a été acté lors du test
> QM-01 le 2026-05-07 (signal/bruit + coût).

---

## 3. Anatomie d'une carte (6 blocs)

Une carte de la fiche se compose dans cet ordre exact :

| # | Bloc                         | Langue | Source                                            |
|---|------------------------------|--------|---------------------------------------------------|
| ① | **Rappel de cours**          | FR     | Claude (prompt système)                           |
| ② | **Formule** (si nécessaire)  | FR     | Claude · null si question conceptuelle             |
| ③ | **Question**                 | EN     | QBank verbatim — stem + 3 choix + bonne réponse    |
| ④ | **Raisonnement**             | FR     | Claude                                            |
| ⑤ | **Résolution détaillée**     | FR     | Claude · résultat numérique avec étapes intermédiaires |
| ⑥ | **Détails calculatrice BA II Plus** | FR | Claude · null si question non calculatoire        |

**Règle de cohérence stricte** : `formule ⇔ calculatrice`. Si une formule
est donnée, la séquence calculatrice DOIT l'être aussi (même triviale type
"saisir les valeurs et additionner"). Si la question est purement conceptuelle,
les deux blocs sont omis.

**Bilingue** : pas de travail de traduction. La question vient de la QBank
en anglais et reste en anglais. Les 5 autres blocs sont en français. La
question n'est jamais traduite.

**Pagination** : une carte peut occuper plusieurs pages PDF si nécessaire.
Pas de contrainte "1 carte = 1 page".

**Cognitive autonomy** : tous les éléments nécessaires à la résolution sont
contenus dans la carte. Aucune dépendance externe, aucun "voir LM précédent",
aucune connaissance présupposée au-delà du strict minimum.

---

## 4. Stack technique

| Couche                  | Choix                              | Notes                                                              |
|-------------------------|------------------------------------|--------------------------------------------------------------------|
| Génération de contenu   | **Anthropic SDK · Sonnet 4.6**     | `claude-sonnet-4-6`. Default cost-discipline : jamais Opus en batch |
| Rendu PDF               | **WeasyPrint 63.1**                | Bookmarks, target-counter, page-break-inside: avoid                 |
| Pull QBank              | **asyncpg** sur Postgres 16        | DSN : `DATABASE_URL`                                                |
| QC post-build           | pypdf (page count)                 |                                                                    |
| Coût observé            | ~**$0.015 / carte** (≈ 800 in + 700 out tok) | $0.27–$0.30 par fiche QM-01 (20 cartes) |

---

## 5. Layout Wingman (light theme, print-ready)

Le rendu réutilise le **design system Wingman** défini dans
`wingman_full_course_manifest.md` § 3 :

- **Fond** blanc, **texte** sombre `#1a1f2e`.
- **Polices** Inter (corps), Cambria Math / STIX Two Math (formules).
- **Bordures** arrondies 14 px, filet gauche coloré pour porter la sémantique :
  - Bleu `#4361ee` → Rappel, Question, Raisonnement
  - Teal `#06b6a4` → Formule
  - Vert `#2d8a4f` → Résolution
  - Rouge `#d64545` → Calculatrice
- **Page de garde** + **TOC interactif** + **header/footer** sur les pages de
  contenu (numéro carte, topic en haut à droite, page x/total en bas).
- **`page-break-inside: avoid`** sur tous les blocs pour qu'aucune boîte ne
  soit coupée entre deux pages.

CSS : [`backend/wingman_course_builder/wingman_light.css`](backend/wingman_course_builder/wingman_light.css)
+ [`backend/wingman_course_builder/level1_card.css`](backend/wingman_course_builder/level1_card.css).

---

## 6. Conventions de notation mathématique

Identiques au manifest Full Course :

| Source                  | Rendu HTML                  |
|-------------------------|-----------------------------|
| `σ_p`                   | `σ<sub>p</sub>`             |
| `σ²_p`                  | `σ²<sub>p</sub>`            |
| `r_réel`, `RP_défaut`   | `r<sub>réel</sub>` (accents OK) |
| `ρ_{i,j}`               | `ρ<sub>i,j</sub>`           |
| `2^n`, `(1+r)^t`        | `2<sup>n</sup>`, `(1+r)<sup>t</sup>` |
| `Σ`, `√`, `π`, `β`, `ρ` | inchangé (Unicode)          |

**Pas de LaTeX, pas de MathML.** Tout reste HTML simple stylable.

---

## 7. Pipeline de génération

### 7.1 CLI

```bash
docker exec wingman-backend python wingman_course_builder/build_level1_fiche.py \
    QM 01 --limit 20
```

- Argument 1 : code topic (`QM`, `FSA`, …)
- Argument 2 : code LM (`01` ou `LM01`, peu importe)
- `--limit N` : limiter le nombre de cartes (défaut : pas de limite, mais le
  plafond produit est de 20 par convention §2)
- Sortie : `backend/generated_content/<TOPIC>/LM<NN>/level1_active_discovery.pdf`

### 7.2 Pipeline interne

1. Pull QBank via asyncpg : récupère stems, choix, bonne réponse, explications,
   `los_anchor`, `standard_citation`, titre du LM.
2. Tri par citation puis id ; cap à 20 cartes (plafond §2).
3. Pour chaque question : un appel Sonnet 4.6 avec le prompt système
   §8 + l'énoncé QBank → JSON `{rappel_cours, formule, raisonnement,
   resolution, calculatrice}`.
4. Rendu HTML : cover + TOC auto-généré + cartes (chacune sur sa propre page
   au minimum, multi-pages si besoin).
5. WeasyPrint → PDF. QC : page count.

### 7.3 Endpoint API (à venir)

`POST /api/content/level1/{topic}/{lm_code}` (à wirer) — déclenche la même
chaîne en async, expose la progression via `/job/{id}` comme la pipeline
generate-all.

### 7.4 Rendu côté frontend

Page `/learning-by-doing` : 3 sélecteurs Topic + Learning Module + Level.
Quand les trois sont sélectionnés et que le PDF existe sur disque, il est
affiché en iframe via le proxy Next.js (`/proxy-api/content/generated/<TOPIC>/LM<NN>/level1_active_discovery.pdf`)
pour rester same-origin (Edge bloque les iframes PDF cross-origin).

---

## 8. Prompt système Claude (cœur de la génération)

Conservé verbatim dans [`build_level1_fiche.py`](backend/wingman_course_builder/build_level1_fiche.py)
constante `SYSTEM_PROMPT`. Récap des règles imposées :

1. **Niveau 1, simple et direct** — pas de finesse inutile.
2. **Autonomie cognitive** : si concept secondaire mobilisé, le rappeler
   inline.
3. **Notation Unicode** : σ, ρ, Σ, π, β, α, ², ³ + indices Markdown
   `σ_p`, `w_1²`, `ρ_{i,j}`, `2^n`. Pas de LaTeX, pas de MathML.
4. **Sortie strictement JSON** avec les 5 clés `rappel_cours`, `formule`,
   `raisonnement`, `resolution`, `calculatrice`. Pas de prose hors JSON.
5. **Cohérence formule ↔ calculatrice** (cf. §3).
6. **Pas de traduction** : la question reste verbatim QBank en anglais.

---

## 9. QC checklist (à exécuter après chaque build)

```python
from pypdf import PdfReader
r = PdfReader("backend/generated_content/QM/LM01/level1_active_discovery.pdf")
n_pages = len(r.pages)
n_cards = 20  # plafond §2

# Page count cohérent : 2 pages cover/TOC + ~1.5–2 pages par carte
assert 25 <= n_pages <= 60, f"Inattendu : {n_pages} pages"

# Bookmarks : 1 (cover) + n_cards
n_bm = sum(1 for _ in r.outline)
assert n_bm == n_cards + 1
```

---

## 10. Choix de design

**Pourquoi 20 cartes plafond ?** En pratique, au-delà, le bénéfice cognitif
décroît et les questions easy redondantes diluent le signal. Le plafond est
ajustable par LM si nécessaire (ouvrir un override dans la config).

**Pourquoi cette règle formule ↔ calculatrice stricte ?** Première version
laissait la calculatrice optionnelle ; le tutorat s'avère plus fluide quand
on garantit que l'étudiant peut TOUJOURS reproduire le calcul à la BA II Plus
dès qu'une formule est en jeu. La cohérence visuelle aide aussi à l'encodage.

**Pourquoi WeasyPrint ?** Cf. `wingman_full_course_manifest.md` § 12.

**Pourquoi Sonnet 4.6 et pas Opus ?** Cost discipline. Pour 90 LMs × 20
cartes = 1 800 cartes ≈ $27 en Sonnet vs $135+ en Opus. La qualité Sonnet est
amplement suffisante pour le Niveau 1 (encodage, pas évaluation fine).

---

## 11. Limites connues

- **3 cartes purement conceptuelles dans QM-01** (interpretation d'un taux
  d'intérêt) sans formule ni calculatrice. Comportement attendu.
- Le tri par `standard_citation` peut être grossier si la QBank n'a pas de
  section précise sur certaines questions (fallback : `id`).
- L'autonomie cognitive est appliquée par le prompt mais non vérifiée
  formellement ; un second prompt de QC pourrait scanner les cartes pour
  détecter les renvois externes ("voir module précédent", etc.).

---

## 12. Roadmap (non bloquant pour v1)

- **v1.1** : endpoint API + bouton frontend "Generate Level 1 fiche" pour
  déclencher à la demande sur n'importe quel LM, avec progression streamée.
- **v1.2** : cache des réponses Claude par `qid` + hash de prompt → re-rendus
  CSS gratuits.
- **v1.3** : Level 2 — Consolidation (medium difficulty) + Level 3 — Mastery
  (hard + very_hard) avec leurs propres prompts.

---

Fin du manifest. v1.0 — 2026-05-07.
