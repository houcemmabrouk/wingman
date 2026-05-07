"""
Scheduler stubs for APScheduler cron jobs.
In production, wire these to APScheduler or a task queue (Celery/ARQ).
For now they are callable functions that can be triggered manually via endpoints.
"""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.weakness_detector import weekly_weakness_report


async def check_plan_delay(db: AsyncSession):
    """Check all users for plan delays > 2 days. Auto-recalibrate if > 3 days."""
    result = await db.execute(text("""
        SELECT DISTINCT sp.user_id
        FROM study_plans sp
        WHERE sp.is_active = true
    """))
    user_ids = [str(r[0]) for r in result]

    for uid in user_ids:
        delayed = await db.execute(text("""
            SELECT COUNT(*) FROM plan_entries pe
            JOIN study_plans sp ON sp.id = pe.plan_id
            WHERE sp.user_id = :uid AND sp.is_active = true
              AND pe.status = 'pending'
              AND pe.scheduled_date < CURRENT_DATE - INTERVAL '2 days'
        """), {"uid": uid})
        count = delayed.scalar() or 0

        if count > 0:
            severity = "behind_schedule"
            await db.execute(text("""
                INSERT INTO alerts (user_id, alert_type, title, body)
                VALUES (:uid, :atype, :title, :body)
            """), {
                "uid": uid, "atype": severity,
                "title": f"{count} taches en retard",
                "body": f"Vous avez {count} entrees de plan non completees depuis plus de 2 jours.",
            })

    await db.commit()


async def daily_snapshot(db: AsyncSession):
    """Take daily progress snapshot for all active users."""
    result = await db.execute(text("""
        SELECT DISTINCT u.id FROM users u
        JOIN sessions s ON s.user_id = u.id
        WHERE s.started_at >= CURRENT_DATE - INTERVAL '7 days'
    """))
    user_ids = [str(r[0]) for r in result]

    for uid in user_ids:
        stats = await db.execute(text("""
            SELECT
                COALESCE((SELECT COUNT(DISTINCT pr.module_id) FROM performance_records pr
                          JOIN sessions s ON s.id = pr.session_id WHERE s.user_id = :uid), 0) AS modules_done,
                (SELECT COUNT(*) FROM learning_modules) AS modules_total,
                COALESCE((SELECT ROUND(AVG(pr.score), 2) FROM performance_records pr
                          JOIN sessions s ON s.id = pr.session_id WHERE s.user_id = :uid), 0) AS avg_score,
                COALESCE((SELECT SUM(s.duration_sec) / 60 FROM sessions s
                          WHERE s.user_id = :uid AND s.started_at::date = CURRENT_DATE), 0) AS study_minutes
        """), {"uid": uid})
        row = stats.mappings().first()

        # Get current streak (live — see services/user_metrics.py)
        from app.services.user_metrics import compute_streak
        streak = await compute_streak(db, uid)

        await db.execute(text("""
            INSERT INTO progress_snapshots (user_id, snapshot_date, modules_done, modules_total, avg_score, study_minutes, streak)
            VALUES (:uid, CURRENT_DATE, :md, :mt, :avg, :sm, :streak)
            ON CONFLICT (user_id, snapshot_date) DO UPDATE
            SET modules_done = :md, modules_total = :mt, avg_score = :avg, study_minutes = :sm, streak = :streak
        """), {
            "uid": uid, "md": row["modules_done"], "mt": row["modules_total"],
            "avg": float(row["avg_score"]), "sm": row["study_minutes"], "streak": streak,
        })

    await db.commit()


async def run_weekly_reports(db: AsyncSession):
    """Run weekly weakness reports for all active users."""
    result = await db.execute(text("SELECT DISTINCT user_id FROM sessions WHERE started_at >= CURRENT_DATE - INTERVAL '7 days'"))
    for r in result:
        await weekly_weakness_report(db, str(r[0]))
