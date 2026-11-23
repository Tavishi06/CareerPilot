from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.services.interview_evaluation import evaluate_answer
from app.services.interview_questions import (
    MAX_INTERVIEW_QUESTIONS,
    select_questions,
)


router = APIRouter(tags=["Mock Interview"])


class InterviewQuestionRequest(BaseModel):
    skills: list[str] = Field(min_length=1, max_length=13)

    @field_validator("skills")
    @classmethod
    def normalize_skills(cls, skills: list[str]) -> list[str]:
        normalized = [skill.strip() for skill in skills]
        if any(not skill for skill in normalized):
            raise ValueError("Skill names must not be blank.")
        return normalized


class InterviewQuestionItem(BaseModel):
    question_id: str
    skill: str
    prompt: str


class InterviewQuestionSet(BaseModel):
    questions: list[InterviewQuestionItem] = Field(
        max_length=MAX_INTERVIEW_QUESTIONS
    )


class InterviewAnswerRequest(BaseModel):
    question_id: str = Field(min_length=1)
    answer: str = Field(min_length=1, max_length=5000)

    @field_validator("question_id", "answer")
    @classmethod
    def require_non_whitespace(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field must not be blank.")
        return value


class InterviewEvaluationResponse(BaseModel):
    question_id: str
    skill: str
    score: int = Field(ge=0, le=100)
    matched_concepts: list[str]
    missing_concepts: list[str]
    feedback: str


@router.post(
    "/mock-interview/questions",
    response_model=InterviewQuestionSet,
)
def create_interview_questions(
    request: InterviewQuestionRequest,
) -> InterviewQuestionSet:
    try:
        questions = select_questions(request.skills)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return InterviewQuestionSet(
        questions=[
            InterviewQuestionItem(
                question_id=question.question_id,
                skill=question.skill,
                prompt=question.prompt,
            )
            for question in questions
        ]
    )


@router.post(
    "/mock-interview/evaluate",
    response_model=InterviewEvaluationResponse,
)
def evaluate_interview_answer(
    request: InterviewAnswerRequest,
) -> InterviewEvaluationResponse:
    try:
        result = evaluate_answer(request.question_id, request.answer)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    return InterviewEvaluationResponse.model_validate(result)
