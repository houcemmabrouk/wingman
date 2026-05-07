"""Diagnostic report generator — explains user error patterns in 4 study phases.

Phases (chacune change le ton, la profondeur et les action items) :
  • discovery       — exploration, vue conceptuelle, identifier les zones à découvrir
  • consolidation   — renforcement des bases déjà vues, drill ciblé
  • simulation      — pattern recognition examen, mock exams thématiques
  • final_sprint    — urgence, top 5 actions, retention max sur les 2 dernières semaines

Coût : 1 appel Sonnet 4.6 par génération avec prompt caching ephemeral.
"""
from __future__ import annotations

import json
import os
from typing import Any, Optional

import anthropic
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


PHASES = ("discovery", "consolidation", "simulation", "final_sprint")
DEFAULT_MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 2500


PHASE_PROMPTS = {
    "discovery": """Tu es un coach CFA qui parle à un candidat en phase DECOUVERTE.
Le candidat explore le matériel pour la première fois. Ton tendance : encourageant,
conceptuel, vue d'ensemble. Pas de stress. Identifier les concepts à comprendre, pas
les détails à drill. Recommander des LOS à explorer en profondeur, pas des questions
à enchaîner.

Format de réponse en français, markdown :
- # Diagnostic — Phase Découverte
- ## Vue d'ensemble (1 paragraphe contextualisant les erreurs)
- ## Concepts à explorer en priorité (top 3 LOS, 1 paragraphe explicatif chacun, sans drill)
- ## Recommandations pédagogiques (lecture du curriculum, vidéos, peer-discussion)
""",
    "consolidation": """Tu es un coach CFA qui parle à un candidat en phase CONSOLIDATION.
Le candidat a déjà vu le matériel et fait des questions. Maintenant il faut renforcer
les zones fragiles, drill targeted, et fixer les misconceptions. Ton : structuré, factuel,
basé sur les données d'erreurs.

Format de réponse en français, markdown :
- # Diagnostic — Phase Consolidation
- ## Faiblesses prioritaires (top 3 LOS avec error rate, pattern d'erreur, misconception probable)
- ## Plan de drill ciblé (nombre de questions par LOS, types à privilégier)
- ## Misconceptions à corriger (1 paragraphe par misconception identifiée)
""",
    "simulation": """Tu es un coach CFA qui parle à un candidat en phase SIMULATION.
Le candidat fait des mock exams. Focus : pattern recognition examen, gestion du temps,
piège récurrents. Ton : tactique, examen-like, comme un coach de match.

Format de réponse en français, markdown :
- # Diagnostic — Phase Simulation
- ## Patterns examen détectés (types de questions où tu te trompes le plus)
- ## Pièges récurrents (named traps que tu n'as pas vus)
- ## Stratégie examen (gestion temps, ordre des questions, quand skipper)
- ## Mock exam thématique recommandé (config : LOS focus, durée, difficulté)
""",
    "final_sprint": """Tu es un coach CFA qui parle à un candidat en phase FINAL SPRINT (J-14).
Plus de temps pour explorer ou consolider en profondeur. Focus : retention max,
top 5 actions concrètes, drill rapide. Ton : urgent, prescriptif, pas de fluff.

Format de réponse en français, markdown :
- # Diagnostic — Final Sprint (J-14)
- ## Top 5 actions PRIORITAIRES (1 ligne chacune, format : "ACTION : motif")
- ## Quick wins (LOS où 30 min de drill = 5 points de score gagnés)
- ## À NE PAS faire (zones où l'effort marginal est négatif)
""",
}


SYSTEM_PROMPT_BASE = """Tu es un coach pédagogique CFA Level I expert en analyse d'erreurs.
Tu reçois en input :
  • la liste des erreurs récentes du candidat (LOS, question, time spent, confidence)
  • les statistiques agrégées par LOS (error rate, fréquence, last_seen)
  • la phase de préparation du candidat

Ta sortie est un rapport structuré en markdown français. Tu dois :
  • Citer les LOS spécifiques (code + description courte)
  • Quantifier (X erreurs sur Y tentatives)
  • Donner des actions concrètes (pas de généralités du type "réviser ce chapitre")
  • Adapter ton et profondeur à la phase

Pas de chain-of-thought visible, pas de "Wait let me reconsider", pas de meta-commentaire
sur ton processus. Réponse directe, prête pour l'utilisateur final."""


