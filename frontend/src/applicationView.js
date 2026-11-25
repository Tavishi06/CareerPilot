const APPLICATION_SORTS = {
  recently_updated: (left, right) =>
    compareNewestDates(left.updated_at, right.updated_at) ||
    left.company.localeCompare(right.company),
  applied_newest: (left, right) =>
    compareNewestDates(left.applied_date, right.applied_date) ||
    left.company.localeCompare(right.company),
  company_az: (left, right) =>
    left.company.localeCompare(right.company) ||
    left.role_title.localeCompare(right.role_title),
};

function compareNewestDates(left, right) {
  if (!left && !right) {
    return 0;
  }
  if (!left) {
    return 1;
  }
  if (!right) {
    return -1;
  }
  return right.localeCompare(left);
}

export function filterApplications(applications, { query = "", status = "" } = {}) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return applications.filter((application) => {
    if (status && application.status !== status) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      application.company,
      application.role_title,
      application.location,
      application.notes,
    ]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
  });
}

export function sortApplications(applications, sortBy = "recently_updated") {
  const compare = APPLICATION_SORTS[sortBy];
  if (!compare) {
    throw new RangeError(`Unsupported application sort: ${sortBy}`);
  }

  return applications
    .map((application, index) => ({ application, index }))
    .sort(
      (left, right) =>
        compare(left.application, right.application) || left.index - right.index
    )
    .map(({ application }) => application);
}
