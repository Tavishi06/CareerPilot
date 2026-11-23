import re

from app.services.interview_questions import INTERVIEW_QUESTIONS


def _contains_term(answer: str, term: str) -> bool:
    return re.search(rf"(?<!\w){re.escape(term.casefold())}(?!\w)", answer) is not None


def evaluate_answer(question_id: str, answer: str) -> dict[str, object]:
    question = next(
        (
            item
            for item in INTERVIEW_QUESTIONS.values()
            if item.question_id == question_id
        ),
        None,
    )
    if question is None:
        raise ValueError(f"Unknown interview question: {question_id}")

    normalized_answer = answer.casefold()
    matched_concepts = [
        concept.label
        for concept in question.rubric
        if any(
            _contains_term(normalized_answer, term)
            for term in concept.accepted_terms
        )
    ]
    missing_concepts = [
        concept.label
        for concept in question.rubric
        if concept.label not in matched_concepts
    ]
    score = round(len(matched_concepts) / len(question.rubric) * 100)

    if not normalized_answer.strip():
        feedback = "Add an answer in your own words, then review the key concepts below."
    elif not missing_concepts:
        feedback = (
            "Your answer covered all rubric concepts. Try supporting each point "
            "with a concrete example."
        )
    else:
        feedback = (
            f"Your answer covered {len(matched_concepts)} of "
            f"{len(question.rubric)} rubric concepts. Consider adding: "
            + "; ".join(missing_concepts)
            + "."
        )

    return {
        "question_id": question.question_id,
        "skill": question.skill,
        "score": score,
        "matched_concepts": matched_concepts,
        "missing_concepts": missing_concepts,
        "feedback": feedback,
    }
