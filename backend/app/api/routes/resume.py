from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.resume_pdf import (
    ResumePdfError,
    extract_resume_text,
)


router = APIRouter(tags=["Resume"])
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


@router.post("/resume/extract")
async def extract_resume(file: UploadFile = File(...)) -> dict[str, object]:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Upload a PDF resume.")

    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Resume PDFs must be 5 MB or smaller.",
        )

    try:
        text = extract_resume_text(content)
    except ResumePdfError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return {"text": text}
