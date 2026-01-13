import client from "./client";

export async function getPatients() {
  const res = await client.get("/patients/");
  return res.data;
}

export async function createPatient(payload) {
  const res = await client.post("/patients/", payload);
  return res.data;
}