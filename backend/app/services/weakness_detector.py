from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def check_weakness(db: AsyncSession, user_id: str, lm_id: int, score_pct: float):
    """Detect weakness and regression, create alerts accordingly."""
    if score_pct >= 60:
        return

    # Get LM info
    lm_row = await db.execute(text(
        "SELECT lm.code, lm.title FROM learning_modules lm WHERE lm.id = :id"
    ), {"id": lm_id})
    lm = lm_row.mappings().first()
    if not lm:
        return
    lm_code, lm_title = lm["code"], lm["title"]

    # Check for regression (had mastery > 70, now < 55)
    mastery_row = await db.execute(text(
        "SELECT mastery_level FROM lm_mastery WHERE user_id = :uid AND module_id = :mid"
    ), {"uid": user_id, "mid": lm_id})
    prev_mastery = mastery_row.scalar()

    if prev_mastery and float(prev_mastery) > 70 and score_pct < 55:
        await db.execute(text("""
            INSERT INTO alerts (user_id, alert_type, title, body)
            VALUES (:uid, 'low_mastery', :title, :body)
        """), {
            "uid": user_id,
            "title": f"Regression detectee — {lm_code} {lm_title}",
            "body": f"Mastery etait {prev_mastery:.0f}%, nouveau score {score_pct:.0f}%. Revision urgente recommandee.",
        })

    # Weakness alert
    severity = "critical" if score_pct < 40 else "warning"
    weakness_type = "conceptual" if score_pct < 40 else "calculation"

    await db.execute(text("""
        INSERT INTO weakness_log (user_id, module_id, weakness_type, severity, notes)
        VALUES (:uid, :mid, :wtype, :sev, :notes)
    """), {
        "uid": user_id, "mid": lm_id, "wtype": weakness_type,
        "sev": 5 if score_pct < 30 else (4 if score_pct < 40 else 3),
        "notes": f"Score {score_pct}% — {severity}",
    })

    await db.execute(text("""
        INSERT INTO alerts (user_id, alert_type, title, body)
        VALUES (:uid, 'low_mastery', :title, :body)
    """), {
        "uid": user_id,
        "title": f"Faiblesse detectee — {lm_code} {lm_title}",
        "body": f"Score {score_pct:.0f}% ({severity}). Action: Reviser ce LM.",
    })

    await db.commit()


async def weekly_weakness_report(db: AsyncSession, user_id: str):
    """Generate weekly top-5 weakness report as an alert."""
    result = await db.execute(text("""
        SELECT lm.code, lm.title, ROUND(AVG(pr.score), 1) AS avg_score
        FROM performance_records pr
        JOIN sessions s ON s.id = pr.session_id
        JOIN learning_modules lm ON lm.id = pr.module_id
        WHERE s.user_id = :uid
        GROUP BY lm.code, lm.title
        ORDER BY AVG(pr.score) ASC
        LIMIT 5
    """), {"uid": user_id})
    rows = result.mappings().all()

    if not rows:
        return

    body_lines = [f"  {r['code']} — {r['title']}: {r['avg_score']}%" for r in rows]
    body = "Top 5 modules les plus faibles cette semaine:\n" + "\n".join(body_lines)

    await db.execute(text("""
        INSERT INTO alerts (user_id, alert_type, title, body)
        VALUES (:uid, 'low_mastery', 'Rapport hebdomadaire faiblesses', :body)
    """), {"uid": user_id, "body": body})
    await db.commit()
