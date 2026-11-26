export class ApplicationApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "ApplicationApiError";
    this.statusCode = statusCode;
  }
}

async function requestApplications(path, options) {
  const response = await fetch(path, options);
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((issue) => issue.msg).join(" ")
      : data.detail;
    throw new ApplicationApiError(
      detail || `Application request failed (${response.status}).`,
      response.status
    );
  }

  return data;
}

export function listApplications(apiBaseUrl, statusFilter = "") {
  const query = statusFilter
    ? `?status=${encodeURIComponent(statusFilter)}`
    : "";
  return requestApplications(`${apiBaseUrl}/api/v1/applications${query}`);
}

export function createApplication(apiBaseUrl, application) {
  return requestApplications(`${apiBaseUrl}/api/v1/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(application),
  });
}

export function updateApplication(apiBaseUrl, id, application) {
  return requestApplications(
    `${apiBaseUrl}/api/v1/applications/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(application),
    }
  );
}

export function getApplicationHistory(apiBaseUrl, id) {
  return requestApplications(
    `${apiBaseUrl}/api/v1/applications/${encodeURIComponent(id)}/history`
  );
}

export function deleteApplication(apiBaseUrl, id) {
  return requestApplications(
    `${apiBaseUrl}/api/v1/applications/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}
