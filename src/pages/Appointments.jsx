// src/pages/Appointments.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

const STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "NO_SHOW", label: "No-show" },
];

function toLocalInputValue(date) {
  // returns "YYYY-MM-DDTHH:mm"
  const pad = (n) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export default function Appointments() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);

  // Filters
  const [filterPatient, setFilterPatient] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUpcoming, setFilterUpcoming] = useState(true);

  // Create form
  const [form, setForm] = useState(() => {
    const nowPlus1h = new Date(Date.now() + 60 * 60 * 1000);
    return {
      patient: "",
      scheduled_at: toLocalInputValue(nowPlus1h),
      status: "SCHEDULED",
      reason: "",
      notes: "",
      visit: "",
    };
  });

  // Edit modal-ish state (simple inline editor)
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const patientById = useMemo(() => {
    const map = new Map();
    for (const p of patients) map.set(String(p.id), p);
    return map;
  }, [patients]);

  async function loadPatients() {
    setPatientsLoading(true);
    try {
      const res = await api.get("/api/patients/", { params: { page: 1, page_size: 200 } });
      setPatients(unwrapList(res.data));
    } catch (e) {
      // Patients page likely works already; if not, keep this quiet but visible.
      console.log("LOAD PATIENTS ERROR:", e?.response?.data || e);
    } finally {
      setPatientsLoading(false);
    }
  }

  async function loadAppointments() {
    setLoading(true);
    setError("");
    try {
      const params = { page: 1, page_size: 200 };
      if (filterPatient) params.patient = filterPatient;
      if (filterStatus) params.status = filterStatus;
      if (filterUpcoming) params.upcoming = "true";

      const res = await api.get("/api/appointments/", { params });
      setItems(unwrapList(res.data));
    } catch (e) {
      console.log("LOAD APPOINTMENTS ERROR:", e?.response?.data || e);
      setError("Appointments endpoint failed. Check backend route: /api/appointments/");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    setSaving(true);
    setError("");

    try {
      const payload = {
        patient: Number(form.patient),
        scheduled_at: new Date(form.scheduled_at).toISOString(), // send ISO to backend
        status: form.status,
        reason: form.reason || "",
        notes: form.notes || "",
        visit: form.visit ? Number(form.visit) : null,
      };

      if (!payload.patient || Number.isNaN(payload.patient)) {
        setError("Please select a patient.");
        return;
      }

      await api.post("/api/appointments/", payload);

      // reset (keep patient selected for faster workflow)
      const keepPatient = form.patient;
      const next = new Date(Date.now() + 60 * 60 * 1000);
      setForm((f) => ({
        ...f,
        patient: keepPatient,
        scheduled_at: toLocalInputValue(next),
        status: "SCHEDULED",
        reason: "",
        notes: "",
        visit: "",
      }));

      await loadAppointments();
    } catch (e) {
      const detail = e?.response?.data;
      console.log("CREATE APPOINTMENT ERROR:", detail || e);

      // Your model validation likely returns {"scheduled_at": ["Appointment cannot be in the past."]}
      if (detail && typeof detail === "object") {
        setError(JSON.stringify(detail, null, 2));
      } else {
        setError("Create failed.");
      }
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(appt) {
    setEditingId(appt.id);
    setEditForm({
      patient: String(appt.patient?.id ?? appt.patient ?? ""),
      scheduled_at: appt.scheduled_at ? toLocalInputValue(new Date(appt.scheduled_at)) : "",
      status: appt.status || "SCHEDULED",
      reason: appt.reason || "",
      notes: appt.notes || "",
      visit: appt.visit ? String(appt.visit?.id ?? appt.visit) : "",
    });
  }

  async function saveEdit() {
    if (!editingId || !editForm) return;
    setSaving(true);
    setError("");

    try {
      const payload = {
        patient: Number(editForm.patient),
        scheduled_at: editForm.scheduled_at ? new Date(editForm.scheduled_at).toISOString() : null,
        status: editForm.status,
        reason: editForm.reason || "",
        notes: editForm.notes || "",
        visit: editForm.visit ? Number(editForm.visit) : null,
      };

      await api.patch(`/api/appointments/${editingId}/`, payload);
      setEditingId(null);
      setEditForm(null);
      await loadAppointments();
    } catch (e) {
      const detail = e?.response?.data;
      console.log("UPDATE APPOINTMENT ERROR:", detail || e);
      setError(detail ? JSON.stringify(detail, null, 2) : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAppointment(id) {
    if (!window.confirm("Delete this appointment?")) return;
    setSaving(true);
    setError("");

    try {
      await api.delete(`/api/appointments/${id}/`);
      await loadAppointments();
    } catch (e) {
      const detail = e?.response?.data;
      console.log("DELETE APPOINTMENT ERROR:", detail || e);
      setError(detail ? JSON.stringify(detail, null, 2) : "Delete failed.");
    } finally {
      setSaving(false);
    }
  }

  function renderPatientLabel(appt) {
    // If API later returns nested patient object, use it.
    const pObj = appt.patient && typeof appt.patient === "object" ? appt.patient : null;
    if (pObj) return `${pObj.first_name || ""} ${pObj.last_name || ""}`.trim() || `Patient #${pObj.id}`;

    const pid = appt.patient != null ? String(appt.patient) : "";
    const p = pid ? patientById.get(pid) : null;
    if (p) return `${p.first_name} ${p.last_name}`;
    return pid ? `Patient #${pid}` : "-";
  }

  return (
    <div style={{ padding: 20, maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 44, fontWeight: 900 }}>Appointments</h1>
        <span style={{ color: "#666" }}>Scheduling + daily agenda (CRUD)</span>
      </div>

      {/* Filters */}
      <div style={{ marginTop: 14, padding: 16, border: "1px solid #e5e5e5", borderRadius: 12, background: "white" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <div style={{ minWidth: 260 }}>
            <label style={label}>Filter by patient</label>
            <select
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
              style={input}
              disabled={patientsLoading}
            >
              <option value="">All patients</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} (#{p.id})
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 220 }}>
            <label style={label}>Filter by status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={input}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 180 }}>
            <label style={label}>Upcoming only</label>
            <select value={filterUpcoming ? "yes" : "no"} onChange={(e) => setFilterUpcoming(e.target.value === "yes")} style={input}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <button onClick={loadAppointments} style={{ ...btn, marginLeft: "auto" }} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error ? (
          <pre style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#fff5f5", border: "1px solid #ffd1d1", color: "#b00020", whiteSpace: "pre-wrap" }}>
            {error}
          </pre>
        ) : null}
      </div>

      {/* Create */}
      <div style={{ marginTop: 14, padding: 16, border: "1px solid #e5e5e5", borderRadius: 12, background: "white" }}>
        <h3 style={{ marginTop: 0 }}>Create appointment</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={label}>Patient</label>
            <select value={form.patient} onChange={(e) => setForm((f) => ({ ...f, patient: e.target.value }))} style={input}>
              <option value="">Select patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} (#{p.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={label}>Scheduled at</label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
              style={input}
            />
            <div style={{ marginTop: 6, color: "#666", fontSize: 12 }}>
              Note: backend rejects past times for Scheduled/Confirmed.
            </div>
          </div>

          <div>
            <label style={label}>Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={input}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={label}>Link to Visit (optional)</label>
            <input
              value={form.visit}
              onChange={(e) => setForm((f) => ({ ...f, visit: e.target.value }))}
              placeholder="Visit ID (optional)"
              style={input}
            />
          </div>

          <div>
            <label style={label}>Reason</label>
            <input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} style={input} />
          </div>

          <div>
            <label style={label}>Notes</label>
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={input} />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={saving}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#f7f7f7",
            cursor: saving ? "not-allowed" : "pointer",
            fontWeight: 800,
          }}
        >
          {saving ? "Saving..." : "Create appointment"}
        </button>
      </div>

      {/* List */}
      <div style={{ marginTop: 14, padding: 16, border: "1px solid #e5e5e5", borderRadius: 12, background: "white" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h3 style={{ margin: 0 }}>Appointments</h3>
          <span style={{ color: "#666" }}>{items.length}</span>
        </div>

        {loading ? <p style={{ color: "#666", marginTop: 10 }}>Loading...</p> : null}

        {!loading && items.length === 0 ? <p style={{ color: "#666", marginTop: 10 }}>No appointments found.</p> : null}

        {items.length > 0 ? (
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {items.map((a) => {
              const isEditing = editingId === a.id;
              return (
                <div
                  key={a.id}
                  style={{
                    padding: 12,
                    border: "1px solid #eee",
                    borderRadius: 12,
                    background: "#fafafa",
                  }}
                >
                  {!isEditing ? (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <div>
                        <b>Appointment #{a.id}</b>
                        <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                          Patient: {renderPatientLabel(a)} · Scheduled:{" "}
                          {a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : "-"} · Status: {a.status || "-"}
                          {a.visit ? ` · Visit: ${typeof a.visit === "object" ? a.visit.id : a.visit}` : ""}
                        </div>
                        {a.reason ? <div style={{ marginTop: 6 }}><b>Reason:</b> {a.reason}</div> : null}
                        {a.notes ? <div style={{ marginTop: 6 }}><b>Notes:</b> {a.notes}</div> : null}
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={btn} onClick={() => beginEdit(a)}>Edit</button>
                        <button style={{ ...btn, borderColor: "#f2b8b8", background: "#fff5f5" }} onClick={() => deleteAppointment(a.id)} disabled={saving}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <b>Edit Appointment #{a.id}</b>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button style={btn} onClick={() => { setEditingId(null); setEditForm(null); }} disabled={saving}>
                            Cancel
                          </button>
                          <button style={{ ...btn, fontWeight: 900 }} onClick={saveEdit} disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>

                      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={label}>Patient</label>
                          <select
                            value={editForm.patient}
                            onChange={(e) => setEditForm((f) => ({ ...f, patient: e.target.value }))}
                            style={input}
                          >
                            <option value="">Select patient...</option>
                            {patients.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.first_name} {p.last_name} (#{p.id})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={label}>Scheduled at</label>
                          <input
                            type="datetime-local"
                            value={editForm.scheduled_at}
                            onChange={(e) => setEditForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                            style={input}
                          />
                        </div>

                        <div>
                          <label style={label}>Status</label>
                          <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} style={input}>
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={label}>Visit (optional)</label>
                          <input value={editForm.visit} onChange={(e) => setEditForm((f) => ({ ...f, visit: e.target.value }))} style={input} />
                        </div>

                        <div>
                          <label style={label}>Reason</label>
                          <input value={editForm.reason} onChange={(e) => setEditForm((f) => ({ ...f, reason: e.target.value }))} style={input} />
                        </div>

                        <div>
                          <label style={label}>Notes</label>
                          <input value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} style={input} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const btn = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
};

const label = {
  display: "block",
  fontSize: 13,
  color: "#444",
  marginBottom: 6,
};

const input = {
  width: "100%",
  padding: 10,
  border: "1px solid #ddd",
  borderRadius: 8,
};
