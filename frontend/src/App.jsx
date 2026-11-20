import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function App() {
  const [apiStatus, setApiStatus] = useState("checking");
  const [apiMessage, setApiMessage] = useState(
    "Connecting to CareerPilot backend..."
  );

  const checkApi = useCallback(async () => {
    setApiStatus("checking");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/health`
      );

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

  const isOnline = apiStatus === "online";

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100">

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 font-bold text-xl">
            C
          </div>

          <div>
            <h1 className="text-xl font-bold">
              CareerPilot AI
            </h1>

            <p className="text-xs text-slate-400">
              Intelligent Career Companion
            </p>
          </div>
        </div>

        <span className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
          Development Preview
        </span>

      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">

        <div className="mb-6 inline-flex rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-2 text-sm text-indigo-300">
          AI-powered career intelligence
        </div>

        <h2 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          Your career deserves
          <span className="text-indigo-400"> a smarter strategy.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          Analyze real job opportunities, discover your skill gaps,
          prepare for interviews and make better career decisions
          with AI-powered assistance.
        </p>

        <section className="mt-12 grid gap-5 md:grid-cols-3">

          {[
            {
              title: "Job Intelligence",
              description:
                "Understand real job requirements and evaluate your suitability."
            },
            {
              title: "Skill Gap Analysis",
              description:
                "Discover missing skills and receive a practical learning roadmap."
            },
            {
              title: "Interview Preparation",
              description:
                "Prepare for technical interviews based on actual job requirements."
            }
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
            >
              <h3 className="text-lg font-semibold">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}

        </section>

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <h3 className="font-semibold">
                Backend connection
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                {apiMessage}
              </p>
            </div>

            <div className="flex items-center gap-3">

              <span
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
                onClick={checkApi}
                disabled={apiStatus === "checking"}
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold hover:bg-indigo-400 disabled:opacity-50"
              >
                Retry
              </button>

            </div>

          </div>

        </section>

        <footer className="mt-16 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
          CareerPilot AI · Built for smarter career decisions
        </footer>

      </main>
    </div>
  );
}