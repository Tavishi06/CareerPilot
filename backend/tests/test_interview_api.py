from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_mock_interview_endpoint_returns_prioritized_questions():
    response = client.post(
        "/api/v1/mock-interview/questions",
        json={"skills": ["RAG", "Python", "SQL"]},
    )

    assert response.status_code == 200
    questions = response.json()["questions"]
    assert [question["skill"] for question in questions] == [
        "RAG",
        "Python",
        "SQL",
    ]
    assert all("rubric" not in question for question in questions)


def test_mock_interview_endpoint_caps_questions_per_session():
    response = client.post(
        "/api/v1/mock-interview/questions",
        json={"skills": ["Python", "SQL", "React", "Git", "Docker", "AWS"]},
    )

    assert response.status_code == 200
    assert len(response.json()["questions"]) == 5


def test_mock_interview_endpoint_rejects_unsupported_skills():
    response = client.post(
        "/api/v1/mock-interview/questions",
        json={"skills": ["Kubernetes"]},
    )

    assert response.status_code == 422
    assert "No interview question is available" in response.json()["detail"]


def test_mock_interview_endpoint_rejects_blank_skill_names():
    response = client.post(
        "/api/v1/mock-interview/questions",
        json={"skills": [" "]},
    )

    assert response.status_code == 422


def test_mock_interview_endpoint_requires_at_least_one_skill():
    response = client.post(
        "/api/v1/mock-interview/questions",
        json={"skills": []},
    )

    assert response.status_code == 422


def test_mock_interview_evaluation_returns_score_and_explanation():
    response = client.post(
        "/api/v1/mock-interview/evaluate",
        json={
            "question_id": "python-mutable-default",
            "answer": (
                "Defaults are evaluated once at function definition. The same "
                "mutable list is shared, so use a None sentinel and create a new list."
            ),
        },
    )

    assert response.status_code == 200
    assert response.json()["score"] == 100
    assert response.json()["missing_concepts"] == []
    assert len(response.json()["matched_concepts"]) == 3


def test_mock_interview_evaluation_rejects_blank_answers():
    response = client.post(
        "/api/v1/mock-interview/evaluate",
        json={"question_id": "python-mutable-default", "answer": "  "},
    )

    assert response.status_code == 422


def test_mock_interview_evaluation_rejects_unknown_question():
    response = client.post(
        "/api/v1/mock-interview/evaluate",
        json={"question_id": "unknown", "answer": "Some answer"},
    )

    assert response.status_code == 404


def test_mock_interview_evaluation_limits_answer_size():
    response = client.post(
        "/api/v1/mock-interview/evaluate",
        json={
            "question_id": "python-mutable-default",
            "answer": "x" * 5001,
        },
    )

    assert response.status_code == 422
