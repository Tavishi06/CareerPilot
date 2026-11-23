from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.api.routes.learning_plan import LearningPlanResponse
from app.services.learning_plan import build_learning_plan
from app.services.skill_analysis import analyze_skills


router = APIRouter(tags=["Analysis"])


class AnalysisRequest(BaseModel):
    resume_text: str
    job_description: str
    weekly_hours: int = Field(default=5, ge=1, le=40)

    @field_validator("resume_text", "job_description")
    @classmethod
    def require_non_whitespace(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Text must not be empty.")
        return value


class AnalysisResponse(BaseModel):
    resume_skills: list[str]
    required_skills: list[str]
    matched_skills: list[str]
    missing_skills: list[str]
    match_percentage: int = Field(ge=0, le=100)
    learning_plan: LearningPlanResponse


@router.post("/analyze")
def analyze_resume(request: AnalysisRequest) -> AnalysisResponse:
    result = analyze_skills(request.resume_text, request.job_description)
    if not result["required_skills"]:
        raise HTTPException(
            status_code=422,
            detail="No supported skills were found in the job description.",
        )

    learning_plan = build_learning_plan(
        result["missing_skills"],
        weekly_hours=request.weekly_hours,
    )
    return AnalysisResponse(
        **result,
        learning_plan=LearningPlanResponse.model_validate(learning_plan),
    )