def classify_lm_phase(stats: dict[str, Any], days_to_exam: Optional[int]) -> str:
    """Auto-assign a study phase to a learning module based on user stats.

    stats keys: attempts, errors, los_seen, total_los, error_rate (0..1)
    days_to_exam: optional int (None if exam date not set)
    """
    if days_to_exam is not None and days_to_exam < 14:
        return "final_sprint"
    if stats["attempts"] < 5:
        return "discovery"
    coverage = stats["los_seen"] / stats["total_los"] if stats["total_los"] else 0.0
    error_rate = stats["error_rate"]
    if coverage < 0.30:
        return "discovery"
    if coverage > 0.70 and error_rate <= 0.30:
        return "simulation"
    return "consolidation"


async def fetch_user_data_per_lm(db: AsyncSession, user_id: str, lookback_days: int = 60) -> dict[str, Any]:
    """Group user attempts by LM with stats for phase classification."""
    rows = await db.execute(text("""
        SELECT lm.id AS lm_id, lm.code AS lm_code, lm.title AS lm_title,
               t.code AS topic_code,
               (SELECT COUNT(*) FROM learning_outcomes lo WHERE lo.module_id = lm.id) AS total_los,
               COUNT(qa.id) AS attempts,
               COUNT(qa.id) FILTER (WHERE qa.is_correct = false) AS errors,
               COUNT(DISTINCT q.outcome_id) FILTER (WHERE q.outcome_id IS NOT NULL) AS los_seen,
               MAX(qa.created_at) AS last_seen,
               AVG(qa.time_spent_sec) AS avg_time_sec
        FROM question_attempts qa
        JOIN questions q ON q.id = qa.question_id
        JOIN learning_modules lm ON lm.id = q.module_id
        JOIN topics t ON t.id = lm.topic_id
        WHERE qa.user_id = :uid
          AND qa.created_at > NOW() - (:lookback || ' days')::interval
        GROUP BY lm.id, lm.code, lm.title, t.code
    """), {"uid": user_id, "lookback": str(lookback_days)})
    by_lm = [dict(r) for r in rows.mappings().all()]

    # Pull a few example errors per LM for narrative grounding
    err_rows = await db.execute(text("""
        SELECT lm.code AS lm_code, lo.code AS los_code,
               LEFT(q.stem, 160) AS stem, qa.selected_answer, q.correct_answer,
               q.difficulty, qa.time_spent_sec
        FROM question_attempts qa
        JOIN questions q ON q.id = qa.question_id
        JOIN learning_modules lm ON lm.id = q.module_id
        LEFT JOIN learning_outcomes lo ON lo.id = q.outcome_id
        WHERE qa.user_id = :uid AND qa.is_correct = false
          AND qa.created_at > NOW() - (:lookback || ' days')::interval
        ORDER BY qa.created_at DESC
    """), {"uid": user_id, "lookback": str(lookback_days)})
    examples_per_lm: dict[str, list[dict]] = {}
    for e in err_rows.mappings().all():
        ex_list = examples_per_lm.setdefault(e["lm_code"], [])
        if len(ex_list) < 2:
            ex_list.append(dict(e))

    # Pull days_to_exam from user_profiles
    exam_row = await db.execute(text("""
        SELECT exam_date FROM user_profiles WHERE user_id = :uid
    """), {"uid": user_id})
    er = exam_row.mappings().first()
    days_to_exam = None
    if er and er["exam_date"]:
        from datetime import date as _date
        days_to_exam = max(0, (er["exam_date"] - _date.today()).days)

    # Enrich each LM with phase + error_rate + examples
    for lm in by_lm:
        lm["error_rate"] = (lm["errors"] / lm["attempts"]) if lm["attempts"] else 0.0
        lm["phase"] = classify_lm_phase(lm, days_to_exam)
        lm["examples"] = examples_per_lm.get(lm["lm_code"], [])
        lm["last_seen"] = str(lm["last_seen"]) if lm["last_seen"] else None
        lm["avg_time_sec"] = float(lm["avg_time_sec"]) if lm["avg_time_sec"] else 0.0

    return {
        "lookback_days": lookback_days,
        "days_to_exam": days_to_exam,
        "lm_breakdown": sorted(by_lm, key=lambda x: -x["errors"]),
    }


