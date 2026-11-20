from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_analyze_resume_returns_matched_and_missing_skills():
    response = client.post(
        "/api/v1/analyze",
        json={
            "resume_text": "Built Python and SQL data tools.",
            "job_description": "Looking for Python, SQL, and RAG experience.",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "resume_skills": ["Python", "SQL"],
        "required_skills": ["Python", "RAG", "SQL"],
        "matched_skills": ["Python", "SQL"],
        "missing_skills": ["RAG"],
        "match_percentage": 67,
    }


def test_analyze_resume_rejects_job_description_without_supported_skills():
    response = client.post(
        "/api/v1/analyze",
        json={
            "resume_text": "I enjoy solving problems.",
            "job_description": "A collaborative role with great benefits.",
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "No supported skills were found in the job description."
    )


def test_analyze_resume_rejects_blank_input():
    response = client.post(
        "/api/v1/analyze",
        json={"resume_text": "   ", "job_description": "Python developer"},
    )

    assert response.status_code == 422


def test_skill_matching_does_not_match_substrings():
    response = client.post(
        "/api/v1/analyze",
        json={
            "resume_text": "I enjoy using pythonesque tools.",
            "job_description": "Python developer.",
        },
    )

    assert response.status_code == 200
    assert response.json()["matched_skills"] == []
    assert response.json()["match_percentage"] == 0
