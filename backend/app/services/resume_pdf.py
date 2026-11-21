from io import BytesIO

from pypdf import PdfReader
from pypdf.errors import PdfReadError


MAX_RESUME_PAGES = 20


class ResumePdfError(ValueError):
    pass


def extract_resume_text(content: bytes) -> str:
    if not content.startswith(b"%PDF-"):
        raise ResumePdfError("The uploaded file is not a valid PDF.")

    try:
        reader = PdfReader(BytesIO(content))
        if reader.is_encrypted:
            raise ResumePdfError("Password-protected PDFs are not supported.")
        if len(reader.pages) > MAX_RESUME_PAGES:
            raise ResumePdfError(
                f"PDFs must contain no more than {MAX_RESUME_PAGES} pages."
            )

        text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except PdfReadError as error:
        raise ResumePdfError("The uploaded PDF could not be read.") from error

    if not text:
        raise ResumePdfError(
            "No selectable text was found. Scanned PDFs are not supported yet."
        )

    return text
