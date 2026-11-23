from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.services.learning_plan import build_learning_plan


router = APIRouter(tags=["Learning Plan"])


class LearningPlanRequest(BaseModel):
    missing_skills: list[str] = Field(default_factory=list)
    weekly_hours: int = Field(default=5, ge=1, le=40)

    @field_validator("missing_skills")
    @classmethod
    def normalize_skills(cls, skills: list[str]) -> list[str]:
        normalized = [skill.strip() for skill in skills]
        if any(not skill for skill in normalized):
            raise ValueError("Skill names must not be blank.")
        return normalized


@router.post("/learning-plan")
def create_learning_plan(
    request: LearningPlanRequest,
) -> dict[str, object]:
    try:
        return build_learning_plan(
            request.missing_skills,
            weekly_hours=request.weekly_hours,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