async def fetch_user_error_data(db: AsyncSession, user_id: str, lookback_days: int = 60) -> dict[str, Any]:
    rows = await db.execute(text("""
        WITH recent AS (
            SELECT qa.id AS attempt_id, qa.created_at, qa.is_correct, qa.time_spent_sec, qa.confidence,
                   qa.selected_answer, q.id AS question_id, q.stem, q.difficulty,
                   q.correct_answer, lo.code AS los_code, lo.description AS los_description,
                   lo.bloom_level, lm.code AS module_code, t.code AS topic_code
            FROM question_attempts qa
            JOIN questions q ON q.id = qa.question_id
            LEFT JOIN learning_outcomes lo ON lo.id = q.outcome_id
            JOIN learning_modules lm ON lm.id = q.module_id
            JOIN topics t ON t.id = lm.topic_id
            WHERE qa.user_id = :uid
              AND qa.created_at > NOW() - (:lookback || ' days')::interval
        )
        SELECT * FROM recent ORDER BY created_at DESC
    """), {"uid": user_id, "lookback": str(lookback_days)})
    attempts = [dict(r) for r in rows.mappings().all()]

    # Aggregate per LOS
    los_stats: dict[str, dict[str, Any]] = {}
    for a in attempts:
        code = a.get("los_code") or "(unanchored)"
        s = los_stats.setdefault(code, {
            "los_code": code, "los_description": a.get("los_description") or "",
            "module_code": a.get("module_code"), "topic_code": a.get("topic_code"),
            "bloom_level": a.get("bloom_level"),
            "attempts": 0, "wrong": 0, "right": 0,
            "total_time_sec": 0, "examples": [],
        })
        s["attempts"] += 1
        if a["is_correct"] is True:
            s["right"] += 1
        elif a["is_correct"] is False:
            s["wrong"] += 1
            if len(s["examples"]) < 3:
                s["examples"].append({
                    "stem": (a["stem"] or "")[:160],
                    "user_answer": a.get("selected_answer"),
                    "correct_answer": a.get("correct_answer"),
                    "difficulty": a.get("difficulty"),
                    "time_spent_sec": a.get("time_spent_sec"),
                })
        s["total_time_sec"] += a.get("time_spent_sec") or 0

    los_list = sorted(los_stats.values(), key=lambda s: -s["wrong"])
    total_attempts = sum(s["attempts"] for s in los_list)
    total_wrong = sum(s["wrong"] for s in los_list)
    return {
        "total_attempts": total_attempts,
        "total_wrong": total_wrong,
        "error_rate": round(total_wrong / total_attempts, 3) if total_attempts else 0,
        "lookback_days": lookback_days,
        "los_breakdown": los_list[:20],  # top 20 LOS by wrong count
    }


