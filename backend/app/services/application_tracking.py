import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any


APPLICATION_STATUSES = (
    "wishlist",
    "applied",
    "interviewing",
    "offer",
    "rejected",
    "withdrawn",
)

APPLICATION_FIELDS = (
    "company",
    "role_title",
    "location",
    "job_url",
    "applied_date",
    "follow_up_date",
    "status",
    "notes",
)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def list_applications(
    connection: sqlite3.Connection, status: str | None = None
) -> list[dict[str, Any]]:
    if status is None:
        rows = connection.execute(
            "SELECT * FROM applications ORDER BY updated_at DESC, id"
        ).fetchall()
    else:
        rows = connection.execute(
            "SELECT * FROM applications WHERE status = ? "
            "ORDER BY updated_at DESC, id",
            (status,),
        ).fetchall()
    return [dict(row) for row in rows]


def get_application(
    connection: sqlite3.Connection, application_id: str
) -> dict[str, Any] | None:
    row = connection.execute(
        "SELECT * FROM applications WHERE id = ?",
        (application_id,),
    ).fetchone()
    return dict(row) if row is not None else None


def create_application(
    connection: sqlite3.Connection, fields: dict[str, Any]
) -> dict[str, Any]:
    application_id = str(uuid.uuid4())
    now = _utc_now()
    values = {field: fields.get(field) for field in APPLICATION_FIELDS}
    values["notes"] = values["notes"] or ""

    connection.execute(
        """
        INSERT INTO applications (
            id, company, role_title, location, job_url, applied_date, follow_up_date,
            status, notes, created_at, updated_at
        ) VALUES (
            :id, :company, :role_title, :location, :job_url, :applied_date, :follow_up_date,
            :status, :notes, :created_at, :updated_at
        )
        """,
        {"id": application_id, **values, "created_at": now, "updated_at": now},
    )
    connection.commit()
    application = get_application(connection, application_id)
    if application is None:
        raise RuntimeError("Created application could not be loaded.")
    return application


def update_application(
    connection: sqlite3.Connection,
    application_id: str,
    fields: dict[str, Any],
) -> dict[str, Any] | None:
    values = {field: fields.get(field) for field in APPLICATION_FIELDS}
    values["notes"] = values["notes"] or ""
    cursor = connection.execute(
        """
        UPDATE applications
        SET company = :company,
            role_title = :role_title,
            location = :location,
            job_url = :job_url,
            applied_date = :applied_date,
            follow_up_date = :follow_up_date,
            status = :status,
            notes = :notes,
            updated_at = :updated_at
        WHERE id = :id
        """,
        {
            "id": application_id,
            **values,
            "updated_at": _utc_now(),
        },
    )
    connection.commit()
    if cursor.rowcount == 0:
        return None
    return get_application(connection, application_id)


def delete_application(
    connection: sqlite3.Connection, application_id: str
) -> bool:
    cursor = connection.execute(
        "DELETE FROM applications WHERE id = ?",
        (application_id,),
    )
    connection.commit()
    return cursor.rowcount > 0
