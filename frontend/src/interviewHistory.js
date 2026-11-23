export const INTERVIEW_HISTORY_STORAGE_KEY = "careerpilot.interviewHistory";
export const MAX_SAVED_INTERVIEWS = 20;

function isInterviewSession(session) {
  return (
    session !== null &&
    typeof session === "object" &&
    typeof session.id === "string" &&
    session.id.trim().length > 0 &&
    typeof session.completedAt === "string" &&
    Number.isFinite(Date.parse(session.completedAt)) &&
    Number.isInteger(session.averageScore) &&
    session.averageScore >= 0 &&
    session.averageScore <= 100 &&
    Array.isArray(session.results) &&
    session.results.length > 0 &&
    session.results.every(
      (result) =>
        result !== null &&
        typeof result === "object" &&
        typeof result.questionId === "string" &&
        result.questionId.trim().length > 0 &&
        typeof result.skill === "string" &&
        result.skill.trim().length > 0 &&
        Number.isInteger(result.score) &&
        result.score >= 0 &&
        result.score <= 100
    )
  );
}

export function createInterviewSession(evaluations, { id, completedAt }) {
  if (
    !Array.isArray(evaluations) ||
    evaluations.length === 0 ||
    evaluations.some(
      (result) =>
        typeof result.question_id !== "string" ||
        typeof result.skill !== "string" ||
        !Number.isInteger(result.score) ||
        result.score < 0 ||
        result.score > 100
    )
  ) {
    throw new TypeError("Interview evaluations are invalid.");
  }

  const session = {
    id,
    completedAt,
    averageScore: Math.round(
      evaluations.reduce((total, result) => total + result.score, 0) /
        evaluations.length
    ),
    results: evaluations.map((result) => ({
      questionId: result.question_id,
      skill: result.skill,
      score: result.score,
    })),
  };

  if (!isInterviewSession(session)) {
    throw new TypeError("Interview session metadata is invalid.");
  }

  return session;
}

export function readInterviewHistory(storage) {
  try {
    const savedHistory = storage.getItem(INTERVIEW_HISTORY_STORAGE_KEY);
    if (savedHistory === null) {
      return { sessions: [], error: "" };
    }

    const sessions = JSON.parse(savedHistory);
    if (!Array.isArray(sessions) || !sessions.every(isInterviewSession)) {
      throw new TypeError("Saved interview history has an invalid format.");
    }

    return {
      sessions: sessions.slice(0, MAX_SAVED_INTERVIEWS),
      error: "",
    };
  } catch {
    return {
      sessions: [],
      error: "Saved interview history could not be loaded from this browser.",
    };
  }
}

export function saveInterviewHistory(storage, sessions) {
  if (!Array.isArray(sessions) || !sessions.every(isInterviewSession)) {
    throw new TypeError("Interview history contains invalid session data.");
  }

  const recentSessions = sessions.slice(0, MAX_SAVED_INTERVIEWS);
  storage.setItem(
    INTERVIEW_HISTORY_STORAGE_KEY,
    JSON.stringify(recentSessions)
  );
  return recentSessions;
}
