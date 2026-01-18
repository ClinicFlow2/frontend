// src/api/prescriptions.js
import { api } from "./client";

// Helper: DRF may return array OR paginated object { results: [...] }
function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

export function unwrapListResults(data) {
  return unwrapList(data);
}

// -------- Prescription Templates --------
export async function getPrescriptionTemplates({ page = 1, pageSize = 50, search = "" } = {}) {
  const res = await api.get("/api/prescriptions/templates/", {
    params: {
      page,
      page_size: pageSize,
      search: search || undefined,
    },
  });
  return res.data;
}

export async function getPrescriptionTemplateDetail(templateId) {
  const res = await api.get(`/api/prescriptions/templates/${templateId}/`);
  return res.data;
}

// -------- Prescriptions (instances) --------
export async function getPrescriptions({ page = 1, pageSize = 10, search = "", visitId = null } = {}) {
  const res = await api.get("/api/prescriptions/", {
    params: {
      page,
      page_size: pageSize,
      search: search || undefined,
      ...(visitId ? { visit: visitId } : {}),
    },
  });
  return res.data;
}

export async function createPrescription(payload) {
  const res = await api.post("/api/prescriptions/", payload);
  return res.data;
}

export async function getPrescriptionDetail(prescriptionId) {
  const res = await api.get(`/api/prescriptions/${prescriptionId}/`);
  return res.data;
}

export async function updatePrescription(prescriptionId, payload) {
  const res = await api.patch(`/api/prescriptions/${prescriptionId}/`, payload);
  return res.data;
}

export async function deletePrescription(prescriptionId) {
  const res = await api.delete(`/api/prescriptions/${prescriptionId}/`);
  return res.data;
}

// -------------------- PDF --------------------

// PDF URL helper (debug / copy-paste in backend tools).
// ⚠️ Opening this URL directly in a browser will NOT include JWT => 401.
export function getPrescriptionPdfUrl(prescriptionId) {
  const base = api.defaults.baseURL || "http://127.0.0.1:8000";
  return `${base}/api/prescriptions/${prescriptionId}/pdf/`;
}

// ✅ Use this in the frontend button (it sends Authorization header)
export async function downloadPrescriptionPdf(prescriptionId) {
  const res = await api.get(`/api/prescriptions/${prescriptionId}/pdf/`, {
    responseType: "blob",
  });

  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);

  // Open PDF in a new tab (user can print/save from there)
  window.open(url, "_blank", "noopener,noreferrer");

  // Cleanup
  setTimeout(() => window.URL.revokeObjectURL(url), 15000);

  return true;
}

// -------- Medications --------
export async function getMedications({ page = 1, pageSize = 50, search = "" } = {}) {
  const res = await api.get("/api/prescriptions/medications/", {
    params: {
      page,
      page_size: pageSize,
      search: search || undefined,
    },
  });
  return res.data;
}

export async function createMedication(payload) {
  const res = await api.post("/api/prescriptions/medications/", payload);
  return res.data;
}

// -------- Visits (for Visit ID dropdown) --------
export async function getVisitsForPicker({ page = 1, pageSize = 50, search = "" } = {}) {
  const res = await api.get("/api/visits/", {
    params: {
      page,
      page_size: pageSize,
      search: search || undefined,
    },
  });
  return res.data;
}
