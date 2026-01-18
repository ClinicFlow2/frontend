// src/pages/Prescriptions.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Prescriptions.css";

import { api } from "../api/client";
import { getPatients } from "../api/patients";

import {
  getPrescriptionTemplates,
  getPrescriptionTemplateDetail,
  createPrescription,
  getVisitsForPicker,
  unwrapListResults,
  downloadPrescriptionPdf,
} from "../api/prescriptions";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

// Best-effort patient/visit label extraction without guessing your serializer shape
function getVisitIdFromRx(rx) {
  return rx?.visit?.id ?? rx?.visit_id ?? rx?.visit ?? "-";
}
function getPatientLabelFromRx(rx) {
  const direct = rx?.patient_name ?? rx?.patient?.full_name ?? rx?.patient?.name ?? null;
  if (direct) return direct;

  const p = rx?.visit?.patient;
  const fn = p?.first_name ?? p?.firstName ?? "";
  const ln = p?.last_name ?? p?.lastName ?? "";
  const joined = `${fn} ${ln}`.trim();
  if (joined) return joined;

  const pid = rx?.patient?.id ?? rx?.patient_id ?? rx?.patient ?? null;
  if (pid != null) return `Patient #${pid}`;

  return "-";
}

// ✅ Visit dropdown label helper (Visit ID + Patient Name)
function getVisitOptionLabel(v) {
  const pid = v?.id ?? "";
  const patientName =
    v?.patient_name ??
    v?.patient?.full_name ??
    `${v?.patient?.first_name || ""} ${v?.patient?.last_name || ""}`.trim();

  return patientName ? `${pid} — ${patientName}` : String(pid);
}

