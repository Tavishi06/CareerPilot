from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_learning_plan_endpoint_returns_scheduled_milestones():
    response = client.post(
        "/api/v1/learning-plan",
        json={"missing_skills": ["RAG", "Generative AI", "Python"], "weekly_hours": 5},
    )

    assert response.status_code == 200
    data = response.json()
    assert [step["skill"] for step in data["milestones"]] == [
        "Python",
        "Generative AI",
        "RAG",
    ]
    assert data["total_hours"] == 16
    assert data["duration_weeks"] == 4


def test_learning_plan_endpoint_returns_empty_plan_when_no_skills_are_missing():
    response = client.post("/api/v1/learning-plan", json={"missing_skills": []})

    assert response.status_code == 200
    assert response.json()["milestones"] == []
    assert response.json()["duration_weeks"] == 0


def test_learning_plan_endpoint_rejects_unsupported_skills():
    response = client.post(
        "/api/v1/learning-plan",
        json={"missing_skills": ["Kubernetes"]},
    )

    assert response.status_code == 422
    assert "No learning resource is available" in response.json()["detail"]


def test_learning_plan_endpoint_rejects_out_of_range_weekly_hours():
    response = client.post(
        "/api/v1/learning-plan",
        json={"missing_skills": ["Python"], "weekly_hours": 41},
    )

    assert response.status_code == 422


def test_learning_plan_endpoint_rejects_blank_skill_names():
    response = client.post(
        "/api/v1/learning-plan",
        json={"missing_skills": ["  "]},
    )

    assert response.status_code == 422
