import pytest
from fastapi.testclient import TestClient

from app.api.routes.applications import get_application_connection
from app.main import app
from app.services.application_database import connect_database


client = TestClient(app)


@pytest.fixture
def application_database(tmp_path):
    database_path = tmp_path / "applications.db"

    def override_connection():
        connection = connect_database(database_path)
        try:
            yield connection
        finally:
            connection.close()

    app.dependency_overrides[get_application_connection] = override_connection
    try:
        yield
    finally:
        app.dependency_overrides.pop(get_application_connection, None)


def valid_application(**updates):
    application = {
        "company": "Example Corp",
        "role_title": "Software Engineer",
        "location": "Remote",
        "job_url": "https://example.com/jobs/123",
        "applied_date": "2026-11-24",
        "status": "applied",
        "notes": "Follow up next week.",
    }
    application.update(updates)
    return application


def test_create_and_list_applications(application_database):
    created_response = client.post(
        "/api/v1/applications",
        json=valid_application(),
    )

    assert created_response.status_code == 201
    created = created_response.json()
    assert created["company"] == "Example Corp"
    assert created["status"] == "applied"
    assert created["applied_date"] == "2026-11-24"
    assert client.get("/api/v1/applications").json() == [created]


def test_application_status_filter(application_database):
    applied = client.post(
        "/api/v1/applications",
        json=valid_application(),
    ).json()
    client.post(
        "/api/v1/applications",
        json=valid_application(company="Other Corp", status="wishlist"),
    )

    response = client.get(
        "/api/v1/applications",
        params={"status": "applied"},
    )

    assert response.status_code == 200
    assert [item["id"] for item in response.json()] == [applied["id"]]


def test_get_update_and_delete_application(application_database):
    created = client.post(
        "/api/v1/applications",
        json=valid_application(),
    ).json()
    item_url = f"/api/v1/applications/{created['id']}"

    assert client.get(item_url).json()["id"] == created["id"]
    updated_response = client.put(
        item_url,
        json=valid_application(status="interviewing", notes="Phone screen scheduled."),
    )
    assert updated_response.status_code == 200
    assert updated_response.json()["status"] == "interviewing"
    assert updated_response.json()["notes"] == "Phone screen scheduled."

    deleted_response = client.delete(item_url)
    assert deleted_response.status_code == 204
    assert client.get(item_url).status_code == 404


def test_application_routes_return_not_found_for_unknown_records(application_database):
    missing_url = "/api/v1/applications/not-found"

    assert client.get(missing_url).status_code == 404
    assert client.put(missing_url, json=valid_application()).status_code == 404
    assert client.delete(missing_url).status_code == 404


@pytest.mark.parametrize(
    "payload",
    [
        valid_application(company="   "),
        valid_application(role_title=" "),
        valid_application(status="in_progress"),
        valid_application(job_url="javascript:alert(1)"),
        valid_application(applied_date="not-a-date"),
    ],
)
def test_create_application_rejects_invalid_fields(application_database, payload):
    assert client.post("/api/v1/applications", json=payload).status_code == 422
