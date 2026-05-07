# Wingman Full Course Manifest

Spécification exécutable pour générer un PDF interactif d'étude CFA à partir
d'un script de cours en Markdown. Conçu pour être consommé directement par
Claude Code sans aller-retour.

Version 1.0 · Maintenu par Maison Lumière · Pipeline Wingman

---

## 1. Mission

Transformer un script de cours CFA (typiquement un fichier `.md` issu d'un
script audio Edge TTS ou d'une transcription) en un PDF d'étude
**print-friendly, e-reader friendly, interactif**, conforme au design system
Wingman.

Le PDF généré doit être :

- **Interactif** : bookmarks PDF hiérarchiques (sections + sous-sections),
  sommaire cliquable avec numéros de page calculés automatiquement, liens
  internes.
- **Bien aéré** mais sans pages à moitié vides : aucune boîte (formule,
  callout, QCM, scénario) ne doit jamais être coupée entre deux pages.
- **Lisible en impression et sur e-reader** : fond blanc, texte sombre,
  contraste WCAG AA, accents colorés peu saturés qui rendent bien en
  niveaux de gris.
- **Pédagogiquement structuré** : théorie → formules → scénarios →
  pièges → récapitulatif → exercices → flashcards → QCM →
  auto-évaluation.

---

## 2. Stack technique

```
Python 3.10+
weasyprint >= 68.1     # HTML+CSS → PDF avec bookmarks et target-counter
pypdf                  # vérification (bookmarks, page count)
pdf2image              # rendu PNG pour QC visuel (poppler requis)
```

Installation :

```bash
pip install weasyprint pypdf pdf2image --break-system-packages
```

Pourquoi WeasyPrint et pas ReportLab : on a besoin de
`bookmark-level`, `target-counter()`, et `@page named pages` — toutes
supportées par WeasyPrint en CSS 3 standard, alors que ReportLab demanderait
de tout générer programmatiquement. WeasyPrint produit aussi des PDF avec
des liens internes vraiment cliquables, pas des annotations bricolées.

---

## 3. Design system Wingman (light theme, print-ready)

### Palette

```
Fond                #ffffff (blanc pur)
Texte courant       #1a1f2e (proche noir)
Texte fort          #0f1525
Texte secondaire    #2a3454
Texte atténué       #5a647e
Texte très atténué  #8890a8

Bleu primaire       #4361ee   — titres, intuitions, badges QCM, scénarios
Teal accent         #06b6a4   — em, success, formules (border-left), num
Rouge warning       #d64545   — pièges
Vert success        #2d8a4f   — réponses correctes, bonnes pratiques

Bordure boîtes      #d6deef
Fond boîtes         #f8faff
Fond intuition      #eef3fc
Fond warning        #fdecec
Fond success        #e8f5ed
Fond example        #e6f7f4
Filet horizontal    #e8ecf5
```

### Typographie

```
Police corps        Inter (fallback Helvetica Neue, Arial)
Police math         Cambria Math, STIX Two Math, Times New Roman
Tailles             body 11pt · h1 20pt · h2 13pt · h3 10.5pt
                    formula eq 16pt · small caps 7.5–8.5pt
Line-height         1.6 (corps), 1.18 (titres), 1.3 (formules)
```

### Géométrie

```
Page                A4
Marges              18mm tous côtés
Border-radius       14px (toutes les boîtes)
Border-left formule 4px solid teal #06b6a4
Spacing vertical    paragraphes 8px · h2 18px top · callouts 10px
```

### Iconographie

Pas d'emojis, pas d'icônes externes. Les boîtes utilisent des **dots colorés
de 8px** au début de leur titre pour signaler la nature (intuition, warning,
success, example). Cohérent en impression mono.

---

## 4. Structure obligatoire d'un cours Wingman

Tout cours Wingman généré par ce manifest **doit** contenir, dans cet ordre :

| # | Section                              | Contenu                                                  |
|---|--------------------------------------|----------------------------------------------------------|
| 0 | **Page de garde bilingue**           | Topic + LM number + titre EN + titre FR + sous-titre     |
| 0 | **Sommaire**                         | 1 page, navigation interactive avec numéros de page      |
| 1 | **Objectifs et vue d'ensemble**      | Lead + bullet list compétences + callout intuition       |
| 2 | **Concepts fondamentaux** (n)        | Théorie progressive avec callouts et exemples            |
| n | **Index des formules clés**          | Toutes les formules numérotées F1, F2, …                 |
| n+1 | **Scénarios pratiques**            | 2-4 cas concrets résolus avec données et étapes          |
| n+2 | **Pièges classiques d'examen**     | 8-12 callouts warning, un par piège                      |
| n+3 | **Récapitulatif**                  | Callout success avec ordered list des idées à graver     |
| n+4 | **Exercices résolus**              | 3-5 exercices type CFA avec solution complète            |
| n+5 | **Flashcards**                     | 8-12 paires Q/R                                          |
| n+6 | **QCM type examen**                | 5 questions à 3 choix avec réponse                       |
| n+7 | **Auto-évaluation et pièges ciblés** | 3-5 QCM compréhension + 3-4 pièges spécifiques         |

---

## 5. Composants HTML (atomes du design system)

Le contenu d'un cours est exprimé via un ensemble fixe de composants HTML.
**Ne pas inventer de nouveaux composants** — étendre cette liste consciemment
si nécessaire.

### 5.1 Page de garde

```html
<div class="title-page">
    <div class="topic-bar">{TOPIC_EN}</div>
    <div class="module-num">Learning Module {NN}</div>
    <h1 class="module-title">{TITRE_EN}</h1>
    <div class="accent"></div>
    <div class="module-title-fr">{TITRE_FR}</div>
    <div class="subtitle">{SOUS_TITRE_DESCRIPTIF_FR}</div>
    <div class="footer-meta">
        <span class="brand">Wingman</span> · CFA Level {N} Curriculum
    </div>
</div>
```

### 5.2 Sommaire

```html
<div class="toc-page">
    <div class="toc-title">Sommaire</div>
    <div class="toc-subtitle">Navigation interactive</div>
    <ul class="toc-list">
        <li><a href="#sec1"><span class="num">01</span><span class="label">{TITRE}</span></a></li>
        <!-- … -->
    </ul>
</div>
```

Le numéro de page apparaît automatiquement à droite via la règle CSS
`.toc-list a::after { content: target-counter(attr(href), page); }`.

### 5.3 Section principale

```html
<h1 class="section" id="sec{N}"><span class="num">Section {NN}</span>{TITRE}</h1>
<div class="underline"></div>
```

Le `<h1 class="section">` déclenche automatiquement :
- `page-break-before: always` (chaque section démarre sur une nouvelle page)
- `bookmark-level: 1` (entrée hiérarchique dans les bookmarks PDF)

### 5.4 Boîte de formule (élément central du design)

```html
<div class="formula">
    <div class="label">{NOM_FORMULE_SMALL_CAPS}</div>
    <div class="eq">{EQUATION_LATEX_LIKE}</div>
    <div class="where">{EXPLICATION_VARIABLES}</div>
</div>
```

Notation des équations dans `.eq` : on utilise du **HTML enrichi** avec
`<sub>`, `<sup>`, et caractères Unicode pour les opérateurs (Σ, ·, σ, ρ,
β, α, √). Pas de LaTeX, pas de MathML. C'est volontaire : tout reste en
HTML simple et stylable.

Exemple :

```html
<div class="eq">σ²<sub>p</sub> = w<sub>1</sub>² σ<sub>1</sub>² + w<sub>2</sub>² σ<sub>2</sub>² + 2 w<sub>1</sub> w<sub>2</sub> σ<sub>1</sub> σ<sub>2</sub> ρ<sub>1,2</sub></div>
```

### 5.5 Callouts

Quatre variantes, toutes avec la même structure :

```html
<div class="callout {VARIANTE}">
    <div class="callout-title"><span class="dot"></span>{TITRE}</div>
    <p>{CONTENU}</p>
</div>
```

| Variante     | Quand l'utiliser                                          |
|--------------|-----------------------------------------------------------|
| `intuition`  | Idée centrale, mécanisme, "pourquoi c'est important"      |
| `warning`    | Pièges, erreurs classiques, limites pratiques             |
| `success`    | Définitions clés, propriétés utiles, énoncés de théorèmes |
| `example`    | Exemples numériques détaillés                             |

### 5.6 Math inline

Pour insérer une variable ou une expression courte dans un paragraphe :

```html
<span class="math">σ<sub>p</sub> ≈ 14,9 %</span>
```

Rend en italique sur fond bleu pâle, avec coins arrondis.

### 5.7 Grille de cartes (key-grid)

Pour comparer 2-3 cas (ex. ρ = +1, ρ = 0, ρ = −1) :

```html
<div class="key-grid">
    <div class="key-row">
        <div class="key-card">
            <div class="k">{LABEL}</div>
            <div class="v">{DESCRIPTION}</div>
        </div>
        <!-- 1 à 4 cartes par row -->
    </div>
</div>
```

### 5.8 Scénario pratique

```html
<div class="scenario">
    <span class="tag">Scénario {N} · {TITRE}</span>
    <p>{CONTEXTE}</p>
    <div class="data">{DONNÉES_DU_PROBLÈME}</div>
    <div class="resolution">{ÉTAPES_DE_RÉSOLUTION}</div>
</div>
```

### 5.9 QCM (utilisé pour QCM, exercices résolus, auto-évaluation)

```html
<div class="qcm">
    <div class="q-num">{LIBELLÉ_SMALL_CAPS}</div>
    <div class="question">{ÉNONCÉ}</div>
    <ul class="choices">
        <li data-letter="A">{CHOIX_A}</li>
        <li data-letter="B">{CHOIX_B}</li>
        <li data-letter="C">{CHOIX_C}</li>
    </ul>
    <div class="answer"><strong>{LETTRE}.</strong> {EXPLICATION}</div>
</div>
```

Les `<li data-letter="X">` génèrent automatiquement le badge circulaire
A/B/C en bleu.

### 5.10 Flashcard

```html
<div class="flashcard">
    <div class="q">{QUESTION}</div>
    <div class="a">{RÉPONSE}</div>
</div>
```

Pastilles **Q** (bleu) et **R** (teal) générées automatiquement en `::before`.

### 5.11 Index des formules

C'est une variante du composant `.formula` placé dans un wrapper :

```html
<div class="formula-index">
    <div class="formula">
        <div class="label">
            <span class="num-tag">F{N}</span>{NOM_FORMULE}
        </div>
        <div class="eq">{EQUATION}</div>
        <div class="where">{EXPLICATION}</div>
    </div>
    <!-- F1, F2, F3, … -->
</div>
```

---

## 6. Règles de mise en page (non négociables)

1. **Aucune boîte ne se coupe.** Toutes les boîtes structurelles
   (`.formula`, `.callout`, `.qcm`, `.flashcard`, `.scenario`, `.key-row`)
   ont `page-break-inside: avoid`. Si une boîte ne tient pas sur la page
   courante, elle est rejetée entière sur la suivante.

2. **Chaque section démarre sur une nouvelle page.** Imposé par
   `page-break-before: always` sur `h1.section`. Conséquence acceptée :
   certaines pages auront un peu de blanc en bas en fin de section.

3. **Les titres ne s'orphelinent jamais.** `page-break-after: avoid` sur
   tous les `h1`, `h2`, `h3`. Les listes courtes critiques utilisent
   `class="keep"` qui ajoute `page-break-inside: avoid` au `<ul>` ou `<ol>`.

4. **Le sommaire tient sur une seule page.** Avec un cours de 20 sections
   max et les paddings actuels, c'est garanti. Si jamais on dépassait, il
   faudrait réduire `padding` et `font-size` de `.toc-list li`.

5. **Marges cohérentes.** Top/bottom 18mm, left/right 18mm. Modifiables
   dans `@page` mais à ne pas toucher sans raison.

6. **Headers/footers de page différenciés.** La page de garde et le
   sommaire (`page: nocover`) n'ont **pas** de header/footer. Toutes les
   autres pages ont :
   - Header droite : `Wingman · CFA L1 · {TOPIC_FR_COURT}`
   - Footer centre : `{N} / {TOTAL}`

---

## 7. Pipeline de génération

Le générateur est un script Python autonome qui prend en entrée un fichier
de configuration `course_config.json` et un fichier `course_content.md`
(structuré comme spécifié plus bas), et produit un PDF.

### 7.1 Structure du projet

```
wingman_course_builder/
├── build_course.py           # Script principal
├── course_config.json        # Métadonnées du cours (topic, LM, titres)
├── course_content.md         # Contenu structuré (voir 7.3)
├── styles/
│   └── wingman_light.css     # Design system (voir 7.4)
└── output/
    └── {SLUG}.pdf            # PDF généré
```

### 7.2 `course_config.json`

```json
{
  "topic_en": "Portfolio Management",
  "topic_fr_short": "Portefeuilles",
  "module_num": "01",
  "title_en": "Portfolio Risk and Return: Part I",
  "title_fr": "Risque et Rendement des Portefeuilles",
  "subtitle_fr": "Théorie moderne du portefeuille : covariance, frontière efficiente, CAPM, bêta et droite de marché des titres.",
  "cfa_level": "1",
  "output_filename": "Risque_Rendement_Portefeuilles_CFA_L1.pdf"
}
```

### 7.3 `course_content.md` — structure

Le fichier Markdown utilise une syntaxe étendue à base de **directives
de bloc** délimitées par `:::`. C'est un compromis entre la lisibilité
Markdown et l'expressivité HTML.

```markdown
# Section 01 · Objectifs et vue d'ensemble

::: lead
Ce module construit la théorie moderne du portefeuille pas à pas, de la
covariance jusqu'au modèle d'évaluation des actifs financiers.
:::

## Compétences visées

- Calculer et interpréter la covariance et la corrélation
- Mesurer le risque d'un portefeuille en tenant compte des corrélations
- ...

::: callout intuition "Intuition centrale"
Tu sais qu'il ne faut pas mettre tous ses œufs dans le même panier.
Mais combien d'actifs faut-il ?
:::

# Section 02 · Covariance et corrélation

## Covariance

La covariance entre deux actifs A et B mesure le degré...

::: formula "Coefficient de corrélation"
ρ_{A,B} = Cov(A, B) / (σ_A · σ_B)
---
**Sans unité.** Toujours comprise entre **−1** et **+1**.
:::

::: callout success "Propriété utile"
La covariance d'un actif **avec lui-même** est égale à sa **variance**.
:::

# Section 13 · Index des formules clés

::: formula-index
::: formula F1 "Rendement espéré du portefeuille"
E(R_p) = Σ w_i · E(R_i)
---
Avec **Σ w_i = 1**.
:::

::: formula F2 "Variance d'un portefeuille à 2 actifs"
σ²_p = w_1² σ_1² + w_2² σ_2² + 2 w_1 w_2 σ_1 σ_2 ρ_{1,2}
:::
:::

# Section 14 · Scénarios pratiques

::: scenario "Comparaison de deux portefeuilles"
Un client te demande de choisir entre deux portefeuilles.

::: data
A : E(R) = 14 %, σ = 22 %.
B : E(R) = 12 %, σ = 18 %.
Taux sans risque R_f = 3 %.
:::

::: resolution
**Étape 1 — Dominance** : aucun ne domine l'autre.
**Étape 2 — Sharpe** :
- SR_A = (14 − 3) / 22 = 0,50
- SR_B = (12 − 3) / 18 = 0,50

**Conclusion** : Sharpe identique → mêmes CAL.
:::
:::

# Section 19 · QCM type examen

::: qcm "Question 1"
Portefeuille de deux actifs équipondérés. A : E(R) = 12 %, σ = 20 %.
B : E(R) = 8 %, σ = 15 %. ρ = 0,3. Quel est l'écart-type ?

A. 14,7 %
B. 16,2 %
C. 17,5 %

> **Réponse A.** Variance = 0,5²·0,20² + 0,5²·0,15² + ... ≈ 0,0201.
> σ ≈ √0,0201 ≈ 14,7 %.
:::

# Section 18 · Flashcards

::: flashcard
Q: Que mesure la covariance et comment diffère-t-elle de la corrélation ?
R: La covariance mesure le degré de co-évolution. La corrélation
   standardise en divisant par le produit des écarts-types.
:::
```

### 7.4 Conventions de notation mathématique dans le Markdown

| Source Markdown    | Rendu HTML                          |
|--------------------|-------------------------------------|
| `σ_p`              | `σ<sub>p</sub>`                     |
| `σ²_p`             | `σ²<sub>p</sub>`                    |
| `R_f`              | `R<sub>f</sub>`                     |
| `ρ_{i,j}`          | `ρ<sub>i,j</sub>`                   |
| `w_1²`             | `w<sub>1</sub>²`                    |
| `2^n`              | `2<sup>n</sup>`                     |
| `Cov(...)`         | inchangé                            |
| `√x`               | inchangé                            |

Le parser convertit ces motifs automatiquement. Pour les variables au
milieu d'un paragraphe, utiliser des backticks : `` `σ_p` `` devient
`<span class="math">σ<sub>p</sub></span>`.

### 7.5 Le parser

`build_course.py` doit :

1. Lire `course_config.json` et `course_content.md`.
2. Parser les directives `::: type "titre"` … `:::` en blocs HTML.
3. Convertir le markdown intra-bloc (gras, italique, listes, math) en HTML.
4. Assembler le HTML complet : page de garde → sommaire généré
   automatiquement à partir des `# Section N · Titre` → corps.
5. Combiner avec `wingman_light.css`.
6. Appeler `weasyprint.HTML(...).write_pdf(..., stylesheets=[css])`.
7. Vérifier en post-build le nombre de pages, le nombre de bookmarks,
   et l'absence de pages à plus de 60 % vides via `pdf2image` + analyse
   du blanc.

**Le parser n'a pas besoin d'être un moteur Markdown complet.** Il doit
gérer :

- `# Section N · Titre` → `<h1 class="section" id="secN">…</h1>`
- `## Titre` → `<h2>…</h2>`
- `### Titre` → `<h3>…</h3>`
- `**gras**` → `<strong>…</strong>`
- `*italique*` → `<em>…</em>`
- `` `inline math` `` → `<span class="math">…</span>`
- Listes `-` et `1.` → `<ul>` et `<ol>`
- Directives `:::` (cf. 7.3)
- Notation `_indice` et `^exposant`

Tout autre markdown (tableaux, blockquotes nus, images) est ignoré ou
levée comme erreur.

### 7.6 Génération du sommaire

Le parser **génère automatiquement** la `<ul class="toc-list">` à partir
des `# Section N · Titre` détectés dans le contenu. Pas besoin de
maintenir un sommaire séparément. Numérotation `01`, `02`, … padée à 2
chiffres.

---

## 8. CSS de référence (`wingman_light.css`)

Le CSS complet est volumineux mais **stable** — c'est ce fichier qu'on
ajoute au repo une fois et qu'on ne modifie qu'avec précaution. Voici les
règles critiques à ne jamais perdre :

```css
@page {
    size: A4;
    margin: 18mm;
    background: #ffffff;
    @bottom-center {
        content: counter(page) " / " counter(pages);
        color: #4361ee;
        font-size: 9pt;
    }
    @top-right {
        content: "Wingman · CFA L1 · Portefeuilles";
        color: #8890a8;
        font-size: 8pt;
        text-transform: uppercase;
    }
}

@page nocover {
    @top-right { content: none; }
    @bottom-center { content: none; }
}

@page :first {
    @top-right { content: none; }
    @bottom-center { content: none; }
}

.title-page, .cover { page: nocover; }

h1.section {
    page-break-before: always;
    page-break-after: avoid;
    bookmark-level: 1;
}
h2 {
    page-break-after: avoid;
    bookmark-level: 2;
}

.formula, .callout, .qcm, .flashcard, .scenario, .key-row {
    page-break-inside: avoid;
}

.toc-list a::after {
    content: target-counter(attr(href), page);
}
```

Le reste du CSS (couleurs, typographie, padding, border-radius) découle du
**§3 Design system**.

---

## 9. Commande pour Claude Code

Quand on lance Claude Code dans le répertoire d'un cours, la commande
attendue est simplement :

```
Génère le PDF Wingman du cours en suivant le manifest
wingman_full_course_manifest.md.
```

Claude Code doit alors :

1. Lire `wingman_full_course_manifest.md` (ce fichier).
2. Lire `course_config.json` et `course_content.md` dans le répertoire courant.
3. Exécuter (ou créer si absent) `build_course.py` selon §7.
4. Vérifier le résultat (page count, bookmarks, pas de coupures évidentes).
5. Présenter le PDF généré à l'utilisateur.

Si `course_config.json` est manquant, Claude Code **doit demander** à
l'utilisateur :
- topic_en (ex. "Portfolio Management")
- module_num (ex. "01")
- title_en (titre officiel CFA Institute)
- title_fr (titre Wingman traduit)

Si `course_content.md` est absent mais qu'un autre `.md` est présent dans
le dossier, Claude Code propose de l'utiliser comme source brute et de
le restructurer selon §4 et §7.3.

---

## 10. QC checklist (à exécuter après chaque build)

```python
from pypdf import PdfReader
r = PdfReader("output/cours.pdf")

# Bookmarks présents et hiérarchiques
def walk(items):
    out = []
    for item in items:
        if isinstance(item, list): out.extend(walk(item))
        else: out.append(item.title)
    return out
assert len(walk(r.outline)) >= 20  # au moins toutes les sections

# Page count cohérent
assert 25 <= len(r.pages) <= 50

# Sommaire sur une seule page
# (vérification visuelle ou via pdf2image en comptant les liens TOC sur p2)
```

Si le sommaire dépasse une page : réduire `padding` de `.toc-list li` à 4-5px
et `font-size` à 9.5pt jusqu'à ce que ça tienne.

Si une boîte est coupée : vérifier qu'elle a bien `page-break-inside: avoid`
dans le CSS. Toutes les classes structurelles (`.formula`, `.callout`,
`.qcm`, `.flashcard`, `.scenario`, `.key-row`) doivent l'avoir.

Si une page est très vide en bas : c'est probablement la dernière page
d'une section (avant `page-break-before: always` de la suivante).
Acceptable. Si c'est en milieu de section, c'est qu'une boîte est rejetée
trop tôt — tenter de raccourcir la boîte précédente ou de la fusionner
avec la suivante.

---

## 11. Roadmap (non bloquant pour v1)

- **v1.1** : variante print "encre minimale" (boîtes sans fond, juste
  filets) sélectionnable via `course_config.json`.
- **v1.2** : support des graphiques SVG inline pour la frontière
  efficiente, SML, etc. (à insérer via une directive `::: chart` qui
  appelle un module séparé).
- **v1.3** : génération multi-langue à partir d'un seul `course_content.md`
  bilingue avec balises `[en]…[/en]` et `[fr]…[/fr]`.
- **v1.4** : intégration Stream Deck XL — un bouton qui rebuild le cours
  courant et l'affiche dans le viewer.
- **v2.0** : export EPUB en plus du PDF, en réutilisant le même
  `course_content.md`.

---

## 12. Notes de design

**Pourquoi pas LaTeX/MathJax/KaTeX ?** Parce qu'on imprime, parce qu'on lit
sur Kindle, parce que les formules CFA L1 ne dépassent jamais le niveau
d'un sub/sup et de quelques opérateurs Unicode. La complexité de KaTeX
(JS runtime, headless browser ou pré-rendu) n'apporte rien comparé à
`<sub>` et `font-family: 'Cambria Math'`.

**Pourquoi pas Pandoc ?** Pandoc fait beaucoup, mais ne gère pas
nativement les directives de bloc Markdown étendues qu'on utilise, et
demanderait un template Lua + un thème CSS aussi compliqué que ce qu'on
écrit ici. On préfère un parser maison de 200 lignes qui fait exactement
ce qu'on veut, ni plus ni moins.

**Pourquoi WeasyPrint et pas Playwright/headless Chrome ?** WeasyPrint est
un binaire Python pur, sans navigateur, sans JS. Il démarre en 1 seconde,
n'a pas besoin de réseau, supporte les bookmarks PDF nativement.
Playwright serait surdimensionné pour des PDFs déterministes à partir
d'HTML statique.

**Pourquoi un design "boîte avec border-left coloré" partout ?** Parce que
c'est le pattern le plus économe en encre et le plus lisible en mono. Le
fond pâle est juste là pour marquer la zone, le filet gauche porte la
sémantique (teal = formule, bleu = intuition, rouge = piège, vert =
success).

---

Fin du manifest. v1.0 — 2026-05-07.
