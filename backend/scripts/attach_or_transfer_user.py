"""Attach demo progress to a real account, or transfer it to an existing user.

Default mode is a dry-run. Nothing is written unless `--execute` is passed.

Common safe path:
    python scripts/attach_or_transfer_user.py attach --email you@example.com --password "..." --execute

This keeps the same source UUID and only changes its login identity, so every
user-scoped row remains attached without mass-updating progress tables.
"""

from __future__ import annotations

import argparse
import asyncio
from getpass import getpass
from pathlib import Path
import sys
from typing import Iterable

from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.database import async_session  # noqa: E402
from app.routers.auth import hash_password  # noqa: E402


DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"


USER_SCOPED_TABLES_QUERY = """
SELECT c.table_name
FROM information_schema.columns c
JOIN information_schema.tables t
  ON t.table_schema = c.table_schema
 AND t.table_name = c.table_name
WHERE c.table_schema = 'public'
  AND c.column_name = 'user_id'
  AND c.table_name <> 'users'
  AND t.table_type = 'BASE TABLE'
ORDER BY c.table_name
"""


async def _user_by_email(db, email: str) -> dict | None:
    row = await db.execute(
        text("""
            SELECT id, email, display_name, is_active, provider
            FROM users
            WHERE lower(email) = lower(:email)
        """),
        {"email": email},
    )
    user = row.mappings().first()
    return dict(user) if user else None


async def _user_by_id(db, user_id: str) -> dict | None:
    row = await db.execute(
        text("""
            SELECT id, email, display_name, is_active, provider
            FROM users
            WHERE id = :uid
        """),
        {"uid": user_id},
    )
    user = row.mappings().first()
    return dict(user) if user else None


async def _user_scoped_tables(db) -> list[str]:
    rows = await db.execute(text(USER_SCOPED_TABLES_QUERY))
    return [str(r[0]) for r in rows.all()]


async def _counts(db, user_id: str, tables: Iterable[str]) -> dict[str, int]:
    out: dict[str, int] = {}
    for table in tables:
        row = await db.execute(
            text(f'SELECT COUNT(*) FROM "{table}" WHERE user_id = :uid'),  # noqa: S608
            {"uid": user_id},
        )
        out[table] = int(row.scalar() or 0)
    return out


def _print_counts(title: str, counts: dict[str, int]) -> None:
    print(title)
    any_rows = False
    for table, count in counts.items():
        if count:
            any_rows = True
            print(f"  {table}: {count}")
    if not any_rows:
        print("  no user-scoped rows")


async def attach(args: argparse.Namespace) -> None:
    password = args.password
    if args.execute:
        password = password or getpass("Password for this account: ")
        if len(password) < 8:
            raise SystemExit("Password must be at least 8 characters.")

    async with async_session() as db:
        source = await _user_by_id(db, args.source_id)
        if not source:
            raise SystemExit(f"Source user not found: {args.source_id}")

        existing = await _user_by_email(db, args.email)
        replacing_user = None
        if existing and str(existing["id"]) != args.source_id:
            if not args.replace_existing_email:
                raise SystemExit(
                    "That email already belongs to another user. "
                    "Use `--replace-existing-email` after reviewing conflicts."
                )
            replacing_user = existing

        tables = await _user_scoped_tables(db)
        source_counts = await _counts(db, args.source_id, tables)
        print(f"Attach source user {args.source_id} to {args.email}")
        _print_counts("Rows that will stay attached to this user:", source_counts)
        if replacing_user:
            target_counts = await _counts(db, str(replacing_user["id"]), tables)
            print(f"Existing target user will be deleted: {replacing_user['id']}")
            _print_counts("Rows that will be deleted with that target user:", target_counts)

        if not args.execute:
            print("DRY RUN only. Re-run with --execute to apply.")
            return

        if replacing_user:
            replacing_user_id = str(replacing_user["id"])
            for table in tables:
                await db.execute(
                    text(f'DELETE FROM "{table}" WHERE user_id = :uid'),  # noqa: S608
                    {"uid": replacing_user_id},
                )
            await db.execute(
                text("DELETE FROM users WHERE id = :uid"),
                {"uid": replacing_user_id},
            )

        await db.execute(
            text("""
                UPDATE users
                SET email = :email,
                    password_hash = :password_hash,
                    display_name = :display_name,
                    provider = 'password',
                    is_active = true,
                    updated_at = now()
                WHERE id = :uid
            """),
            {
                "email": args.email.lower(),
                "password_hash": hash_password(password or ""),
                "display_name": args.display_name or source["display_name"] or args.email.split("@")[0],
                "uid": args.source_id,
            },
        )
        await db.commit()
        print("Done. The existing progress now logs in with this email/password.")


async def transfer(args: argparse.Namespace) -> None:
    async with async_session() as db:
        source = await _user_by_id(db, args.source_id)
        if not source:
            raise SystemExit(f"Source user not found: {args.source_id}")
        target = await _user_by_email(db, args.target_email)
        if not target:
            raise SystemExit(f"Target user not found for email: {args.target_email}")
        target_id = str(target["id"])
        if target_id == args.source_id:
            raise SystemExit("Source and target are the same user; no transfer needed.")

        tables = await _user_scoped_tables(db)
        source_counts = await _counts(db, args.source_id, tables)
        target_counts = await _counts(db, target_id, tables)
        _print_counts(f"Rows currently on source {args.source_id}:", source_counts)
        _print_counts(f"Rows currently on target {target_id}:", target_counts)

        conflicts = {table: count for table, count in target_counts.items() if count}
        if conflicts and not args.replace_target_profile:
            print("Target already has user-scoped data.")
            print("Refusing to merge automatically. Use attach mode, or inspect manually.")
            raise SystemExit(2)

        if not args.execute:
            print("DRY RUN only. Re-run with --execute to apply.")
            return

        # Replace the target's empty scaffold rows only after explicit opt-in.
        if args.replace_target_profile:
            for table in tables:
                await db.execute(
                    text(f'DELETE FROM "{table}" WHERE user_id = :uid'),  # noqa: S608
                    {"uid": target_id},
                )

        for table in tables:
            await db.execute(
                text(f'UPDATE "{table}" SET user_id = :target WHERE user_id = :source'),  # noqa: S608
                {"source": args.source_id, "target": target_id},
            )
        await db.commit()
        print("Done. Source user-scoped rows now belong to the target account.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    attach_parser = sub.add_parser("attach", help="Keep same user_id, set email/password on it.")
    attach_parser.add_argument("--source-id", default=DEMO_USER_ID)
    attach_parser.add_argument("--email", required=True)
    attach_parser.add_argument("--display-name")
    attach_parser.add_argument("--password")
    attach_parser.add_argument("--replace-existing-email", action="store_true")
    attach_parser.add_argument("--execute", action="store_true")

    transfer_parser = sub.add_parser("transfer", help="Move rows to an existing target user.")
    transfer_parser.add_argument("--source-id", default=DEMO_USER_ID)
    transfer_parser.add_argument("--target-email", required=True)
    transfer_parser.add_argument("--replace-target-profile", action="store_true")
    transfer_parser.add_argument("--execute", action="store_true")

    args = parser.parse_args()
    if args.command == "attach":
        asyncio.run(attach(args))
    elif args.command == "transfer":
        asyncio.run(transfer(args))


if __name__ == "__main__":
    main()
