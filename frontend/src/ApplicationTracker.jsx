import { useCallback, useEffect, useState } from "react";
import {
  createApplication,
  deleteApplication,
  getApplicationHistory,
  listApplications,
  updateApplication,
} from "./applicationsApi.js";
import {
  filterApplications,
  getFollowUpState,
  sortApplications,
} from "./applicationView.js";
import { exportApplicationsCsv } from "./applicationExport.js";

const APPLICATION_STATUSES = [
  "wishlist",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
];

const EMPTY_FORM = {
  company: "",
  role_title: "",
  location: "",
  job_url: "",
  applied_date: "",
  follow_up_date: "",
  status: "wishlist",
  notes: "",
};

function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getLocalDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateOnly(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export default function ApplicationTracker({ apiBaseUrl }) {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recently_updated");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [historyByApplication, setHistoryByApplication] = useState({});
  const [historyLoadingId, setHistoryLoadingId] = useState(null);

  const refreshApplications = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await listApplications(apiBaseUrl);
      setApplications(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Applications could not be loaded."
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    const initialLoad = window.setTimeout(refreshApplications, 0);
    return () => window.clearTimeout(initialLoad);
  }, [refreshApplications]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      await createApplication(apiBaseUrl, {
        ...form,
        location: form.location || null,
        job_url: form.job_url || null,
        applied_date: form.applied_date || null,
        follow_up_date: form.follow_up_date || null,
      });
      setForm(EMPTY_FORM);
      setNotice("Application added to your tracker.");
      await refreshApplications();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Application could not be saved."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (application, nextStatus) => {
    setError("");
    setNotice("");

    try {
      const updated = await updateApplication(apiBaseUrl, application.id, {
        company: application.company,
        role_title: application.role_title,
        location: application.location,
        job_url: application.job_url,
        applied_date: application.applied_date,
        status: nextStatus,
        notes: application.notes,
      });
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setHistoryByApplication((current) => {
        const next = { ...current };
        delete next[updated.id];
        return next;
      });
      setNotice(`Status updated to ${formatStatus(nextStatus)}.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Application status could not be updated."
      );
    }
  };

  const toggleApplicationHistory = async (applicationId) => {
    if (expandedHistoryId === applicationId) {
      setExpandedHistoryId(null);
      return;
    }

    setExpandedHistoryId(applicationId);
    if (historyByApplication[applicationId]) {
      return;
    }

    setHistoryLoadingId(applicationId);
    setError("");
    try {
      const history = await getApplicationHistory(apiBaseUrl, applicationId);
      setHistoryByApplication((current) => ({
        ...current,
        [applicationId]: history,
      }));
    } catch (requestError) {
      setExpandedHistoryId(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Application history could not be loaded."
      );
    } finally {
      setHistoryLoadingId(null);
    }
  };

  const startEditing = (application) => {
    setEditingId(application.id);
    setEditForm({
      company: application.company,
      role_title: application.role_title,
      location: application.location || "",
      job_url: application.job_url || "",
      applied_date: application.applied_date || "",
      follow_up_date: application.follow_up_date || "",
      status: application.status,
      notes: application.notes || "",
    });
    setError("");
    setNotice("");
  };

  const handleSaveEdit = async (event, application) => {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const updated = await updateApplication(apiBaseUrl, application.id, {
        ...editForm,
        location: editForm.location || null,
        job_url: editForm.job_url || null,
        applied_date: editForm.applied_date || null,
        follow_up_date: editForm.follow_up_date || null,
      });
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setHistoryByApplication((current) => {
        const next = { ...current };
        delete next[updated.id];
        return next;
      });
      setEditingId(null);
      setNotice("Application details updated.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Application details could not be updated."
      );
    }
  };

  const handleDelete = async (application) => {
    if (
      !window.confirm(
        `Delete the ${application.role_title} application at ${application.company}?`
      )
    ) {
      return;
    }

    setError("");
    setNotice("");
    try {
      await deleteApplication(apiBaseUrl, application.id);
      setApplications((current) =>
        current.filter((item) => item.id !== application.id)
      );
      setNotice("Application deleted.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Application could not be deleted."
      );
    }
  };

  const handleExport = () => {
    try {
      const csv = exportApplicationsCsv(visibleApplications);
      const downloadUrl = window.URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8" })
      );
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "careerpilot-applications.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 0);
    } catch {
      setError("Applications could not be exported from this browser.");
    }
  };

  const visibleApplications = sortApplications(
    filterApplications(applications, {
      query: searchQuery,
      status: statusFilter,
    }),
    sortBy
  );
  const applicationCounts = APPLICATION_STATUSES.map((status) => ({
    status,
    count: applications.filter((application) => application.status === status)
      .length,
  }));
  const overdueFollowUps = applications.filter(
    (application) =>
      getFollowUpState(application, getLocalDateString()) === "overdue"
  ).length;

  return (
    <section
      aria-labelledby="applications-heading"
      className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-300">
            Stay organized
          </p>
          <h3 id="applications-heading" className="mt-2 text-2xl font-bold">
            Application tracker
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Keep the roles you are considering, your application status, and
            follow-up notes together.
          </p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-200"
        >
          {notice}
        </p>
      )}

      <div
        aria-label="Application status summary"
        className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        {applicationCounts.map(({ status, count }) => (
          <div
            key={status}
            className="rounded-xl border border-slate-800 bg-[#0b1020] p-3"
          >
            <p className="text-xs text-slate-400">{formatStatus(status)}</p>
            <p className="mt-1 text-xl font-bold text-slate-100">{count}</p>
          </div>
        ))}
      </div>
      {overdueFollowUps > 0 && (
        <p
          role="status"
          className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200"
        >
          {overdueFollowUps} follow-up{" "}
          {overdueFollowUps === 1 ? "is" : "are"} overdue.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-slate-800 bg-[#0b1020] p-5"
        >
          <h4 className="font-semibold text-slate-100">Add an opportunity</h4>

          <label htmlFor="application-company" className="form-label">
            Company
          </label>
          <input
            id="application-company"
            name="company"
            required
            maxLength={120}
            value={form.company}
            onChange={updateForm}
            className="form-control"
          />

          <label htmlFor="application-role" className="form-label">
            Role title
          </label>
          <input
            id="application-role"
            name="role_title"
            required
            maxLength={160}
            value={form.role_title}
            onChange={updateForm}
            className="form-control"
          />

          <label htmlFor="application-location" className="form-label">
            Location
          </label>
          <input
            id="application-location"
            name="location"
            maxLength={160}
            value={form.location}
            onChange={updateForm}
            className="form-control"
          />

          <label htmlFor="application-url" className="form-label">
            Job link
          </label>
          <input
            id="application-url"
            name="job_url"
            type="url"
            value={form.job_url}
            onChange={updateForm}
            className="form-control"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="application-date" className="form-label">
                Applied date
              </label>
              <input
                id="application-date"
                name="applied_date"
                type="date"
                value={form.applied_date}
                onChange={updateForm}
                className="form-control"
              />
            </div>
            <div>
              <label htmlFor="application-status" className="form-label">
                Status
              </label>
              <select
                id="application-status"
                name="status"
                value={form.status}
                onChange={updateForm}
                className="form-control"
              >
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label htmlFor="application-follow-up-date" className="form-label">
            Follow-up date
          </label>
          <input
            id="application-follow-up-date"
            name="follow_up_date"
            type="date"
            value={form.follow_up_date}
            onChange={updateForm}
            className="form-control"
          />

          <label htmlFor="application-notes" className="form-label">
            Notes
          </label>
          <textarea
            id="application-notes"
            name="notes"
            maxLength={5000}
            value={form.notes}
            onChange={updateForm}
            placeholder="Add a follow-up reminder or interview notes..."
            className="form-control min-h-24 resize-y"
          />

          <button
            type="submit"
            disabled={isSaving}
            className="mt-4 w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-wait disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Add application"}
          </button>
        </form>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h4 className="font-semibold text-slate-100">Your opportunities</h4>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs text-slate-400">
                Search
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Company, role, notes..."
                  className="mt-1 block w-48 rounded-lg border border-slate-700 bg-[#0b1020] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400"
                />
              </label>
              <label className="text-xs text-slate-400">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="mt-1 block rounded-lg border border-slate-700 bg-[#0b1020] px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400"
                >
                  <option value="">All statuses</option>
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400">
                Sort
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="mt-1 block rounded-lg border border-slate-700 bg-[#0b1020] px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400"
                >
                  <option value="recently_updated">Recently updated</option>
                  <option value="applied_newest">Applied date</option>
                  <option value="follow_up_soonest">Follow-up date</option>
                  <option value="company_az">Company A-Z</option>
                </select>
              </label>
              <button
                type="button"
                onClick={refreshApplications}
                disabled={isLoading}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-indigo-400 disabled:opacity-50"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={visibleApplications.length === 0}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>
          </div>

          {isLoading ? (
            <p role="status" className="mt-4 text-sm text-slate-400">
              Loading applications...
            </p>
          ) : visibleApplications.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-700 p-5 text-sm leading-6 text-slate-400">
              {applications.length === 0
                ? "No applications yet. Add a role to start tracking your search."
                : "No applications match these search filters."}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {visibleApplications.map((application) => (
                <li
                  key={application.id}
                  className="rounded-xl border border-slate-800 bg-[#0b1020] p-4"
                >
                  {editingId === application.id ? (
                    <form onSubmit={(event) => handleSaveEdit(event, application)}>
                      <h5 className="font-semibold text-slate-100">
                        Edit application
                      </h5>
                      <label
                        htmlFor={`edit-company-${application.id}`}
                        className="form-label"
                      >
                        Company
                      </label>
                      <input
                        id={`edit-company-${application.id}`}
                        required
                        maxLength={120}
                        value={editForm.company}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            company: event.target.value,
                          }))
                        }
                        className="form-control"
                      />
                      <label
                        htmlFor={`edit-role-${application.id}`}
                        className="form-label"
                      >
                        Role title
                      </label>
                      <input
                        id={`edit-role-${application.id}`}
                        required
                        maxLength={160}
                        value={editForm.role_title}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            role_title: event.target.value,
                          }))
                        }
                        className="form-control"
                      />
                      <label
                        htmlFor={`edit-location-${application.id}`}
                        className="form-label"
                      >
                        Location
                      </label>
                      <input
                        id={`edit-location-${application.id}`}
                        maxLength={160}
                        value={editForm.location}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            location: event.target.value,
                          }))
                        }
                        className="form-control"
                      />
                      <label
                        htmlFor={`edit-url-${application.id}`}
                        className="form-label"
                      >
                        Job link
                      </label>
                      <input
                        id={`edit-url-${application.id}`}
                        type="url"
                        value={editForm.job_url}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            job_url: event.target.value,
                          }))
                        }
                        className="form-control"
                      />
                      <label
                        htmlFor={`edit-date-${application.id}`}
                        className="form-label"
                      >
                        Applied date
                      </label>
                      <input
                        id={`edit-date-${application.id}`}
                        type="date"
                        value={editForm.applied_date}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            applied_date: event.target.value,
                          }))
                        }
                        className="form-control"
                      />
                      <label
                        htmlFor={`edit-follow-up-date-${application.id}`}
                        className="form-label"
                      >
                        Follow-up date
                      </label>
                      <input
                        id={`edit-follow-up-date-${application.id}`}
                        type="date"
                        value={editForm.follow_up_date}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            follow_up_date: event.target.value,
                          }))
                        }
                        className="form-control"
                      />
                      <label
                        htmlFor={`edit-status-${application.id}`}
                        className="form-label"
                      >
                        Status
                      </label>
                      <select
                        id={`edit-status-${application.id}`}
                        value={editForm.status}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            status: event.target.value,
                          }))
                        }
                        className="form-control"
                      >
                        {APPLICATION_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {formatStatus(status)}
                          </option>
                        ))}
                      </select>
                      <label
                        htmlFor={`edit-notes-${application.id}`}
                        className="form-label"
                      >
                        Notes
                      </label>
                      <textarea
                        id={`edit-notes-${application.id}`}
                        maxLength={5000}
                        value={editForm.notes}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                        className="form-control min-h-24 resize-y"
                      />
                      <div className="mt-4 flex gap-3">
                        <button
                          type="submit"
                          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                        >
                          Save changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
                        {application.company}
                      </p>
                      <h5 className="mt-1 break-words font-semibold text-slate-100">
                        {application.role_title}
                      </h5>
                      {application.location && (
                        <p className="mt-1 text-sm text-slate-400">
                          {application.location}
                        </p>
                      )}
                    </div>
                    <label className="text-xs text-slate-400">
                      Status
                      <select
                        aria-label={`Status for ${application.company} ${application.role_title}`}
                        value={application.status}
                        onChange={(event) =>
                          handleStatusChange(application, event.target.value)
                        }
                        className="ml-2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100"
                      >
                        {APPLICATION_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {formatStatus(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                    <span>
                      {application.applied_date
                        ? `Applied ${application.applied_date}`
                        : `Added ${new Date(application.created_at).toLocaleDateString()}`}
                    </span>
                    {application.follow_up_date && (
                      <span
                        className={`font-medium ${
                          getFollowUpState(
                            application,
                            getLocalDateString()
                          ) === "overdue"
                            ? "text-amber-300"
                            : "text-slate-400"
                        }`}
                      >
                        Follow up{" "}
                        {getFollowUpState(
                          application,
                          getLocalDateString()
                        ) === "overdue"
                          ? "overdue · "
                          : ""}
                        {formatDateOnly(application.follow_up_date)}
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      {application.job_url && (
                        <a
                          href={application.job_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-indigo-300 underline underline-offset-2 hover:text-indigo-200"
                        >
                          View job
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => startEditing(application)}
                        className="font-medium text-slate-300 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(application)}
                        className="font-medium text-red-300 hover:text-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {application.notes && (
                    <p className="mt-3 whitespace-pre-wrap border-t border-slate-800 pt-3 text-sm leading-6 text-slate-400">
                      {application.notes}
                    </p>
                  )}
                  <div className="mt-3 border-t border-slate-800 pt-3">
                    <button
                      type="button"
                      aria-expanded={expandedHistoryId === application.id}
                      onClick={() => toggleApplicationHistory(application.id)}
                      className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
                    >
                      {expandedHistoryId === application.id
                        ? "Hide status history"
                        : "Show status history"}
                    </button>
                    {expandedHistoryId === application.id && (
                      historyLoadingId === application.id ? (
                        <p role="status" className="mt-2 text-xs text-slate-400">
                          Loading status history...
                        </p>
                      ) : (
                        <ol className="mt-2 space-y-2 text-xs text-slate-400">
                          {historyByApplication[application.id]?.map((event) => (
                            <li key={event.id}>
                              {event.previous_status
                                ? `${formatStatus(event.previous_status)} → `
                                : "Created as "}
                              <span className="text-slate-200">
                                {formatStatus(event.new_status)}
                              </span>
                              <time
                                className="ml-2"
                                dateTime={event.changed_at}
                              >
                                {new Date(event.changed_at).toLocaleString()}
                              </time>
                            </li>
                          ))}
                        </ol>
                      )
                    )}
                  </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
