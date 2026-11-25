import assert from "node:assert/strict";
import test from "node:test";

import {
  filterApplications,
  sortApplications,
} from "../src/applicationView.js";

const applications = [
  {
    id: "one",
    company: "Zeta",
    role_title: "Backend Engineer",
    location: "Toronto",
    notes: "Ask for referral",
    status: "applied",
    applied_date: "2026-11-20",
    updated_at: "2026-11-22T12:00:00+00:00",
  },
  {
    id: "two",
    company: "Alpha",
    role_title: "Frontend Engineer",
    location: null,
    notes: "",
    status: "interviewing",
    applied_date: null,
    updated_at: "2026-11-24T12:00:00+00:00",
  },
  {
    id: "three",
    company: "Beta",
    role_title: "Data Analyst",
    location: "Remote",
    notes: "Portfolio sent",
    status: "applied",
    applied_date: "2026-11-23",
    updated_at: "2026-11-24T12:00:00+00:00",
  },
];

test("searches case-insensitively across role, location, company, and notes", () => {
  assert.deepEqual(
    filterApplications(applications, { query: "  PORTFOLIO " }).map((item) => item.id),
    ["three"]
  );
  assert.deepEqual(
    filterApplications(applications, { query: "TORONTO" }).map((item) => item.id),
    ["one"]
  );
  assert.deepEqual(
    filterApplications(applications, { query: "frontend" }).map((item) => item.id),
    ["two"]
  );
});

test("combines text search with status filter and handles blank search", () => {
  assert.deepEqual(
    filterApplications(applications, { query: "engineer", status: "applied" }).map(
      (item) => item.id
    ),
    ["one"]
  );
  assert.equal(filterApplications(applications, { query: " " }).length, 3);
});

test("sorts recent updates and company names without mutating input", () => {
  const originalIds = applications.map((item) => item.id);

  assert.deepEqual(
    sortApplications(applications).map((item) => item.id),
    ["two", "three", "one"]
  );
  assert.deepEqual(
    sortApplications(applications, "company_az").map((item) => item.id),
    ["two", "three", "one"]
  );
  assert.deepEqual(applications.map((item) => item.id), originalIds);
});

test("sorts applied dates newest first and puts missing dates last", () => {
  assert.deepEqual(
    sortApplications(applications, "applied_newest").map((item) => item.id),
    ["three", "one", "two"]
  );
});

test("rejects unknown sort options", () => {
  assert.throws(() => sortApplications(applications, "random"), RangeError);
});
