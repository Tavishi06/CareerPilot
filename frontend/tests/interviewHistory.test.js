import assert from "node:assert/strict";
import test from "node:test";

import {
  createInterviewSession,
  INTERVIEW_HISTORY_STORAGE_KEY,
  MAX_SAVED_INTERVIEWS,
  readInterviewHistory,
  saveInterviewHistory,
} from "../src/interviewHistory.js";

function createStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem(key) {
      assert.equal(key, INTERVIEW_HISTORY_STORAGE_KEY);
      return value;
    },
    setItem(key, nextValue) {
      assert.equal(key, INTERVIEW_HISTORY_STORAGE_KEY);
      value = nextValue;
    },
  };
}

function makeSession(id, score = 80) {
  return {
    id,
    completedAt: "2026-11-23T09:00:00.000Z",
    averageScore: score,
    results: [{ questionId: "python", skill: "Python", score }],
  };
}

test("creates a compact session record from evaluation results", () => {
  const session = createInterviewSession(
    [
      { question_id: "python", skill: "Python", score: 80 },
      { question_id: "sql", skill: "SQL", score: 61 },
    ],
    { id: "session-1", completedAt: "2026-11-23T09:00:00.000Z" }
  );

  assert.equal(session.averageScore, 71);
  assert.deepEqual(
    session.results.map((result) => result.skill),
    ["Python", "SQL"]
  );
});

test("rejects empty or invalid interview evaluation data", () => {
  assert.throws(
    () => createInterviewSession([], { id: "empty", completedAt: "2026-11-23" }),
    TypeError
  );
  assert.throws(
    () =>
      createInterviewSession(
        [{ question_id: "python", skill: "Python", score: 101 }],
        { id: "invalid", completedAt: "2026-11-23" }
      ),
    TypeError
  );
});

test("loads saved interview history and handles missing history", () => {
  assert.deepEqual(readInterviewHistory(createStorage()), {
    sessions: [],
    error: "",
  });
  assert.deepEqual(
    readInterviewHistory(createStorage(JSON.stringify([makeSession("one")]))),
    { sessions: [makeSession("one")], error: "" }
  );
});

test("reports corrupt or unreadable history instead of silently treating it as valid", () => {
  assert.notEqual(readInterviewHistory(createStorage("{")).error, "");
  const unreadableStorage = {
    getItem() {
      throw new Error("storage unavailable");
    },
  };
  assert.notEqual(readInterviewHistory(unreadableStorage).error, "");
});

test("saves only the most recent bounded number of sessions", () => {
  const sessions = Array.from({ length: MAX_SAVED_INTERVIEWS + 2 }, (_, index) =>
    makeSession(`session-${index}`)
  );
  const storage = createStorage();

  const saved = saveInterviewHistory(storage, sessions);

  assert.equal(saved.length, MAX_SAVED_INTERVIEWS);
  assert.equal(readInterviewHistory(storage).sessions[0].id, "session-0");
  assert.equal(readInterviewHistory(storage).sessions.at(-1).id, "session-19");
});
