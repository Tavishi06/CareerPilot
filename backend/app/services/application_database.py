import sqlite3
from pathlib import Path

from app.core.config import get_settings


APPLICATIONS_SCHEMA = """
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    role_title TEXT NOT NULL,
    location TEXT,
    job_url TEXT,
    applied_date TEXT,
    status TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)
"""


def connect_database(database_path: str | Path | None = None) -> sqlite3.Connection:
    path = Path(database_path or get_settings().database_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(path, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA busy_timeout = 10000")
    connection.execute(APPLICATIONS_SCHEMA)
    connection.commit()
    return connection
