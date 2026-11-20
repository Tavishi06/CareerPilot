from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from app.services.skill_analysis import analyze_skills


router = APIRouter(tags=["Analysis"])


class AnalysisRequest(BaseModel):
    resume_text: str
    job_description: str

    @field_validator("resume_text", "job_description")
    @classmethod
    def require_non_whitespace(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Text must not be empty.")
        return value


@router.post("/analyze")
def analyze_resume(request: AnalysisRequest) -> dict[str, object]:
    result = analyze_skills(request.resume_text, request.job_description)
    if not result["required_skills"]:
        raise HTTPException(
            status_code=422,
            detail="No supported skills were found in the job description.",
        )

    return result
