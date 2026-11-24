import { useCallback, useEffect, useState } from "react";
import {
  createApplication,
  deleteApplication,
  listApplications,
  updateApplication,
} from "./applicationsApi.js";

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
  status: "wishlist",
  notes: "",
};

function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function ApplicationTracker({ apiBaseUrl }) {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
      setNotice(`Status updated to ${formatStatus(nextStatus)}.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Application status could not be updated."
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

  const visibleApplications = statusFilter
    ? applications.filter((application) => application.status === statusFilter)
    : applications;
  const applicationCounts = APPLICATION_STATUSES.map((status) => ({
    status,
    count: applications.filter((application) => application.status === status)
      .length,
  }));

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
        <label className="text-sm text-slate-300">
          Filter by status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="ml-2 rounded-lg border border-slate-700 bg-[#0b1020] px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400"
          >
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </label>
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
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-semibold text-slate-100">Your opportunities</h4>
            <button
              type="button"
              onClick={refreshApplications}
              disabled={isLoading}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-indigo-400 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <p role="status" className="mt-4 text-sm text-slate-400">
              Loading applications...
            </p>
          ) : visibleApplications.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-700 p-5 text-sm leading-6 text-slate-400">
              {statusFilter
                ? `No ${formatStatus(statusFilter).toLowerCase()} applications found.`
                : "No applications yet. Add a role to start tracking your search."}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {visibleApplications.map((application) => (
                <li
                  key={application.id}
                  className="rounded-xl border border-slate-800 bg-[#0b1020] p-4"
                >
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
