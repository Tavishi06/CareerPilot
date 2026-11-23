import pytest

from app.services.learning_plan import build_learning_plan


def test_learning_plan_estimates_time_and_orders_prerequisites():
    plan = build_learning_plan(["RAG", "Generative AI", "Python"], weekly_hours=5)

    assert [step["skill"] for step in plan["milestones"]] == [
        "Python",
        "Generative AI",
        "RAG",
    ]
    assert plan["weekly_hours"] == 5
    assert plan["total_hours"] == 16
    assert plan["duration_weeks"] == 4
    assert plan["milestones"][0]["start_week"] == 1
    assert plan["milestones"][0]["target_week"] == 1
    assert plan["milestones"][-1]["target_week"] == 4


def test_learning_plan_preserves_job_priority_when_prerequisites_allow():
    plan = build_learning_plan(["SQL", "React"])

    assert [step["skill"] for step in plan["milestones"]] == ["SQL", "React"]


def test_learning_plan_deduplicates_skills_without_double_counting_hours():
    plan = build_learning_plan(["Python", "Python"])

    assert [step["skill"] for step in plan["milestones"]] == ["Python"]
    assert plan["total_hours"] == 5


def test_learning_plan_rejects_unsupported_skills():
    with pytest.raises(ValueError, match="No learning resource is available"):
        build_learning_plan(["Kubernetes"])


def test_learning_plan_rejects_nonpositive_weekly_hours():
    with pytest.raises(ValueError, match="at least 1"):
        build_learning_plan(["Python"], weekly_hours=0)


def test_learning_plan_for_no_skill_gaps_is_empty():
    assert build_learning_plan([]) == {
        "weekly_hours": 5,
        "total_hours": 0,
        "duration_weeks": 0,
        "milestones": [],
    }
