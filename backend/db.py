"""SQLite persistence layer. Single connection per request via context manager."""
from __future__ import annotations
import sqlite3
import json
from pathlib import Path
from typing import Any
from datetime import datetime, timezone

DB_PATH = Path(__file__).parent / "data.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS plans (
    plan_id      TEXT PRIMARY KEY,
    hypothesis   TEXT NOT NULL,
    domain       TEXT NOT NULL,
    parsed       TEXT NOT NULL,
    qc           TEXT NOT NULL,
    plan_payload TEXT,
    created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS corrections (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id         TEXT NOT NULL,
    section         TEXT NOT NULL,
    before_text     TEXT NOT NULL,
    after_text      TEXT NOT NULL,
    rating          INTEGER,
    annotation      TEXT,
    rationale       TEXT NOT NULL,
    hydra_memory_id TEXT,
    domain          TEXT NOT NULL,
    created_at      TEXT NOT NULL,
    FOREIGN KEY (plan_id) REFERENCES plans(plan_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_corrections_plan_id ON corrections(plan_id);
CREATE INDEX IF NOT EXISTS idx_corrections_domain ON corrections(domain);

CREATE TABLE IF NOT EXISTS applied (
    plan_id       TEXT NOT NULL,
    correction_id INTEGER NOT NULL,
    section       TEXT NOT NULL,
    PRIMARY KEY (plan_id, correction_id),
    FOREIGN KEY (plan_id) REFERENCES plans(plan_id) ON DELETE CASCADE,
    FOREIGN KEY (correction_id) REFERENCES corrections(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_applied_correction_id ON applied(correction_id);
"""

_PRAGMAS = (
    "PRAGMA journal_mode=WAL;",
    "PRAGMA foreign_keys=ON;",
    "PRAGMA synchronous=NORMAL;",
)


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, isolation_level=None)
    conn.row_factory = sqlite3.Row
    for p in _PRAGMAS:
        conn.execute(p)
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.executescript(SCHEMA)


def is_ready() -> bool:
    try:
        with _connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception:
        return False


def insert_partial_plan(*, plan_id: str, hypothesis: str, domain: str,
                        parsed: dict, qc: dict) -> None:
    with _connect() as conn:
        conn.execute(
            "INSERT INTO plans (plan_id, hypothesis, domain, parsed, qc, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (plan_id, hypothesis, domain, json.dumps(parsed), json.dumps(qc),
             datetime.now(timezone.utc).isoformat())
        )


def get_plan(plan_id: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute("SELECT * FROM plans WHERE plan_id=?", (plan_id,)).fetchone()
        if not row:
            return None
        return {
            "plan_id": row["plan_id"],
            "hypothesis": row["hypothesis"],
            "domain": row["domain"],
            "parsed": json.loads(row["parsed"]),
            "qc": json.loads(row["qc"]),
            "plan_payload": json.loads(row["plan_payload"]) if row["plan_payload"] else None,
            "created_at": row["created_at"],
        }


def set_plan_payload(plan_id: str, plan_payload: dict) -> None:
    with _connect() as conn:
        conn.execute(
            "UPDATE plans SET plan_payload=? WHERE plan_id=?",
            (json.dumps(plan_payload), plan_id)
        )


def insert_correction(*, plan_id: str, section: str, before_text: str,
                      after_text: str, rating: int | None, annotation: str | None,
                      rationale: str, hydra_memory_id: str | None,
                      domain: str) -> int:
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO corrections (plan_id, section, before_text, after_text, "
            "rating, annotation, rationale, hydra_memory_id, domain, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (plan_id, section, before_text, after_text, rating, annotation,
             rationale, hydra_memory_id, domain,
             datetime.now(timezone.utc).isoformat())
        )
        return cur.lastrowid


def insert_applied(plan_id: str, correction_id: int, section: str) -> None:
    with _connect() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO applied (plan_id, correction_id, section) "
            "VALUES (?, ?, ?)",
            (plan_id, correction_id, section)
        )


def get_correction_by_hydra_id(hydra_memory_id: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM corrections WHERE hydra_memory_id=?",
            (hydra_memory_id,)
        ).fetchone()
        return dict(row) if row else None


def get_lineage(plan_id: str) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT c.*, a.section AS applied_section, "
            "p.domain AS source_domain, p.created_at AS source_created_at "
            "FROM applied a "
            "JOIN corrections c ON c.id = a.correction_id "
            "LEFT JOIN plans p ON p.plan_id = c.plan_id "
            "WHERE a.plan_id = ?",
            (plan_id,)
        ).fetchall()
        return [dict(r) for r in rows]


def get_history(domain: str | None = None, limit: int = 100) -> list[dict]:
    sql = (
        "SELECT c.*, "
        "(SELECT COUNT(*) FROM applied a WHERE a.correction_id = c.id) AS applied_count "
        "FROM corrections c "
    )
    params: list[Any] = []
    if domain:
        sql += "WHERE c.domain = ? "
        params.append(domain)
    sql += "ORDER BY c.created_at DESC LIMIT ?"
    params.append(limit)
    with _connect() as conn:
        return [dict(r) for r in conn.execute(sql, params).fetchall()]
