// src/api/visits.js
import { api } from "./client";

/**
 * Backend routes:
 *  - GET/POST         /api/visits/
 *  - GET/PATCH/DELETE /api/visits/<id>/
 *  - GET/POST         /api/visits/vitals/
 *  - GET/PATCH/DELETE /api/visits/vitals/<id>/
 *  - GET              /api/prescriptions/<id>/pdf/   (used for authenticated PDF download)
 *
 * NOTE:
 * DRF may return paginated list responses:
 *   { count, next, previous, results: [...] }
 */

export function unwrapList(data) {
  if (data && typeof data === "object" && Array.isArray(data.results)) return data.results;
  if (Array.isArray(data)) return data;
  return [];
}

/* -----------------------------
 * Visits
 * ----------------------------- */

export async function getVisits({ patientId } = {}) {
  const params = {};
  if (patientId) params.patient = patientId;

  const res = await api.get("/api/visits/", { params });
  return unwrapList(res.data);
}

export async function createVisit(payload) {
  const res = await api.post("/api/visits/", payload);
  return res.data;
}

export async function getVisit(visitId) {
  const res = await api.get(`/api/visits/${visitId}/`);
  return res.data;
}

export async function updateVisit(visitId, payload) {
  const res = await api.patch(`/api/visits/${visitId}/`, payload);
  return res.data;
}

export async function deleteVisit(visitId) {
  const res = await api.delete(`/api/visits/${visitId}/`);
  return res.data;
}

/* -----------------------------
 * Vital Signs
 * ----------------------------- */

export async function getVitals({ visitId } = {}) {
  const params = {};
  if (visitId) params.visit = visitId;

  const res = await api.get("/api/visits/vitals/", { params });
  return unwrapList(res.data);
}

export async function createVitals(payload) {
  const res = await api.post("/api/visits/vitals/", payload);
  return res.data;
}

export async function getVitalsDetail(vitalsId) {
  const res = await api.get(`/api/visits/vitals/${vitalsId}/`);
  return res.data;
}

export async function updateVitals(vitalsId, payload) {
  const res = await api.patch(`/api/visits/vitals/${vitalsId}/`, payload);
  return res.data;
}

export async function deleteVitals(vitalsId) {
  const res = await api.delete(`/api/visits/vitals/${vitalsId}/`);
  return res.data;
}

/* -----------------------------
 * Authenticated Prescription PDF download
 * ----------------------------- */

function pickFilenameFromHeaders(headers, fallback = "prescription.pdf") {
  try {
    const cd = headers?.["content-disposition"] || headers?.get?.("content-disposition");
    if (!cd) return fallback;

    const match = /filename\*?=(?:UTF-8''|")?([^";\n]+)"?/i.exec(cd);
    if (!match?.[1]) return fallback;
    return decodeURIComponent(match[1]);
  } catch {
    return fallback;
  }
}

export async function downloadPrescriptionPdf(prescriptionId) {
  const res = await api.get(`/api/prescriptions/${prescriptionId}/pdf/`, {
    responseType: "blob",
  });

  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);

  const filename = pickFilenameFromHeaders(res.headers, `prescription_${prescriptionId}.pdf`);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
}
