from app.services.interview_questions import INTERVIEW_QUESTIONS
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
