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
        "learning_plan": {
            "weekly_hours": 5,
            "total_hours": 5,
            "duration_weeks": 1,
            "milestones": [
                {
                    "sequence": 1,
                    "skill": "RAG",
                    "title": "LangChain RAG Tutorial",
                    "url": "https://python.langchain.com/docs/tutorials/rag/",
                    "objective": "Build a retrieval-augmented question-answering prototype.",
                    "estimated_hours": 5,
                    "start_week": 1,
                    "target_week": 1,
                }
            ],
        },
    }


def test_analyze_resume_includes_empty_plan_when_all_skills_match():
    response = client.post(
        "/api/v1/analyze",
        json={
            "resume_text": "Python and SQL",
            "job_description": "Python and SQL",
        },
    )

    assert response.status_code == 200
    assert response.json()["learning_plan"]["milestones"] == []


def test_analyze_resume_accepts_weekly_study_hours():
    response = client.post(
        "/api/v1/analyze",
        json={
            "resume_text": "Python",
            "job_description": "Python and SQL",
            "weekly_hours": 2,
        },
    )

    assert response.status_code == 200
    plan = response.json()["learning_plan"]
    assert plan["weekly_hours"] == 2
    assert plan["duration_weeks"] == 2


def test_analyze_resume_rejects_invalid_weekly_study_hours():
    response = client.post(
        "/api/v1/analyze",
        json={
            "resume_text": "Python",
            "job_description": "Python and SQL",
            "weekly_hours": 41,
        },
    )

    assert response.status_code == 422


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
