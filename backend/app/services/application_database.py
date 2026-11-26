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
    follow_up_date TEXT,
    status TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)
"""

APPLICATION_STATUS_HISTORY_SCHEMA = """
CREATE TABLE IF NOT EXISTS application_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_at TEXT NOT NULL,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
)
"""


def connect_database(database_path: str | Path | None = None) -> sqlite3.Connection:
    path = Path(database_path or get_settings().database_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(path, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 10000")
    connection.execute(APPLICATIONS_SCHEMA)
    columns = {
        row["name"]
        for row in connection.execute("PRAGMA table_info(applications)")
    }
    if "follow_up_date" not in columns:
        connection.execute(
            "ALTER TABLE applications ADD COLUMN follow_up_date TEXT"
        )
    connection.execute(APPLICATION_STATUS_HISTORY_SCHEMA)
    connection.commit()
    return connection
