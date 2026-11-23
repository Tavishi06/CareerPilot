import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

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
                <LearningRoadmap plan={analysis.learning_plan} />
              </div>
            )}
          </section>
        </section>

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

function LearningRoadmap({ plan }) {
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
      </div>

      {plan.milestones.length > 0 ? (
        <ol className="mt-5 space-y-3">
          {plan.milestones.map((milestone) => (
            <li
              key={milestone.skill}
              className="rounded-xl border border-slate-800 bg-[#0b1020] p-4"
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
          ))}
        </ol>
      ) : (
        <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-6 text-emerald-200">
          No skill gaps were identified from the supported skills. Keep
          practicing and review the job requirements before applying.
        </p>
      )}
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Time estimates are approximate. Adjust the plan to fit your experience
        and learning pace.
      </p>
    </section>
  );
}
