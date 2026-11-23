import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.routes.analysis import router as analysis_router
from app.api.routes.health import router as health_router
from app.api.routes.interview import router as interview_router
from app.api.routes.learning_plan import router as learning_plan_router
from app.api.routes.resume import router as resume_router


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Agentic AI Career and Interview Preparation Platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    health_router,
    prefix="/api/v1"
)

app.include_router(
    analysis_router,
    prefix="/api/v1"
)

app.include_router(
    resume_router,
    prefix="/api/v1"
)

app.include_router(
    learning_plan_router,
    prefix="/api/v1"
)

app.include_router(
    interview_router,
    prefix="/api/v1"
)


@app.get("/")
def root():
    return {
        "message": "CareerPilot AI API is running"
    }