def build_user_message(phase: str, data: dict[str, Any]) -> str:
    lookback = data.get("lookback_days", 60)
    if data["total_attempts"] == 0:
        return (
            f"Le candidat n'a fait aucune tentative dans les {lookback} derniers jours.\n"
            f"Phase actuelle : {phase}.\n"
            f"Génère un diagnostic adapté qui invite à commencer ou reprendre, sans inventer "
            f"d'erreurs imaginaires."
        )

    summary = (
        f"Phase : {phase}\n"
        f"Lookback : {lookback} jours\n"
        f"Tentatives totales : {data['total_attempts']}\n"
        f"Erreurs totales : {data['total_wrong']} (error rate {data['error_rate']*100:.0f}%)\n\n"
        f"Top LOS avec erreurs (jusqu'à 20) :\n"
    )
    for s in data["los_breakdown"]:
        if s["wrong"] == 0:
            continue
        rate = s["wrong"] / s["attempts"] if s["attempts"] else 0
        avg_time = s["total_time_sec"] / s["attempts"] if s["attempts"] else 0
        summary += (
            f"\n{s['los_code']} ({s['module_code']}, Bloom {s['bloom_level']}) — "
            f"{s['wrong']}/{s['attempts']} wrong ({rate*100:.0f}%), avg {avg_time:.0f}s\n"
            f"  Description : {(s['los_description'] or '')[:120]}\n"
        )
        for i, ex in enumerate(s["examples"], 1):
            summary += (
                f"  Exemple {i}: stem='{ex['stem']}', user={ex['user_answer']}, "
                f"correct={ex['correct_answer']}, diff={ex['difficulty']}\n"
            )
    summary += (
        f"\nGénère le diagnostic phase '{phase}' selon le format imposé "
        f"par le system prompt. Pas de prose hors markdown."
    )
    return summary


AUTO_SYSTEM_PROMPT = """Tu es un coach pédagogique CFA Level I. Tu reçois la liste des LM
que le candidat a touchés récemment, chacun classé automatiquement dans une PHASE
parmi : discovery, consolidation, simulation, final_sprint.

Phases (rappel rapide) :
  • discovery     — peu vu, vue d'ensemble, identifier les concepts à explorer
  • consolidation — déjà vu mais fragile, drill ciblé, fix misconceptions
  • simulation    — bien maîtrisé, focus pattern recognition examen
  • final_sprint  — J-14, urgence, top actions concrètes

Format de réponse : markdown français.

Structure :
# Diagnostic personnalisé

## Vue d'ensemble (1 paragraphe avec total tentatives, erreurs, days_to_exam si non null)

## Plan par module
Pour chaque LM (ordonné par nb d'erreurs descendant), produis une section :

### {lm_code} — {lm_title}  · Phase: {phase emoji + label}
- **Stats** : X/Y questions ratées, coverage Z% des LOS, avg Ws
- **Action recommandée selon la phase** :
  - discovery → "Avant de drill, lis/relis les concepts X, Y. Pas de panique — tu en es à l'exploration"
  - consolidation → "Drill 10-15 questions sur LO_a et LO_b avant la fin de semaine"
  - simulation → "Mock thématique 25 questions. Travaille le timing à <90s/question"
  - final_sprint → "TOP : refais les 3 questions ratées. Ne pas explorer de nouveau matériel"
- (1 paragraphe court basé sur les exemples d'erreurs si fournis)

## Synthèse 3 actions priorité haute
Liste 3 bullets concrets sur la base de tout ce qui précède.

Pas de "Wait", pas de méta-commentaire. Réponse directe et utilisable."""

PHASE_EMOJI = {"discovery": "🔍 Découverte", "consolidation": "🛠️ Consolidation",
               "simulation": "🎯 Simulation", "final_sprint": "🚀 Final Sprint"}


