// src/api/visits.js
import { api } from "./client";

/**
 * ✅ Visits
 * Backend routes:
 *  - GET/POST   /api/visits/
 *  - GET/PATCH/DELETE /api/visits/<id>/
 *
 * Filters:
 *  - GET /api/visits/?patient=<patient_id>
 */

// List visits (optionally filter by patient)
export async function getVisits({ patientId } = {}) {
  const params = {};
  if (patientId) params.patient = patientId;

  const res = await api.get("/api/visits/", { params });
  return res.data; // array (not paginated yet)
}

// Create a visit
export async function createVisit(payload) {
  const res = await api.post("/api/visits/", payload);
  return res.data;
}

// Get one visit by id
export async function getVisit(visitId) {
  const res = await api.get(`/api/visits/${visitId}/`);
  return res.data;
}

// Update a visit (PATCH)
export async function updateVisit(visitId, payload) {
  const res = await api.patch(`/api/visits/${visitId}/`, payload);
  return res.data;
}

// Delete a visit
export async function deleteVisit(visitId) {
  const res = await api.delete(`/api/visits/${visitId}/`);
  return res.data;
}

/**
 * ✅ Vital Signs
 * Backend routes:
 *  - GET/POST   /api/visits/vitals/
 *  - GET/PATCH/DELETE /api/visits/vitals/<id>/
 *
 * Filters:
 *  - GET /api/visits/vitals/?visit=<visit_id>
 */

// List vitals (optionally filter by visit)
export async function getVitals({ visitId } = {}) {
  const params = {};
  if (visitId) params.visit = visitId;

  const res = await api.get("/api/visits/vitals/", { params });
  return res.data; // array (not paginated yet)
}

// Create vitals
export async function createVitals(payload) {
  const res = await api.post("/api/visits/vitals/", payload);
  return res.data;
}

// Get one vitals record
export async function getVitalsDetail(vitalsId) {
  const res = await api.get(`/api/visits/vitals/${vitalsId}/`);
  return res.data;
}

// Update vitals
export async function updateVitals(vitalsId, payload) {
  const res = await api.patch(`/api/visits/vitals/${vitalsId}/`, payload);
  return res.data;
}

// Delete vitals
export async function deleteVitals(vitalsId) {
  const res = await api.delete(`/api/visits/vitals/${vitalsId}/`);
  return res.data;
}
