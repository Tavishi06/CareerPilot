from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

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
