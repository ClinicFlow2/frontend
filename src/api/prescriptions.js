// src/api/prescriptions.js
import { api } from "./client";

// -------- Prescription Templates --------
export async function getPrescriptionTemplates() {
  const res = await api.get("/api/prescriptions/templates/");
  return res.data;
}

export async function getPrescriptionTemplateDetail(templateId) {
  const res = await api.get(`/api/prescriptions/templates/${templateId}/`);
  return res.data;
}

// -------- Prescriptions (instances) --------
export async function getPrescriptions({ page = 1, pageSize = 10, search = "" } = {}) {
  const res = await api.get("/api/prescriptions/", {
    params: {
      page,
      page_size: pageSize,
      search: search || undefined,
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

// -------- Medications --------
export async function getMedications({ search = "" } = {}) {
  const res = await api.get("/api/prescriptions/medications/", {
    params: { search: search || undefined },
  });
  return res.data;
}

export async function createMedication(payload) {
  const res = await api.post("/api/prescriptions/medications/", payload);
  return res.data;
}
