import pytest

from app.services.application_database import connect_database
from app.services.application_tracking import (
    APPLICATION_STATUSES,
    create_application,
    delete_application,
    get_application,
    list_application_status_history,
    list_applications,
    update_application,
)


@pytest.fixture
def connection(tmp_path):
    database = connect_database(tmp_path / "applications.db")
    try:
        yield database
    finally:
        database.close()


def application_fields(**updates):
    fields = {
        "company": "Example Corp",
        "role_title": "Software Engineer",
        "location": None,
        "job_url": None,
        "applied_date": None,
        "follow_up_date": None,
        "status": "wishlist",
        "notes": "",
    }
    fields.update(updates)
    return fields


def test_create_and_get_application(connection):
    created = create_application(connection, application_fields())

    assert created["id"]
    assert created["company"] == "Example Corp"
    assert created["status"] == "wishlist"
    assert created["created_at"] == created["updated_at"]
    assert get_application(connection, created["id"]) == created
    history = list_application_status_history(connection, created["id"])
    assert len(history) == 1
    assert history[0]["previous_status"] is None
    assert history[0]["new_status"] == "wishlist"


def test_list_applications_can_filter_by_status(connection):
    saved = create_application(connection, application_fields(status="applied"))
    create_application(
        connection,
        application_fields(company="Other Corp", status="interviewing"),
    )

    all_applications = list_applications(connection)
    assert {item["id"] for item in all_applications} == {
        saved["id"],
        next(
            item["id"]
            for item in all_applications
            if item["company"] == "Other Corp"
        ),
    }
    assert [item["id"] for item in list_applications(connection, "applied")] == [
        saved["id"]
    ]


def test_update_application_changes_fields_and_updated_timestamp(connection):
    created = create_application(connection, application_fields())

    updated = update_application(
        connection,
        created["id"],
        application_fields(
            status="applied",
            notes="Sent application",
            follow_up_date="2026-12-01",
        ),
    )

    assert updated is not None
    assert updated["status"] == "applied"
    assert updated["notes"] == "Sent application"
    assert updated["follow_up_date"] == "2026-12-01"
    assert updated["created_at"] == created["created_at"]
    assert updated["updated_at"] >= created["updated_at"]
    history = list_application_status_history(connection, created["id"])
    assert len(history) == 2
    assert history[0]["previous_status"] == "wishlist"
    assert history[0]["new_status"] == "applied"


def test_application_history_only_records_actual_status_transitions(connection):
    created = create_application(connection, application_fields())

    update_application(connection, created["id"], application_fields(notes="Notes only"))

    history = list_application_status_history(connection, created["id"])
    assert len(history) == 1


def test_application_status_history_is_removed_with_application(connection):
    created = create_application(connection, application_fields())
    assert list_application_status_history(connection, created["id"])

    assert delete_application(connection, created["id"]) is True
    assert list_application_status_history(connection, created["id"]) == []


def test_update_and_delete_return_not_found_for_unknown_ids(connection):
    assert update_application(
        connection, "missing", application_fields()
    ) is None
    assert delete_application(connection, "missing") is False
    assert get_application(connection, "missing") is None


def test_delete_application_removes_saved_record(connection):
    created = create_application(connection, application_fields())

    assert delete_application(connection, created["id"]) is True
    assert get_application(connection, created["id"]) is None
    assert list_applications(connection) == []


def test_application_statuses_include_full_tracking_lifecycle():
    assert APPLICATION_STATUSES == (
        "wishlist",
        "applied",
        "interviewing",
        "offer",
        "rejected",
        "withdrawn",
    )
