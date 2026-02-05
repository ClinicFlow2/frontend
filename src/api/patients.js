// src/api/patients.js
import { api } from "./client";

export async function getPatients({ page = 1, pageSize = 10, search = "", archived = false } = {}) {
  const res = await api.get("/api/patients/", {
    params: {
      page,
      page_size: pageSize,
      search: search || undefined,
      archived: archived ? "true" : undefined,
    },
  });
  // DRF pagination: { count, next, previous, results }
  return res.data;
}

export async function createPatient(payload) {
  const res = await api.post("/api/patients/", payload);
  return res.data;
}

export async function getPatient(id) {
  const res = await api.get(`/api/patients/${id}/`);
  return res.data;
}

export async function updatePatient(id, payload) {
  // PATCH = partial update (recommended for edit forms)
  const res = await api.patch(`/api/patients/${id}/`, payload);
  return res.data;
}

export async function archivePatient(id) {
  const res = await api.post(`/api/patients/${id}/archive/`);
  return res.data;
}

export async function restorePatient(id) {
  const res = await api.post(`/api/patients/${id}/restore/`);
  return res.data;
}

export async function getLatestMedicalHistory(patientId) {
  const res = await api.get(`/api/patients/${patientId}/latest-medical-history/`);
  return res.data;
}

// ============ Patient Files ============

export async function getPatientFiles(patientId) {
  const res = await api.get(`/api/patients/${patientId}/files/`);
  return res.data;
}

export async function uploadPatientFile(patientId, file, category = "other", description = "") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);
  if (description) {
    formData.append("description", description);
  }

  const res = await api.post(`/api/patients/${patientId}/files/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export async function deletePatientFile(patientId, fileId) {
  const res = await api.delete(`/api/patients/${patientId}/files/${fileId}/`);
  return res.data;
}

export async function downloadPatientFile(patientId, fileId) {
  const res = await api.get(`/api/patients/${patientId}/files/${fileId}/download/`, {
    responseType: "blob",
  });
  return res.data;
}
