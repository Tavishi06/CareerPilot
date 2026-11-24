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
    finally:
        connection.close()

    assert database_path.exists()
    assert {
        "id",
        "company",
        "role_title",
        "status",
        "created_at",
        "updated_at",
    }.issubset(columns)


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
