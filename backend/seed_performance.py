"""Seed 21 days of realistic demo performance data into Wingman PostgreSQL."""
import random
import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from app.database import engine

DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

CONCEPT_TAGS = {
    'ETH': ['integrity', 'misconduct', 'fair_dealing', 'diligence', 'independence', 'gips_compliance'],
    'QM': ['discounting', 'probability', 'hypothesis_testing', 'regression', 'time_value', 'sampling'],
    'ECO': ['supply_demand', 'gdp', 'monetary_policy', 'fiscal_policy', 'exchange_rates', 'trade'],
    'FSA': ['revenue_recognition', 'inventory', 'depreciation', 'ratios', 'cash_flows', 'eps'],
    'CORP': ['npv', 'irr', 'capital_structure', 'governance', 'working_capital', 'dividends'],
    'EQU': ['ddm', 'gordon_growth', 'multiples', 'market_efficiency', 'industry_analysis'],
    'FI': ['duration', 'convexity', 'yield_curve', 'credit_risk', 'bond_pricing', 'spreads'],
    'DER': ['forwards', 'futures', 'options', 'swaps', 'put_call_parity', 'hedging'],
    'ALT': ['hedge_funds', 'private_equity', 'real_estate', 'commodities', 'infrastructure'],
    'PM': ['ips', 'asset_allocation', 'risk_measures', 'portfolio_theory', 'rebalancing'],
}

ERROR_TYPES = [('concept', 40), ('formula', 20), ('reading_mistake', 15), ('trap', 15), ('time_pressure', 10)]
SESSION_TYPES = [('quiz', 35), ('study', 30), ('review', 25), ('mock_exam', 10)]
COMPLETION = [('completed', 75), ('interrupted', 15), ('abandoned', 10)]
DEVICES = [('desktop', 70), ('mobile', 20), ('tablet', 10)]
MODES = [('active', 40), ('passive', 25), ('hybrid', 35)]
TRIGGER_TYPES = ['inactivity', 'repeated_errors', 'low_focus', 'time_drift', 'overconfidence']
QUIZ_TYPES = ['checkpoint', 'end_session', 'review', 'exam_style']


def weighted_choice(options):
    values, weights = zip(*options)
    return random.choices(values, weights=weights, k=1)[0]


