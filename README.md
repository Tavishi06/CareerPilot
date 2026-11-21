# CareerPilot AI

An Agentic AI-powered career and interview preparation platform.

## Problem

Students often struggle to understand job requirements,
identify skill gaps and prepare for real internship opportunities.

## Core Feature

Real Job Application Intelligence:

- Resume and job description analysis
- Evidence-based skill matching
- Skill gap identification
- Truthful resume improvement recommendations
- Job-specific interview preparation
- Application tracking

## Technology Stack

- React
- Tailwind CSS
- Python
- FastAPI
- Gemini API
- LangGraph
- ChromaDB
- PostgreSQL

## Project Structure

- frontend/ - React application
- backend/ - FastAPI application

## Current MVP

The first working feature compares resume text with a job description. You can
paste the resume text directly or upload a PDF and review the extracted text.
The analysis identifies supported skills, shows matches and gaps, and
calculates a keyword-based match percentage. This is a transparent baseline,
not an AI assessment or a substitute for reviewing the source documents.

Supported skill terms currently include Python, SQL, machine learning,
generative AI, RAG, FastAPI, React, Git, Docker, AWS, statistics, communication,
and data analysis.

## Local Development

### Backend

```powershell
cd backend
python -m uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Interactive docs are available at
`http://127.0.0.1:8000/docs`.

The analysis endpoint is `POST /api/v1/analyze`. It accepts `resume_text` and
`job_description` strings and returns detected skills, matched skills, gaps,
and a percentage based on supported skills found in the job description.

Resume PDFs can be uploaded to `POST /api/v1/resume/extract` as multipart form
data using the `file` field. The endpoint returns extracted selectable text,
which can then be checked and edited in the frontend before analysis. Uploads
are limited to 5 MB and 20 pages. Password-protected PDFs and scanned/image-only
PDFs are not supported yet; scanned documents need OCR, which is not included.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

### Automated Checks

```powershell
cd backend
python -m pytest -v

cd ../frontend
npm run build
npm run lint
```