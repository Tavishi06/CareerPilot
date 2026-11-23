import pytest

from app.services.interview_questions import INTERVIEW_QUESTIONS
from app.services.interview_questions import MAX_INTERVIEW_QUESTIONS
from app.services.interview_questions import select_questions
from app.services.skill_analysis import SKILL_TERMS


def test_interview_questions_cover_every_supported_skill():
    assert set(INTERVIEW_QUESTIONS) == set(SKILL_TERMS)


def test_interview_questions_have_unique_ids_and_rubrics():
    question_ids = [question.question_id for question in INTERVIEW_QUESTIONS.values()]

    assert len(question_ids) == len(set(question_ids))
    for question in INTERVIEW_QUESTIONS.values():
        assert question.prompt.endswith("?")
        assert len(question.rubric) >= 3
        assert all(concept.accepted_terms for concept in question.rubric)


def test_select_questions_preserves_skill_priority_and_limits_session_size():
    selected = select_questions(list(INTERVIEW_QUESTIONS))

    assert len(selected) == MAX_INTERVIEW_QUESTIONS
    assert [question.skill for question in selected] == list(
        INTERVIEW_QUESTIONS
    )[:MAX_INTERVIEW_QUESTIONS]


def test_select_questions_removes_duplicate_skills():
    selected = select_questions(["Python", "Python", "SQL"])

    assert [question.skill for question in selected] == ["Python", "SQL"]


@pytest.mark.parametrize("skills", [[], ["Unsupported skill"]])
def test_select_questions_rejects_empty_or_unsupported_skills(skills):
    with pytest.raises(ValueError):
        select_questions(skills)