async def seed():
    random.seed(42)
    async with engine.begin() as conn:
        # Get all learning modules with their topic codes
        rows = await conn.execute(text("""
            SELECT lm.id, lm.code, t.code as topic_code
            FROM learning_modules lm
            JOIN topics t ON t.id = lm.topic_id
            ORDER BY lm.id
        """))
        modules = [dict(r._mapping) for r in rows]
        if not modules:
            print("No modules found — run seed.sql first")
            return

        # Get questions per module
        q_rows = await conn.execute(text("SELECT id, module_id FROM questions"))
        questions_by_module = {}
        for r in q_rows:
            questions_by_module.setdefault(r.module_id, []).append(r.id)

        base_date = datetime.now(timezone.utc) - timedelta(days=21)
        session_count = 0
        quiz_count = 0
        attempt_count = 0

        for day_offset in range(21):
            day = base_date + timedelta(days=day_offset)
            # 0-2 sessions per day, weighted toward 1
            n_sessions = weighted_choice([(0, 15), (1, 55), (2, 30)])

            for _ in range(n_sessions):
                lm = random.choice(modules)
                topic_code = lm['topic_code']

                start = day + timedelta(hours=random.randint(7, 22), minutes=random.randint(0, 59))
                duration = random.randint(15, 75)
                end = start + timedelta(minutes=duration)
                stype = weighted_choice(SESSION_TYPES)
                completion = weighted_choice(COMPLETION)
                device = weighted_choice(DEVICES)
                mode = weighted_choice(MODES)
                focus = max(25, min(98, round(random.gauss(72, 14), 1)))
                if completion == 'abandoned':
                    focus = max(20, focus - random.randint(15, 30))
                friction = max(5, min(95, round(100 - focus + random.uniform(-10, 15), 1)))
                comprehension = round(random.uniform(2.0, 4.8), 1)
                fatigue = round(random.uniform(1.2, 4.5), 1)
                coach_count = weighted_choice([(0, 45), (1, 30), (2, 18), (3, 7)])

                # Insert session
                result = await conn.execute(text("""
                    INSERT INTO sessions (user_id, started_at, ended_at, duration_sec, session_type,
                        focus_score, friction_score, comprehension_rating, fatigue_rating,
                        completion_status, device_type, study_mode, coach_interventions_count)
                    VALUES (:uid, :start, :end, :dur, :stype, :focus, :friction, :comp, :fat,
                        :completion, :device, :mode, :coach)
                    RETURNING id
                """), {
                    'uid': DEMO_USER_ID, 'start': start, 'end': end, 'dur': duration * 60,
                    'stype': stype, 'focus': focus, 'friction': friction,
                    'comp': comprehension, 'fat': fatigue, 'completion': completion,
                    'device': device, 'mode': mode, 'coach': coach_count,
                })
                session_id = result.scalar()
                session_count += 1

                # Coach interventions
                for _ in range(coach_count):
                    trigger = random.choice(TRIGGER_TYPES)
                    followed = random.random() < 0.62
                    effect = round(random.uniform(0.2, 0.9), 2) if followed else round(random.uniform(-0.3, 0.3), 2)
                    await conn.execute(text("""
                        INSERT INTO coach_interventions (session_id, user_id, triggered_at, trigger_type,
                            message_type, message_text, suggested_action, user_followed_suggestion, estimated_effect_score)
                        VALUES (:sid, :uid, :t, :trigger, :mtype, :msg, :action, :followed, :effect)
                    """), {
                        'sid': session_id, 'uid': DEMO_USER_ID,
                        't': start + timedelta(minutes=random.randint(2, max(3, duration - 2))),
                        'trigger': trigger,
                        'mtype': random.choice(['nudge', 'warning', 'advice', 'summary']),
                        'msg': f'Coach: {trigger}',
                        'action': random.choice(['slow_down', 'review', 'take_quiz', 'refocus']),
                        'followed': followed, 'effect': effect,
                    })

                # Quiz (60% chance, higher if quiz/review session)
                do_quiz = stype in ('quiz', 'review', 'mixed') or random.random() < 0.45
                if not do_quiz:
                    continue

                q_count = random.choice([5, 8, 10, 12])
                expected = (focus * 0.45) + (comprehension * 12) + random.uniform(-10, 10)
                raw_score = max(20, min(95, round(expected, 1)))
                correct = round(q_count * raw_score / 100)
                incorrect = q_count - correct
                skipped = random.randint(0, min(2, incorrect))
                incorrect = max(0, incorrect - skipped)
                confidence = round(random.uniform(2.0, 4.8), 1)

                # Insert performance_record
                await conn.execute(text("""
                    INSERT INTO performance_records (session_id, module_id, score, questions_total,
                        questions_correct, time_spent_sec, created_at)
                    VALUES (:sid, :mid, :score, :total, :correct, :time, :created)
                """), {
                    'sid': session_id, 'mid': lm['id'], 'score': raw_score,
                    'total': q_count, 'correct': correct,
                    'time': random.randint(180, 900),
                    'created': start + timedelta(minutes=random.randint(5, max(6, duration - 3))),
                })
                quiz_count += 1

                # Question attempts
                concepts = CONCEPT_TAGS.get(topic_code, ['general'])
                avail_questions = questions_by_module.get(lm['id'], [])

                for qi in range(q_count):
                    is_correct = qi < correct
                    error_type = None if is_correct else weighted_choice(ERROR_TYPES)
                    q_id = random.choice(avail_questions) if avail_questions else None

                    if q_id:
                        await conn.execute(text("""
                            INSERT INTO question_attempts (session_id, question_id, user_id, selected_answer,
                                is_correct, time_spent_sec, confidence, concept_tag, error_type, question_difficulty)
                            VALUES (:sid, :qid, :uid, :ans, :correct, :time, :conf, :concept, :error, :diff)
                        """), {
                            'sid': session_id, 'qid': q_id, 'uid': DEMO_USER_ID,
                            'ans': random.choice(['A', 'B', 'C']),
                            'correct': is_correct,
                            'time': random.randint(20, 140),
                            'conf': random.randint(1, 5),
                            'concept': random.choice(concepts),
                            'error': error_type,
                            'diff': round(random.uniform(1.0, 5.0), 1),
                        })
                        attempt_count += 1

                # Update lm_mastery
                await conn.execute(text("""
                    INSERT INTO lm_mastery (user_id, module_id, mastery_level, review_count, last_studied)
                    VALUES (:uid, :mid, :mastery, 1, now())
                    ON CONFLICT (user_id, module_id) DO UPDATE SET
                        mastery_level = (lm_mastery.mastery_level + :mastery) / 2,
                        review_count = lm_mastery.review_count + 1,
                        last_studied = now()
                """), {'uid': DEMO_USER_ID, 'mid': lm['id'], 'mastery': raw_score})

        print(f"Seeded: {session_count} sessions, {quiz_count} quizzes, {attempt_count} question attempts")


if __name__ == '__main__':
    asyncio.run(seed())
