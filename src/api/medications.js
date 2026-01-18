import { api } from "./client";

export async function listMedications(q = "") {
  const res = await api.get("/api/prescriptions/medications/", {
    params: q ? { search: q } : {},
  });
  return res.data;
}

export async function createMedication(payload) {
  const res = await api.post("/api/prescriptions/medications/", payload);
  return res.data;
}

export async function updateMedication(id, patch) {
  const res = await api.patch(`/api/prescriptions/medications/${id}/`, patch);
  return res.data;
}

export async function deleteMedication(id) {
  const res = await api.delete(`/api/prescriptions/medications/${id}/`);
  return res.data;
}
