import sqlite3
from collections.abc import Iterator
from datetime import date
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import AnyHttpUrl, BaseModel, Field, field_validator

from app.services.application_database import connect_database
from app.services.application_tracking import (
    create_application,
    delete_application,
    get_application,
    list_applications,
    list_application_status_history,
    update_application,
)


router = APIRouter(prefix="/applications", tags=["Applications"])


class ApplicationStatus(str, Enum):
    wishlist = "wishlist"
    applied = "applied"
    interviewing = "interviewing"
    offer = "offer"
    rejected = "rejected"
    withdrawn = "withdrawn"


class ApplicationInput(BaseModel):
    company: str = Field(min_length=1, max_length=120)
    role_title: str = Field(min_length=1, max_length=160)
    location: str | None = Field(default=None, max_length=160)
    job_url: AnyHttpUrl | None = None
    applied_date: date | None = None
    follow_up_date: date | None = None
    status: ApplicationStatus = ApplicationStatus.wishlist
    notes: str = Field(default="", max_length=5000)

    @field_validator("company", "role_title")
    @classmethod
    def require_non_whitespace(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field must not be blank.")
        return value

    @field_validator("location", "notes")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return value.strip()


class ApplicationRecord(BaseModel):
    id: str
    company: str
    role_title: str
    location: str | None
    job_url: str | None
    applied_date: date | None
    follow_up_date: date | None
    status: ApplicationStatus
    notes: str
    created_at: str
    updated_at: str


class ApplicationStatusHistoryRecord(BaseModel):
    id: int
    application_id: str
    previous_status: ApplicationStatus | None
    new_status: ApplicationStatus
    changed_at: str


def get_application_connection() -> Iterator[sqlite3.Connection]:
    connection = connect_database()
    try:
        yield connection
    finally:
        connection.close()


def _input_values(application: ApplicationInput) -> dict[str, object]:
    return application.model_dump(mode="json")


@router.get("", response_model=list[ApplicationRecord])
def get_applications(
    application_status: ApplicationStatus | None = Query(default=None, alias="status"),
    connection: sqlite3.Connection = Depends(get_application_connection),
) -> list[dict[str, object]]:
    return list_applications(connection, status=application_status)


@router.post(
    "",
    response_model=ApplicationRecord,
    status_code=status.HTTP_201_CREATED,
)
def add_application(
    application: ApplicationInput,
    connection: sqlite3.Connection = Depends(get_application_connection),
) -> dict[str, object]:
    return create_application(connection, _input_values(application))


@router.get("/{application_id}", response_model=ApplicationRecord)
def get_application_by_id(
    application_id: str,
    connection: sqlite3.Connection = Depends(get_application_connection),
) -> dict[str, object]:
    application = get_application(connection, application_id)
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )
    return application


@router.get(
    "/{application_id}/history",
    response_model=list[ApplicationStatusHistoryRecord],
)
def get_application_history(
    application_id: str,
    connection: sqlite3.Connection = Depends(get_application_connection),
) -> list[dict[str, object]]:
    if get_application(connection, application_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )
    return list_application_status_history(connection, application_id)


@router.put("/{application_id}", response_model=ApplicationRecord)
def replace_application(
    application_id: str,
    application: ApplicationInput,
    connection: sqlite3.Connection = Depends(get_application_connection),
) -> dict[str, object]:
    updated = update_application(
        connection,
        application_id,
        _input_values(application),
    )
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )
    return updated


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_application(
    application_id: str,
    connection: sqlite3.Connection = Depends(get_application_connection),
) -> Response:
    if not delete_application(connection, application_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
