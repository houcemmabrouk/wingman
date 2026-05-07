"""CFA Level I topic codes → display names (EN / short FR for running header).

Used by the course PDF builder to populate the cover page when the only
metadata available is the topic code (e.g. "PM"). Kept in sync with the
frontend `lib/lm-data.ts` topics list.
"""

TOPIC_NAMES_EN: dict[str, str] = {
    "QM":   "Quantitative Methods",
    "ECO":  "Economics",
    "FSA":  "Financial Statement Analysis",
    "CORP": "Corporate Issuers",
    "EQU":  "Equity Investments",
    "FI":   "Fixed Income",
    "DER":  "Derivatives",
    "ALT":  "Alternative Investments",
    "PM":   "Portfolio Management",
    "ETH":  "Ethical and Professional Standards",
}

TOPIC_NAMES_FR_SHORT: dict[str, str] = {
    "QM":   "Méthodes Quantitatives",
    "ECO":  "Économie",
    "FSA":  "Analyse Financière",
    "CORP": "Émetteurs",
    "EQU":  "Actions",
    "FI":   "Taux",
    "DER":  "Dérivés",
    "ALT":  "Alternatifs",
    "PM":   "Portefeuilles",
    "ETH":  "Éthique",
}


def topic_name_en(code: str) -> str:
    return TOPIC_NAMES_EN.get(code.upper(), code)


def topic_name_fr_short(code: str) -> str:
    return TOPIC_NAMES_FR_SHORT.get(code.upper(), code)