def build_auto_user_message(data: dict[str, Any]) -> str:
    if not data["lm_breakdown"]:
        return (
            f"Le candidat n'a fait aucune tentative dans les {data['lookback_days']} derniers jours.\n"
            f"days_to_exam = {data['days_to_exam']}\n"
            f"Génère un message court qui invite à commencer une première session, sans inventer d'erreurs."
        )

    lines = [
        f"Lookback : {data['lookback_days']} jours",
        f"Days to exam : {data['days_to_exam'] if data['days_to_exam'] is not None else 'non renseigné'}",
        f"Total LM touchés : {len(data['lm_breakdown'])}",
        "",
        "Détail par LM (ordonné par nb d'erreurs) :",
    ]
    for lm in data["lm_breakdown"]:
        coverage_pct = (lm["los_seen"] / lm["total_los"] * 100) if lm["total_los"] else 0
        lines.append(
            f"\n• {lm['lm_code']} ({lm['topic_code']}) — phase: {lm['phase']}"
            f"\n  {lm['errors']}/{lm['attempts']} erreurs ({lm['error_rate']*100:.0f}%), "
            f"coverage {lm['los_seen']}/{lm['total_los']} LOS ({coverage_pct:.0f}%), "
            f"avg time {lm['avg_time_sec']:.0f}s, last_seen {lm['last_seen']}"
            f"\n  Title: {lm['lm_title']}"
        )
        for i, ex in enumerate(lm["examples"], 1):
            lines.append(
                f"  Exemple err {i}: {ex.get('los_code', '?')} | "
                f"stem='{ex.get('stem', '')}', user={ex.get('selected_answer')}, "
                f"correct={ex.get('correct_answer')}, diff={ex.get('difficulty')}"
            )
    lines.append("\nGénère le diagnostic au format imposé par le system prompt.")
    return "\n".join(lines)


async def generate_auto_diagnostic(
    db: AsyncSession,
    user_id: str,
    api_key: Optional[str] = None,
    model: str = DEFAULT_MODEL,
) -> dict[str, Any]:
    """Auto-classified diagnostic — each LM gets its own phase and section."""
    api_key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY missing")

    data = await fetch_user_data_per_lm(db, user_id)
    user_msg = build_auto_user_message(data)

    client = anthropic.AsyncAnthropic(api_key=api_key)
    response = await client.messages.create(
        model=model,
        max_tokens=MAX_TOKENS,
        temperature=0.3,
        system=[{"type": "text", "text": AUTO_SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": user_msg}],
    )
    text_out = ""
    for block in response.content:
        if getattr(block, "type", None) == "text":
            text_out += block.text

    return {
        "mode": "auto",
        "user_id": user_id,
        "days_to_exam": data["days_to_exam"],
        "lookback_days": data["lookback_days"],
        "lm_phases": [
            {"lm_code": lm["lm_code"], "lm_title": lm["lm_title"], "phase": lm["phase"],
             "attempts": lm["attempts"], "errors": lm["errors"],
             "error_rate": round(lm["error_rate"], 3),
             "los_seen": lm["los_seen"], "total_los": lm["total_los"]}
            for lm in data["lm_breakdown"]
        ],
        "report_md": text_out,
        "usage": {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "cache_read_tokens": getattr(response.usage, "cache_read_input_tokens", 0),
        },
        "model": response.model,
    }


async def generate_diagnostic(
    db: AsyncSession,
    user_id: str,
    phase: str,
    api_key: Optional[str] = None,
    model: str = DEFAULT_MODEL,
) -> dict[str, Any]:
    if phase not in PHASES:
        raise ValueError(f"phase must be one of {PHASES}, got {phase!r}")
    api_key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY missing")

    data = await fetch_user_error_data(db, user_id)
    user_msg = build_user_message(phase, data)
    system = SYSTEM_PROMPT_BASE + "\n\n" + PHASE_PROMPTS[phase]

    client = anthropic.AsyncAnthropic(api_key=api_key)
    response = await client.messages.create(
        model=model,
        max_tokens=MAX_TOKENS,
        temperature=0.3,
        system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": user_msg}],
    )
    text_out = ""
    for block in response.content:
        if getattr(block, "type", None) == "text":
            text_out += block.text

    return {
        "phase": phase,
        "user_id": user_id,
        "data_summary": {
            "total_attempts": data["total_attempts"],
            "total_wrong": data["total_wrong"],
            "error_rate": data["error_rate"],
            "lookback_days": data["lookback_days"],
            "distinct_los_with_errors": sum(1 for s in data["los_breakdown"] if s["wrong"] > 0),
        },
        "report_md": text_out,
        "usage": {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "cache_read_tokens": getattr(response.usage, "cache_read_input_tokens", 0),
        },
        "model": response.model,
    }
