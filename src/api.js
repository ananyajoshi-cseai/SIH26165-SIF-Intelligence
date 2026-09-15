const API_HOST = window.location.hostname || "127.0.0.1";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `http://${API_HOST}:8000/api/v1`;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Response may have no JSON body.
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
}

export async function analyzeReport({ site, text }) {
  return request("/reports/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site,
      text,
    }),
  });
}

export async function uploadReports(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/reports/upload", {
    method: "POST",
    body: formData,
  });
}

export async function getDashboardSummary() {
  return request("/reports/dashboard-summary");
}

export async function getReports() {
  return request("/reports");
}

export async function getReport(reportId) {
  return request(`/reports/${reportId}`);
}

export async function getSimilarReports(reportId) {
  return request(`/reports/${reportId}/similar`);
}

export async function getReportGraph(reportId) {
  return request(`/reports/${reportId}/graph`);
}

export async function getBarrierIntelligence() {
  return request("/reports/barrier-intelligence");
}

export async function getEmergingPatterns() {
  return request("/reports/emerging-patterns");
}

export async function submitFeedback(reportId, extractedData, decision = "VALIDATED") {
  return request(`/reports/${reportId}/feedback`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      extracted_data: extractedData,
      decision,
    }),
  });
}

export { API_BASE_URL };
