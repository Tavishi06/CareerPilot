import { useCallback, useEffect, useState } from "react";
import {
  createInterviewSession,
  MAX_SAVED_INTERVIEWS,
  readInterviewHistory,
  saveInterviewHistory as persistInterviewHistory,
} from "./interviewHistory.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const PROGRESS_STORAGE_KEY = "careerpilot.completedSkills";

export default function App() {
  const [apiStatus, setApiStatus] = useState("checking");
  const [apiMessage, setApiMessage] = useState(
    "Connecting to CareerPilot backend..."
  );
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeExtractStatus, setResumeExtractStatus] = useState("idle");
  const [resumeExtractError, setResumeExtractError] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [analysis, setAnalysis] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle");
  const [analysisError, setAnalysisError] = useState("");
  const [progress, setProgress] = useState(loadProgress);
  const completedSkills = progress.skills;
  const [interviewHistory, setInterviewHistory] = useState(
    loadSavedInterviewHistory
  );

  const checkApi = useCallback(async () => {
    setApiStatus("checking");

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/health`);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      setApiStatus("online");
      setApiMessage(`${data.app} · v${data.version}`);
    } catch {
      setApiStatus("offline");
      setApiMessage(
        "Backend not reachable. Start the FastAPI server and retry."
      );
    }
  }, []);

  useEffect(() => {
    const initialCheck = window.setTimeout(checkApi, 0);

    return () => window.clearTimeout(initialCheck);
  }, [checkApi]);

  const handleExtractResume = async () => {
    if (!resumeFile) {
      return;
    }

    setResumeExtractStatus("loading");
    setResumeExtractError("");

    try {
      const formData = new FormData();
      formData.append("file", resumeFile);
      const response = await fetch(`${API_BASE_URL}/api/v1/resume/extract`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Resume extraction failed (${response.status}).`);
      }

      setResumeText(data.text);
      setResumeExtractStatus("success");
    } catch (error) {
      setResumeExtractError(
        error instanceof Error ? error.message : "Resume extraction could not be completed."
      );
      setResumeExtractStatus("error");
    }
  };

  const handleAnalyze = async (event) => {
    event.preventDefault();
    setAnalysisStatus("loading");
    setAnalysisError("");
    setAnalysis(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription,
          weekly_hours: weeklyHours,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Analysis failed (${response.status}).`);
      }

      setAnalysis(data);
      setAnalysisStatus("success");
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "Analysis could not be completed."
      );
      setAnalysisStatus("error");
    }
  };

  const toggleMilestone = (skill) => {
    const nextSkills = new Set(completedSkills);
    if (nextSkills.has(skill)) {
      nextSkills.delete(skill);
    } else {
      nextSkills.add(skill);
    }

    try {
      window.localStorage.setItem(
        PROGRESS_STORAGE_KEY,
        JSON.stringify([...nextSkills])
      );
      setProgress({ skills: nextSkills, error: "" });
    } catch {
      setProgress({
        skills: nextSkills,
        error: "Progress could not be saved in this browser.",
      });
    }
  };

  const recordInterviewSession = (evaluations) => {
    let sessions = interviewHistory.sessions;
    try {
      const session = createInterviewSession(evaluations, {
        id: window.crypto.randomUUID(),
        completedAt: new Date().toISOString(),
      });
      sessions = [session, ...sessions].slice(0, MAX_SAVED_INTERVIEWS);
      const savedSessions = persistInterviewHistory(
        window.localStorage,
        sessions
      );
      setInterviewHistory({ sessions: savedSessions, error: "" });
    } catch {
      setInterviewHistory({
        sessions,
        error: "Interview results could not be saved in this browser.",
      });
    }
  };

  const isOnline = apiStatus === "online";

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <a href="#" className="flex items-center gap-3 text-inherit no-underline">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 text-xl font-bold">
            C
          </div>
          <div>
            <h1 className="text-xl font-bold">CareerPilot AI</h1>
            <p className="text-xs text-slate-400">Intelligent Career Companion</p>
          </div>
        </a>
        <span className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
          Early access
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="py-12 md:py-16">
          <div className="mb-6 inline-flex rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-2 text-sm text-indigo-300">
            AI-powered career intelligence
          </div>
          <h2 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Make your next move
            <span className="text-indigo-400"> with a clearer strategy.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Compare your experience with a job description, see the skills that
            match, and spot areas to prepare before you apply.
          </p>
        </section>

        <section
          aria-labelledby="analysis-heading"
          className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <form
            onSubmit={handleAnalyze}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 md:p-8"
          >
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-300">
                Job match
              </p>
              <h3 id="analysis-heading" className="mt-2 text-2xl font-bold">
                Start with the details
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Paste your resume text and the job description to get a
                first-pass skill comparison.
              </p>
            </div>

            <label
              htmlFor="resume-text"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Resume
            </label>
            <div className="mb-4 rounded-xl border border-slate-700 bg-[#0b1020] p-4">
              <label
                htmlFor="resume-file"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Upload a PDF resume (up to 5 MB)
              </label>
              <input
                id="resume-file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => {
                  setResumeFile(event.target.files?.[0] || null);
                  setResumeExtractStatus("idle");
                  setResumeExtractError("");
                }}
                className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:font-medium file:text-slate-200 hover:file:bg-slate-700"
              />
              <button
                type="button"
                onClick={handleExtractResume}
                disabled={!resumeFile || resumeExtractStatus === "loading"}
                className="mt-3 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resumeExtractStatus === "loading"
                  ? "Extracting text..."
                  : "Extract text from PDF"}
              </button>
              {resumeExtractStatus === "success" && (
                <p className="mt-3 text-sm text-emerald-300">
                  Text extracted. Review it below before analyzing.
                </p>
              )}
              {resumeExtractStatus === "error" && (
                <p role="alert" className="mt-3 text-sm text-red-300">
                  {resumeExtractError}
                </p>
              )}
            </div>
            <textarea
              id="resume-text"
              required
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              placeholder="Extract text from a PDF or paste your resume here..."
              className="mb-5 min-h-40 w-full resize-y rounded-xl border border-slate-700 bg-[#0b1020] p-4 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
            />

            <label
              htmlFor="job-description"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Job description
            </label>
            <textarea
              id="job-description"
              required
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the job description here..."
              className="min-h-40 w-full resize-y rounded-xl border border-slate-700 bg-[#0b1020] p-4 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
            />

            <label
              htmlFor="weekly-hours"
              className="mb-2 mt-5 block text-sm font-medium text-slate-200"
            >
              Time available for learning each week
            </label>
            <div className="flex items-center gap-3">
              <input
                id="weekly-hours"
                type="number"
                min="1"
                max="40"
                required
                value={weeklyHours}
                onChange={(event) => setWeeklyHours(Number(event.target.value))}
                className="w-24 rounded-lg border border-slate-700 bg-[#0b1020] px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
              />
              <span className="text-sm text-slate-400">hours per week</span>
            </div>

            <button
              type="submit"
              disabled={analysisStatus === "loading"}
              className="mt-5 w-full rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-wait disabled:opacity-60"
            >
              {analysisStatus === "loading" ? "Analyzing..." : "Analyze skill match"}
            </button>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              This first-pass analysis uses a transparent set of supported
              skill keywords. It does not replace a full resume review.
            </p>
          </form>

          <section
            aria-live="polite"
            aria-labelledby="results-heading"
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-8"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-300">
              Your results
            </p>
            <h3 id="results-heading" className="mt-2 text-2xl font-bold">
              Skill match overview
            </h3>

            {!analysis && analysisStatus !== "error" && (
              <div className="mt-8 rounded-xl border border-dashed border-slate-700 p-6">
                <p className="font-medium text-slate-300">
                  Your analysis will appear here.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Add both texts and run an analysis to see matched and missing
                  skills.
                </p>
              </div>
            )}

            {analysisStatus === "error" && (
              <p
                role="alert"
                className="mt-8 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200"
              >
                {analysisError}
              </p>
            )}

            {analysis && (
              <div className="mt-8 space-y-6">
                <div className="flex items-end gap-3">
                  <strong className="text-5xl font-bold text-indigo-300">
                    {analysis.match_percentage}%
                  </strong>
                  <span className="pb-1 text-sm text-slate-400">
                    of identified job skills found in your resume
                  </span>
                </div>
                <SkillList title="Matched skills" skills={analysis.matched_skills} />
                <SkillList title="Skills to build" skills={analysis.missing_skills} />
                <LearningRoadmap
                  plan={analysis.learning_plan}
                  completedSkills={completedSkills}
                  progressError={progress.error}
                  onToggleMilestone={toggleMilestone}
                />
              </div>
            )}
          </section>
        </section>

        {analysis && (
          <MockInterview
            skills={analysis.required_skills}
            onComplete={recordInterviewSession}
            historyCount={interviewHistory.sessions.length}
            historyError={interviewHistory.error}
          />
        )}

        <InterviewHistory
          sessions={interviewHistory.sessions}
          error={interviewHistory.error}
        />

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Backend connection</h3>
              <p className="mt-2 text-sm text-slate-400">{apiMessage}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`h-3 w-3 rounded-full ${
                  isOnline
                    ? "bg-emerald-400"
                    : apiStatus === "checking"
                      ? "bg-amber-400"
                      : "bg-red-400"
                }`}
              />
              <span className="text-sm font-medium">
                {apiStatus === "checking"
                  ? "Checking..."
                  : isOnline
                    ? "Connected"
                    : "Disconnected"}
              </span>
              <button
                type="button"
                onClick={checkApi}
                disabled={apiStatus === "checking"}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:border-indigo-400 disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          </div>
        </section>

        <footer className="mt-12 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
          CareerPilot AI · Built for smarter career decisions
        </footer>
      </main>
    </div>
  );
}

function SkillList({ title, skills }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-slate-200">{title}</h4>
      {skills.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li
              key={skill}
              className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
            >
              {skill}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">None identified.</p>
      )}
    </div>
  );
}

function MockInterview({ skills, onComplete, historyCount, historyError }) {
  const [status, setStatus] = useState("idle");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluations, setEvaluations] = useState([]);
  const [error, setError] = useState("");

  const startInterview = async () => {
    setStatus("loading");
    setError("");
    setQuestions([]);
    setEvaluations([]);
    setAnswer("");
    setCurrentIndex(0);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/mock-interview/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Could not start interview (${response.status}).`);
      }

      setQuestions(data.questions);
      setStatus("answering");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not start the mock interview."
      );
      setStatus("idle");
    }
  };

  const submitAnswer = async (event) => {
    event.preventDefault();
    const question = questions[currentIndex];
    setStatus("evaluating");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/mock-interview/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: question.question_id,
          answer,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Could not evaluate answer (${response.status}).`);
      }

      setEvaluations((current) => [...current, data]);
      setStatus("feedback");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not evaluate your answer."
      );
      setStatus("answering");
    }
  };

  const continueInterview = () => {
    setAnswer("");
    if (currentIndex === questions.length - 1) {
      onComplete(evaluations);
      setStatus("complete");
      return;
    }

    setCurrentIndex((index) => index + 1);
    setStatus("answering");
  };

  const latestEvaluation = evaluations[evaluations.length - 1];
  const averageScore =
    evaluations.length > 0
      ? Math.round(
          evaluations.reduce((total, result) => total + result.score, 0) /
            evaluations.length
        )
      : 0;

  return (
    <section
      aria-labelledby="interview-heading"
      className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-300">
        Practice
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 id="interview-heading" className="text-2xl font-bold">
            Mock interview
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Practice up to five questions based on the job skills. Feedback
            checks a visible concept rubric; it is not an AI judgment.
          </p>
        </div>
        {(status === "idle" || status === "loading") && (
          <button
            type="button"
            onClick={startInterview}
            disabled={status === "loading"}
            className="rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-wait disabled:opacity-50"
          >
            {status === "loading" ? "Preparing questions..." : "Start interview"}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
          {error}
        </p>
      )}

      {status === "answering" && questions[currentIndex] && (
        <form onSubmit={submitAnswer} className="mt-6 rounded-xl border border-slate-800 bg-[#0b1020] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
            Question {currentIndex + 1} of {questions.length} · {questions[currentIndex].skill}
          </p>
          <h4 className="mt-3 text-lg font-semibold leading-7 text-slate-100">
            {questions[currentIndex].prompt}
          </h4>
          <label
            htmlFor="interview-answer"
            className="mb-2 mt-5 block text-sm font-medium text-slate-200"
          >
            Your answer
          </label>
          <textarea
            id="interview-answer"
            required
            maxLength={5000}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Explain your approach in your own words..."
            className="min-h-32 w-full resize-y rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
          />
          <button
            type="submit"
            disabled={status === "evaluating"}
            className="mt-4 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-wait disabled:opacity-50"
          >
            {status === "evaluating" ? "Reviewing..." : "Review my answer"}
          </button>
        </form>
      )}

      {status === "evaluating" && (
        <p role="status" className="mt-5 text-sm text-slate-400">
          Checking your answer against the question's concept rubric...
        </p>
      )}

      {status === "feedback" && latestEvaluation && (
        <div className="mt-6 rounded-xl border border-indigo-400/20 bg-[#0b1020] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-semibold text-slate-100">
              Feedback · {latestEvaluation.skill}
            </h4>
            <span className="rounded-full bg-indigo-400/10 px-3 py-1 text-sm font-semibold text-indigo-200">
              Rubric coverage: {latestEvaluation.score}%
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {latestEvaluation.feedback}
          </p>
          <SkillList
            title="Concepts covered"
            skills={latestEvaluation.matched_concepts}
          />
          <div className="mt-4">
            <SkillList
              title="Concepts to consider"
              skills={latestEvaluation.missing_concepts}
            />
          </div>
          <button
            type="button"
            onClick={continueInterview}
            className="mt-5 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            {currentIndex === questions.length - 1 ? "View summary" : "Next question"}
          </button>
        </div>
      )}

      {status === "complete" && (
        <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <h4 className="text-lg font-semibold text-emerald-200">
            Interview practice complete
          </h4>
          <p className="mt-2 text-sm text-slate-300">
            Average rubric coverage: <strong>{averageScore}%</strong> across{" "}
            {evaluations.length} questions.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {historyError
              ? historyError
              : `${historyCount} completed interview ${
                  historyCount === 1 ? "session" : "sessions"
                } saved in this browser.`}
          </p>
          <ol className="mt-4 space-y-2">
            {evaluations.map((result, index) => (
              <li
                key={result.question_id}
                className="flex items-center justify-between gap-4 text-sm text-slate-300"
              >
                <span>
                  {index + 1}. {result.skill}
                </span>
                <span>{result.score}%</span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={startInterview}
            className="mt-5 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-indigo-400"
          >
            Practice again
          </button>
        </div>
      )}
    </section>
  );
}

function InterviewHistory({ sessions, error }) {
  const scoreTotal = sessions.reduce(
    (total, session) => total + session.averageScore,
    0
  );
  const averageScore =
    sessions.length > 0 ? Math.round(scoreTotal / sessions.length) : 0;
  const skillScores = new Map();

  for (const session of sessions) {
    for (const result of session.results) {
      const current = skillScores.get(result.skill) || { total: 0, count: 0 };
      skillScores.set(result.skill, {
        total: current.total + result.score,
        count: current.count + 1,
      });
    }
  }

  const practiceAreas = [...skillScores.entries()]
    .map(([skill, scores]) => ({
      skill,
      average: Math.round(scores.total / scores.count),
      attempts: scores.count,
    }))
    .sort((left, right) => left.average - right.average)
    .slice(0, 5);

  return (
    <section
      aria-labelledby="interview-history-heading"
      className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-300">
            Progress
          </p>
          <h3 id="interview-history-heading" className="mt-2 text-2xl font-bold">
            Interview history
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Saved locally in this browser · up to 20 recent sessions
          </p>
        </div>
        {sessions.length > 0 && (
          <div className="rounded-xl border border-slate-800 bg-[#0b1020] px-4 py-3">
            <p className="text-xs text-slate-400">Average session coverage</p>
            <p className="mt-1 text-2xl font-bold text-indigo-300">
              {averageScore}%
            </p>
          </div>
        )}
      </div>

      {error && (
        <p role="status" className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
          {error}
        </p>
      )}

      {sessions.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-700 p-5 text-sm leading-6 text-slate-400">
          Completed mock interviews will appear here with their rubric scores.
        </p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h4 className="font-semibold text-slate-200">
              Recent practice areas
            </h4>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Skills with the lowest recent rubric coverage. These scores are
              practice signals, not an assessment of overall ability.
            </p>
            <ul className="mt-4 space-y-3">
              {practiceAreas.map((area) => (
                <li
                  key={area.skill}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-slate-300">
                    {area.skill}
                    <span className="ml-2 text-xs text-slate-500">
                      ({area.attempts} {area.attempts === 1 ? "answer" : "answers"})
                    </span>
                  </span>
                  <span className="font-semibold text-slate-200">
                    {area.average}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200">Recent sessions</h4>
            <ol className="mt-3 space-y-3">
              {sessions.slice(0, 10).map((session) => (
                <li
                  key={session.id}
                  className="rounded-xl border border-slate-800 bg-[#0b1020] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <time
                      dateTime={session.completedAt}
                      className="text-sm text-slate-300"
                    >
                      {new Date(session.completedAt).toLocaleString()}
                    </time>
                    <span className="text-sm font-semibold text-indigo-300">
                      {session.averageScore}% average
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {session.results.length}{" "}
                    {session.results.length === 1 ? "question" : "questions"}
                  </p>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-200">
                      View skill scores
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {session.results.map((result) => (
                        <li
                          key={`${session.id}-${result.questionId}`}
                          className="flex justify-between gap-4 text-xs text-slate-400"
                        >
                          <span>{result.skill}</span>
                          <span>{result.score}%</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}

function LearningRoadmap({
  plan,
  completedSkills,
  progressError,
  onToggleMilestone,
}) {
  const completedCount = plan.milestones.filter((milestone) =>
    completedSkills.has(milestone.skill)
  ).length;
  const handleDownload = () => {
    const columns = [
      "Step",
      "Skill",
      "Resource",
      "Objective",
      "Estimated hours",
      "Start week",
      "Target week",
      "URL",
    ];
    const rows = plan.milestones.map((milestone) => [
      milestone.sequence,
      milestone.skill,
      milestone.title,
      milestone.objective,
      milestone.estimated_hours,
      milestone.start_week,
      milestone.target_week,
      milestone.url,
    ]);
    const csv = [columns, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
      )
      .join("\r\n");
    const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const downloadUrl = window.URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "careerpilot-learning-roadmap.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 0);
  };

  return (
    <section aria-labelledby="roadmap-heading" className="border-t border-slate-800 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h4 id="roadmap-heading" className="text-lg font-semibold text-slate-100">
            Your learning roadmap
          </h4>
          <p className="mt-1 text-sm text-slate-400">
            {plan.total_hours} estimated hours · {plan.duration_weeks}{" "}
            {plan.duration_weeks === 1 ? "week" : "weeks"} at {plan.weekly_hours}{" "}
            hours per week
          </p>
        </div>
        <div className="flex items-center gap-3">
          {plan.milestones.length > 0 && (
            <p className="text-sm font-medium text-slate-300">
              {completedCount} of {plan.milestones.length} complete
            </p>
          )}
          {plan.milestones.length > 0 && (
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-indigo-400"
            >
              Download CSV
            </button>
          )}
        </div>
      </div>

      {plan.milestones.length > 0 ? (
        <ol className="mt-5 space-y-3">
          {plan.milestones.map((milestone) => {
            const isComplete = completedSkills.has(milestone.skill);
            return (
              <li
                key={milestone.skill}
                className={`rounded-xl border bg-[#0b1020] p-4 ${
                  isComplete
                    ? "border-emerald-400/40"
                    : "border-slate-800"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
                      Step {milestone.sequence} ·{" "}
                      {milestone.start_week === milestone.target_week
                        ? `Week ${milestone.target_week}`
                        : `Weeks ${milestone.start_week}-${milestone.target_week}`}
                    </p>
                    <h5 className="mt-2 font-semibold text-slate-100">
                      {milestone.skill}: {milestone.title}
                    </h5>
                  </div>
                  <button
                    type="button"
                    aria-pressed={isComplete}
                    aria-label={`Mark ${milestone.skill} ${
                      isComplete ? "incomplete" : "complete"
                    }`}
                    onClick={() => onToggleMilestone(milestone.skill)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      isComplete
                        ? "border-emerald-400/40 text-emerald-300"
                        : "border-slate-700 text-slate-300 hover:border-indigo-400"
                    }`}
                  >
                    {isComplete ? "Completed" : "Mark complete"}
                  </button>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    ~{milestone.estimated_hours} hours
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {milestone.objective}
                </p>
                <a
                  href={milestone.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-medium text-indigo-300 underline decoration-indigo-300/40 underline-offset-4 hover:text-indigo-200"
                >
                  Open learning resource
                </a>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-6 text-emerald-200">
          No skill gaps were identified from the supported skills. Keep
          practicing and review the job requirements before applying.
        </p>
      )}
      {progressError && (
        <p role="status" className="mt-3 text-xs text-amber-300">
          {progressError}
        </p>
      )}
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Time estimates are approximate. Adjust the plan to fit your experience
        and learning pace.
      </p>
    </section>
  );
}

function loadProgress() {
  try {
    const savedProgress = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!savedProgress) {
      return { skills: new Set(), error: "" };
    }

    const parsedProgress = JSON.parse(savedProgress);
    if (
      !Array.isArray(parsedProgress) ||
      parsedProgress.some((skill) => typeof skill !== "string")
    ) {
      throw new Error("Saved progress has an invalid format.");
    }

    return { skills: new Set(parsedProgress), error: "" };
  } catch {
    return {
      skills: new Set(),
      error: "Saved progress could not be loaded from this browser.",
    };
  }
}

function loadSavedInterviewHistory() {
  try {
    return readInterviewHistory(window.localStorage);
  } catch {
    return {
      sessions: [],
      error: "Saved interview history could not be loaded from this browser.",
    };
  }
}
