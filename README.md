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

## Status

Day 1: Project foundation and API connectivity.

## Local Development

### Backend

```powershell
cd backend
python -m uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Interactive docs are available at
`http://127.0.0.1:8000/docs`.

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