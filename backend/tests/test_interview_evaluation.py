import pytest

from app.services.interview_evaluation import evaluate_answer


def test_evaluate_answer_recognizes_each_python_rubric_concept():
    result = evaluate_answer(
        "python-mutable-default",
        "Defaults are evaluated once at function definition, so the same mutable "
        "list is shared. I use a None sentinel and create a new list per call.",
    )

    assert result["score"] == 100
    assert result["missing_concepts"] == []
    assert len(result["matched_concepts"]) == 3
    assert "covered all rubric concepts" in result["feedback"]


def test_evaluate_answer_returns_actionable_feedback_for_partial_answer():
    result = evaluate_answer(
        "ml-overfitting",
        "This sounds like overfitting. I would check a validation set.",
    )

    assert result["score"] == 67
    assert result["missing_concepts"] == ["Reduce complexity or regularize"]
    assert "Consider adding" in result["feedback"]


def test_evaluate_answer_handles_blank_answer():
    result = evaluate_answer("sql-index-tradeoff", "")

    assert result["score"] == 0
    assert len(result["missing_concepts"]) == 3
    assert "Add an answer" in result["feedback"]


def test_evaluate_answer_rejects_unknown_question():
    with pytest.raises(ValueError, match="Unknown interview question"):
        evaluate_answer("unknown", "An answer")
