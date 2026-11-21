from io import BytesIO

from fastapi.testclient import TestClient
from pypdf import PdfWriter

from app.main import app
from app.services.resume_pdf import extract_resume_text


client = TestClient(app)


def make_pdf(text: str, pages: int = 1) -> bytes:
    writer = PdfWriter()
    for _ in range(pages):
        writer.add_blank_page(width=612, height=792)

    if text:
        from pypdf.generic import (
            DecodedStreamObject,
            DictionaryObject,
            NameObject,
        )

        page = writer.pages[0]
        content = DecodedStreamObject()
        content.set_data(f"BT /F1 12 Tf 72 720 Td ({text}) Tj ET".encode())
        page[NameObject("/Contents")] = content
        page[NameObject("/Resources")] = DictionaryObject(
            {
                NameObject("/Font"): DictionaryObject(
                    {
                        NameObject("/F1"): DictionaryObject(
                            {
                                NameObject("/Type"): NameObject("/Font"),
                                NameObject("/Subtype"): NameObject("/Type1"),
                                NameObject("/BaseFont"): NameObject("/Helvetica"),
                            }
                        )
                    }
                )
            }
        )

    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def test_extract_resume_text_reads_selectable_pdf_text():
    assert extract_resume_text(make_pdf("Python and SQL")) == "Python and SQL"


def test_extract_resume_text_rejects_non_pdf_content():
    response = client.post(
        "/api/v1/resume/extract",
        files={"file": ("resume.pdf", b"not a pdf", "application/pdf")},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "The uploaded file is not a valid PDF."


def test_extract_resume_text_rejects_scanned_or_blank_pdf():
    response = client.post(
        "/api/v1/resume/extract",
        files={"file": ("resume.pdf", make_pdf(""), "application/pdf")},
    )

    assert response.status_code == 422
    assert "No selectable text" in response.json()["detail"]


def test_extract_resume_rejects_non_pdf_filename():
    response = client.post(
        "/api/v1/resume/extract",
        files={"file": ("resume.txt", b"resume", "text/plain")},
    )

    assert response.status_code == 415


def test_extract_resume_rejects_files_over_size_limit():
    response = client.post(
        "/api/v1/resume/extract",
        files={
            "file": (
                "resume.pdf",
                b"%PDF-" + b"x" * (5 * 1024 * 1024),
                "application/pdf",
            )
        },
    )

    assert response.status_code == 413


def test_extract_resume_rejects_pdfs_over_page_limit():
    response = client.post(
        "/api/v1/resume/extract",
        files={
            "file": (
                "resume.pdf",
                make_pdf("", pages=21),
                "application/pdf",
            )
        },
    )

    assert response.status_code == 422
    assert "no more than 20 pages" in response.json()["detail"]
