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
calculates a keyword-based match percentage. For identified skill gaps, it
creates a prerequisite-aware learning roadmap with curated resources, estimated
study time, and target weeks based on your weekly availability. This is a
transparent baseline, not an AI assessment or a substitute for reviewing the
source documents.

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
`job_description` strings, plus an optional `weekly_hours` value from 1 to 40
(default: 5). It returns detected skills, matched skills, gaps, a percentage
based on supported skills found in the job description, and a learning plan.

The standalone `POST /api/v1/learning-plan` endpoint accepts a `missing_skills`
array and optional `weekly_hours` value. The frontend displays the roadmap,
lets you mark milestones complete, and can download it as a CSV. Completion
state is stored only in your browser's local storage; it is not synced between
devices or users. Resource durations and target weeks are estimates.

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