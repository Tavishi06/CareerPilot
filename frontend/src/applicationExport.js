const APPLICATION_CSV_COLUMNS = [
  ["Company", "company"],
  ["Role title", "role_title"],
  ["Location", "location"],
  ["Job URL", "job_url"],
  ["Applied date", "applied_date"],
  ["Follow-up date", "follow_up_date"],
  ["Status", "status"],
  ["Notes", "notes"],
  ["Created at", "created_at"],
  ["Last updated", "updated_at"],
];

function escapeCsvValue(value) {
  const text = value === null || value === undefined ? "" : String(value);
  const spreadsheetSafeText = /^[\t\r\n ]*[=+\-@]/.test(text)
    ? `'${text}`
    : text;
  return `"${spreadsheetSafeText.replaceAll('"', '""')}"`;
}

export function exportApplicationsCsv(applications) {
  if (!Array.isArray(applications)) {
    throw new TypeError("Applications must be an array.");
  }

  const rows = [
    APPLICATION_CSV_COLUMNS.map(([label]) => label),
    ...applications.map((application) =>
      APPLICATION_CSV_COLUMNS.map(([, field]) => application[field])
    ),
  ];

  return `\uFEFF${rows
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\r\n")}`;
}
