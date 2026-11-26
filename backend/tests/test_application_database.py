import sqlite3

from app.services.application_database import connect_database


def test_connect_database_creates_parent_directory_and_applications_table(tmp_path):
    database_path = tmp_path / "nested" / "careerpilot.db"

    connection = connect_database(database_path)
    try:
        columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(applications)")
        }
        history_columns = {
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(application_status_history)"
            )
        }
    finally:
        connection.close()

    assert database_path.exists()
    assert {
        "id",
        "company",
        "role_title",
        "follow_up_date",
        "status",
        "created_at",
        "updated_at",
    }.issubset(columns)
    assert {
        "id",
        "application_id",
        "previous_status",
        "new_status",
        "changed_at",
    }.issubset(history_columns)


def test_connect_database_reuses_existing_database(tmp_path):
    database_path = tmp_path / "careerpilot.db"

    first_connection = connect_database(database_path)
    first_connection.execute(
        "INSERT INTO applications "
        "(id, company, role_title, status, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        ("app-1", "Example", "Engineer", "wishlist", "2026-11-24", "2026-11-24"),
    )
    first_connection.commit()
    first_connection.close()

    second_connection = connect_database(database_path)
    try:
        row = second_connection.execute(
            "SELECT company, role_title FROM applications WHERE id = ?",
            ("app-1",),
        ).fetchone()
    finally:
        second_connection.close()

    assert row["company"] == "Example"
    assert row["role_title"] == "Engineer"


def test_connect_database_adds_follow_up_date_to_existing_schema(tmp_path):
    database_path = tmp_path / "legacy.db"
    legacy_connection = sqlite3.connect(database_path)
    legacy_connection.execute(
        """
        CREATE TABLE applications (
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
    )
    legacy_connection.execute(
        """
        INSERT INTO applications (
            id, company, role_title, status, created_at, updated_at
        ) VALUES ('legacy-1', 'Example', 'Engineer', 'applied', 'now', 'now')
        """
    )
    legacy_connection.commit()
    legacy_connection.close()

    connection = connect_database(database_path)
    try:
        columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(applications)")
        }
        application = connection.execute(
            "SELECT id, company, follow_up_date FROM applications "
            "WHERE id = 'legacy-1'"
        ).fetchone()
    finally:
        connection.close()

    assert "follow_up_date" in columns
    assert application["company"] == "Example"
    assert application["follow_up_date"] is None