export default function Prescriptions() {
  const navigate = useNavigate();
  const query = useQuery();

  const visitFromQuery = query.get("visit"); // /prescriptions?visit=123

  // Templates
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState("");

  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Visit picker (for saving)
  const [visitId, setVisitId] = useState(visitFromQuery ? String(visitFromQuery) : "");
  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(false);

  // Notes + save
  const [notes, setNotes] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // -----------------------------
  // Saved prescriptions list (Option A)
  // -----------------------------
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);

  const [rxLoading, setRxLoading] = useState(false);
  const [rxError, setRxError] = useState("");
  const [prescriptions, setPrescriptions] = useState([]);

  // Filter UI for saved list
  const [filterPatientId, setFilterPatientId] = useState("");
  const [filterVisitId, setFilterVisitId] = useState("");

  // Load templates list
  useEffect(() => {
    let alive = true;

    async function run() {
      setTemplatesLoading(true);
      setTemplatesError("");
      try {
        const data = await getPrescriptionTemplates({ page: 1, pageSize: 200 });
        const arr = unwrapListResults(data);
        if (alive) setTemplates(arr);
      } catch (e) {
        if (alive) setTemplatesError("Failed to load templates.");
      } finally {
        if (alive) setTemplatesLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  // Load visits for saving (only if NOT linked from VisitDetail)
  useEffect(() => {
    let alive = true;

    async function run() {
      if (visitFromQuery) return;
      setVisitsLoading(true);
      try {
        const data = await getVisitsForPicker({ page: 1, pageSize: 200 });
        const arr = unwrapListResults(data);
        if (alive) setVisits(arr);
      } finally {
        if (alive) setVisitsLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [visitFromQuery]);

  // Load patients for saved list filters
  useEffect(() => {
    let alive = true;

    async function run() {
      setPatientsLoading(true);
      try {
        const data = await getPatients({ page: 1, pageSize: 200, search: "" });
        const arr = Array.isArray(data?.results) ? data.results : [];
        if (alive) setPatients(arr);
      } catch {
        if (alive) setPatients([]);
      } finally {
        if (alive) setPatientsLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  // Load saved prescriptions (first page, then client-filter)
  async function loadSavedPrescriptions() {
    setRxLoading(true);
    setRxError("");
    try {
      const res = await api.get("/api/prescriptions/", { params: { page: 1, page_size: 200 } });
      const data = res?.data;
      const arr = unwrapListResults(data);
      setPrescriptions(arr);
    } catch (e) {
      setPrescriptions([]);
      setRxError("Failed to load saved prescriptions.");
    } finally {
      setRxLoading(false);
    }
  }

  useEffect(() => {
    loadSavedPrescriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPrescriptions = useMemo(() => {
    const pid = filterPatientId ? Number(filterPatientId) : null;
    const vid = filterVisitId ? Number(filterVisitId) : null;

    return prescriptions.filter((rx) => {
      const rxVisitId = Number(getVisitIdFromRx(rx)) || null;

      const rxPatientId =
        rx?.patient?.id ??
        rx?.patient_id ??
        rx?.patient ??
        rx?.visit?.patient?.id ??
        null;

      const okPatient = pid == null ? true : Number(rxPatientId) === pid;
      const okVisit = vid == null ? true : Number(rxVisitId) === vid;

      const autoVisitOk = visitFromQuery ? Number(rxVisitId) === Number(visitFromQuery) : true;

      return okPatient && okVisit && autoVisitOk;
    });
  }, [prescriptions, filterPatientId, filterVisitId, visitFromQuery]);

  async function handleSelectTemplate(t) {
    setSelectedTemplateId(t.id);
    setSelectedTemplate(null);
    setSaveMsg("");
    setNotes("");

    try {
      const detail = await getPrescriptionTemplateDetail(t.id);
      setSelectedTemplate(detail);

      const items = Array.isArray(detail.items) ? detail.items : [];
      const lines = items.map((it, i) => {
        const med = it.medication_display || `Medication #${it.medication}`;
        const line = `${i + 1}) ${med} — ${it.dosage || ""}, ${it.route || ""}, ${it.frequency || ""}, ${it.duration || ""}`;
        return line.replace(/\s+,/g, ",");
      });

      setNotes(lines.join("\n"));
    } catch {
      setSaveMsg("Failed to load template detail.");
    }
  }

  async function handleSave() {
    setSaveMsg("");

    const v = String(visitId).trim();
    if (!v) return setSaveMsg("Please select a Visit (or open from a visit).");
    if (!selectedTemplateId || !selectedTemplate) return setSaveMsg("Please select a template.");

    const templateItems = Array.isArray(selectedTemplate.items) ? selectedTemplate.items : [];
    if (templateItems.length === 0) return setSaveMsg("This template has no items. Add items in admin first.");

    const itemsPayload = templateItems.map((it) => ({
      medication: it.medication,
      dosage: it.dosage || "",
      route: it.route || "",
      frequency: it.frequency || "",
      duration: it.duration || "",
      instructions: it.instructions || "",
      allow_outside_purchase: false,
    }));

    setIsSaving(true);
    try {
      const payload = {
        visit: Number(v),
        template_used: selectedTemplateId,
        notes: notes || "",
        items: itemsPayload,
      };

      const created = await createPrescription(payload);
      setSaveMsg(`Saved. Prescription #${created?.id ?? ""}`);

      await loadSavedPrescriptions();

      if (visitFromQuery) setTimeout(() => navigate(-1), 250);
    } catch {
      setSaveMsg("Save failed. Check backend validation and visit ID.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleClear() {
    setSelectedTemplateId(null);
    setSelectedTemplate(null);
    setNotes("");
    setSaveMsg("");
    if (!visitFromQuery) setVisitId("");
  }

  return (
    <div className="cf-grid">
      <div className="cf-row-between">
        <div>
          <h1 className="cf-title">Prescriptions</h1>
          <div className="cf-subtitle">Templates → Edit → Save</div>
        </div>

        <div className="cf-row">
          <button className="cf-btn" onClick={handleClear} disabled={isSaving}>
            Clear
          </button>
          <button className="cf-btn cf-btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Editor grid */}
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "360px 1fr" }}>
        {/* Left */}
        <div className="cf-card">
          <div className="cf-card-inner">
            <div className="cf-row-between">
              <div>
                <div style={{ fontWeight: 1000, fontSize: 16 }}>Templates</div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>Select a model, then edit.</div>
              </div>
            </div>

            {templatesLoading ? <div style={{ color: "var(--muted)", marginTop: 10 }}>Loading...</div> : null}
            {templatesError ? <div style={{ color: "var(--danger)", marginTop: 10 }}>{templatesError}</div> : null}

            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className="cf-btn"
                  style={{
                    textAlign: "left",
                    background: selectedTemplateId === t.id ? "var(--panel-2)" : "var(--panel)",
                    borderColor: selectedTemplateId === t.id ? "rgba(96,165,250,0.35)" : "var(--border)",
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="cf-card">
          <div className="cf-card-inner">
            <div className="cf-row-between">
              <div>
                <div style={{ fontWeight: 1000, fontSize: 18 }}>{selectedTemplate?.name || "New prescription"}</div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>Notes / Prescription text</div>
              </div>
              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "var(--panel-2)",
                  fontWeight: 900,
                  fontSize: 12,
                  color: "var(--muted)",
                }}
              >
                Draft
              </span>
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>Visit</label>

                {visitFromQuery ? (
                  <input className="cf-input" value={visitId} disabled />
                ) : (
                  <select
                    className="cf-select"
                    value={visitId}
                    onChange={(e) => setVisitId(e.target.value)}
                    disabled={visitsLoading}
                  >
                    <option value="">Click to choose...</option>
                    {visits.map((v) => (
                      <option key={v.id} value={v.id}>
                        {getVisitOptionLabel(v)}
                      </option>
                    ))}
                  </select>
                )}

                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>
                  {visitFromQuery ? "Linked automatically from the visit." : "Pick a visit ID."}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>
                  Edit freely (stored in notes)
                </label>
                <textarea
                  className="cf-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write prescription here..."
                />
              </div>

              {saveMsg ? (
                <div className="cf-card" style={{ padding: 12, borderRadius: 12, background: "var(--panel-2)" }}>
                  <b>Status:</b> {saveMsg}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* SAVED PRESCRIPTIONS */}
      <div className="cf-card" style={{ marginTop: 14 }}>
        <div className="cf-card-inner">
          <div className="cf-row-between">
            <div>
              <div style={{ fontWeight: 1000, fontSize: 16 }}>Saved prescriptions</div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                Filter and print/download PDFs.
              </div>
            </div>

            <button className="cf-btn" onClick={loadSavedPrescriptions} disabled={rxLoading}>
              {rxLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr", marginTop: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>Filter by patient</label>
              <select
                className="cf-select"
                value={filterPatientId}
                onChange={(e) => setFilterPatientId(e.target.value)}
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

            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>Filter by visit</label>
              <input
                className="cf-input"
                value={filterVisitId}
                onChange={(e) => setFilterVisitId(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="Type visit ID (e.g. 12)"
              />
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "end" }}>
              <button
                className="cf-btn"
                onClick={() => {
                  setFilterPatientId("");
                  setFilterVisitId("");
                }}
              >
                Clear filters
              </button>

              {visitFromQuery ? (
                <button className="cf-btn" onClick={() => navigate(-1)}>
                  Back to visit
                </button>
              ) : null}
            </div>
          </div>

          {rxError ? <div style={{ color: "var(--danger)", marginTop: 12 }}>{rxError}</div> : null}

          <div style={{ marginTop: 12 }}>
            {rxLoading ? (
              <div style={{ color: "var(--muted)" }}>Loading saved prescriptions...</div>
            ) : filteredPrescriptions.length === 0 ? (
              <div style={{ color: "var(--muted)" }}>No saved prescriptions match your filters.</div>
            ) : (
              <div style={{ overflowX: "auto", marginTop: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--panel-2)" }}>
                      <th style={th}>Rx #</th>
                      <th style={th}>Patient</th>
                      <th style={th}>Visit</th>
                      <th style={th}>Created</th>
                      <th style={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrescriptions.map((rx) => {
                      const rxId = rx?.id ?? "-";
                      const vId = getVisitIdFromRx(rx);
                      const patientLabel = getPatientLabelFromRx(rx);

                      const createdAt = rx?.created_at ?? rx?.created ?? rx?.createdAt ?? null;
                      const createdLabel = createdAt ? new Date(createdAt).toLocaleString() : "-";

                      return (
                        <tr key={String(rxId)} style={{ borderTop: "1px solid var(--border)" }}>
                          <td style={td}>{rxId}</td>
                          <td style={td} title={patientLabel}>{patientLabel}</td>
                          <td style={td}>{vId}</td>
                          <td style={td}>{createdLabel}</td>
                          <td style={td}>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <button
                                className="cf-btn"
                                onClick={() => downloadPrescriptionPdf(rxId)}
                                disabled={!rx?.id}
                                title="Download / Print PDF"
                              >
                                Print / Download PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 10 }}>
                  Note: patient/visit names depend on what your backend returns in the prescriptions list serializer. If it only returns
                  IDs, you’ll see IDs here (still printable).
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "12px 12px",
  fontSize: 13,
  color: "var(--muted)",
  borderBottom: "1px solid var(--border)",
  whiteSpace: "nowrap",
  fontWeight: 900,
};

const td = {
  padding: "12px 12px",
  verticalAlign: "top",
  color: "var(--text)",
};
