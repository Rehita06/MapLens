
const STORAGE_KEY = "maplens-community-reports";

export function saveReport(report) {
  const place = String(report.place || "").trim();
  const type = String(report.type || "").trim();
  const description = String(report.description || "").trim();

  if (place.length < 2) {
    throw new Error("Enter a place name with at least 2 characters.");
  }

  if (!type) {
    throw new Error("Please choose a suggestion type.");
  }

  if (description.length < 10) {
    throw new Error("Please describe your suggestion in at least 10 characters.");
  }

  let reports = [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    reports = stored ? JSON.parse(stored) : [];

    if (!Array.isArray(reports)) {
      reports = [];
    }
  } catch {
    throw new Error("Saved reports could not be read. Please check browser storage.");
  }

  const newReport = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    place,
    type,
    description,
    createdAt: new Date().toISOString()
  };

  reports.push(newReport);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    throw new Error("Your report could not be saved in this browser.");
  }

  return newReport;
}

export function getReports() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const reports = stored ? JSON.parse(stored) : [];
    return Array.isArray(reports) ? reports : [];
  } catch {
    return [];
  }
}
