const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.method === "POST" ? 120000 : 30000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = data?.detail || data?.message;
      throw new Error(typeof detail === "string" ? detail : `Request failed with status ${response.status}`);
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("The service took too long to respond. Your submission may have been saved; retry the same content to check it safely.");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

const pendingSubmissions = new Map();
export async function analyzeReport({ site, text, is_synthetic = false }) {
  const bytes = new TextEncoder().encode(JSON.stringify({ site, text, is_synthetic }));
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) => b.toString(16).padStart(2, "0")).join("");
  const key = `sif-pending-${hash}`;
  let requestId = pendingSubmissions.get(key);
  try { requestId ||= sessionStorage.getItem(key); } catch { /* storage may be disabled */ }
  requestId ||= crypto.randomUUID();
  pendingSubmissions.set(key, requestId);
  try { sessionStorage.setItem(key, requestId); } catch { /* in-memory retry remains available */ }
  const result = await request("/reports/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site, text, is_synthetic, request_id: requestId }),
  });
  pendingSubmissions.delete(key);
  try { sessionStorage.removeItem(key); } catch { /* storage may be disabled */ }
  return result;
}

export async function uploadReports(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/reports/upload", {
    method: "POST",
    body: formData,
  });
}

export async function analyzeImage(file, site = "Unknown") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("site", site);
  return request("/reports/analyze-image", {
    method: "POST",
    body: formData,
  });
}

export async function ocrImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  return request("/reports/ocr", {
    method: "POST",
    body: formData,
  });
}

export async function getDashboardSummary() {
  return request("/reports/dashboard-summary");
}

export async function getEvaluationMetrics() {
  return request("/reports/metrics");
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
