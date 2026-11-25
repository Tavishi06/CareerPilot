import assert from "node:assert/strict";
import test from "node:test";

import { exportApplicationsCsv } from "../src/applicationExport.js";

test("exports a header-only UTF-8 CSV when no applications exist", () => {
  const csv = exportApplicationsCsv([]);

  assert.ok(csv.startsWith("\uFEFF"));
  assert.equal(
    csv.slice(1),
    '"Company","Role title","Location","Job URL","Applied date","Follow-up date","Status","Notes","Created at","Last updated"'
  );
});

test("quotes commas, quotes, and line breaks in application fields", () => {
  const csv = exportApplicationsCsv([
    {
      company: 'Example, "Inc"',
      role_title: "Software Engineer",
      location: null,
      job_url: "https://example.com/job",
      applied_date: "2026-11-25",
      follow_up_date: "2026-12-01",
      status: "applied",
      notes: "First line\nSecond line",
      created_at: "2026-11-25T10:00:00Z",
      updated_at: "2026-11-25T11:00:00Z",
    },
  ]);
  const rows = csv.slice(1).split("\r\n");

  assert.equal(rows.length, 2);
  assert.ok(rows[1].startsWith('"Example, ""Inc""","Software Engineer",""'));
  assert.ok(rows[1].includes('"First line\nSecond line"'));
});

test("neutralizes spreadsheet formula prefixes from user-controlled fields", () => {
  const csv = exportApplicationsCsv([
    {
      company: "=HYPERLINK(\"https://bad.example\")",
      role_title: "+cmd|' /C calc'!A0",
      notes: " @SUM(A1:A2)",
    },
  ]);

  assert.ok(csv.includes(`"'=HYPERLINK(""https://bad.example"")"`));
  assert.ok(csv.includes(`"'+cmd|' /C calc'!A0"`));
  assert.ok(csv.includes(`"' @SUM(A1:A2)"`));
});

test("rejects malformed export input", () => {
  assert.throws(() => exportApplicationsCsv(null), TypeError);
});
