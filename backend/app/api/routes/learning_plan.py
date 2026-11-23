from fastapi import APIRouter, HTTPException
from pydantic import AnyHttpUrl, BaseModel, Field, field_validator

from app.services.learning_plan import build_learning_plan


router = APIRouter(tags=["Learning Plan"])


class LearningMilestone(BaseModel):
    sequence: int = Field(ge=1)
    skill: str
    title: str
    url: AnyHttpUrl
    objective: str
    estimated_hours: int = Field(ge=1)
    start_week: int = Field(ge=1)
    target_week: int = Field(ge=1)


class LearningPlanResponse(BaseModel):
    weekly_hours: int = Field(ge=1, le=40)
    total_hours: int = Field(ge=0)
    duration_weeks: int = Field(ge=0)
    milestones: list[LearningMilestone]


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


@router.post(
    "/learning-plan",
    response_model=LearningPlanResponse,
)
def create_learning_plan(
    request: LearningPlanRequest,
) -> LearningPlanResponse:
    try:
        return LearningPlanResponse.model_validate(
            build_learning_plan(
                request.missing_skills,
                weekly_hours=request.weekly_hours,
            )
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
