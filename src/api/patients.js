// src/api/patients.js
import { api } from "./client";

export async function getPatients({ page = 1, pageSize = 10, search = "" } = {}) {
  const res = await api.get("/api/patients/", {
    params: {
      page,
      page_size: pageSize,
      search: search || undefined,
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
