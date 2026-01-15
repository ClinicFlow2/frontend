// src/pages/Prescriptions.jsx
import { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo.png";
import "./Prescriptions.css";

import {
  getPrescriptionTemplates,
  getPrescriptionTemplateDetail,
  createPrescription,
} from "../api/prescriptions";

/**
 * ClinicFlowHQ Prescriptions module (Template -> Editor -> Save)
 *
 * Backend:
 *  - GET  /api/prescriptions/templates/
 *  - GET  /api/prescriptions/templates/:id/
 *  - POST /api/prescriptions/
 */
export default function Prescriptions() {
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState("");

  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Editor state
  const [notes, setNotes] = useState("");
  const [visitId, setVisitId] = useState(""); // user can paste a visit id for now
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Template filter
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadTemplates() {
      setTemplatesLoading(true);
      setTemplatesError("");
      try {
        const data = await getPrescriptionTemplates();
        if (alive) setTemplates(Array.isArray(data) ? data : []);
      } catch (e) {
        if (alive) setTemplatesError("Failed to load templates.");
      } finally {
        if (alive) setTemplatesLoading(false);
      }
    }

    loadTemplates();
    return () => {
      alive = false;
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return templates;
    return templates.filter((t) => (t.name || "").toLowerCase().includes(s));
  }, [templates, q]);

  async function selectTemplate(id) {
    setSelectedTemplateId(id);
    setSelectedTemplate(null);
    setSaveMsg("");
    try {
      const detail = await getPrescriptionTemplateDetail(id);
      setSelectedTemplate(detail);

      // Pre-fill notes from template items
      const lines = [];
      if (detail?.name) lines.push(detail.name);
      lines.push("");
      if (Array.isArray(detail?.items)) {
        detail.items.forEach((it, idx) => {
          const med =
            it?.medication_display ||
            it?.medication_name ||
            it?.medication ||
            "Medication";
          const dosage = it?.dosage ? ` — ${it.dosage}` : "";
          const freq = it?.frequency ? `, ${it.frequency}` : "";
          const dur = it?.duration ? `, ${it.duration}` : "";
          const route = it?.route ? `, ${it.route}` : "";
          lines.push(
            `${idx + 1}) ${med}${dosage}${route}${freq}${dur}`.trim()
          );
          if (it?.instructions) lines.push(`   • ${it.instructions}`);
        });
      } else {
        lines.push("No items in this template.");
      }
      setNotes(lines.join("\n"));
    } catch (e) {
      setSelectedTemplate(null);
    }
  }

  // ✅ Option A: frontend sends items
  async function handleSave() {
    setSaveMsg("");

    const v = String(visitId).trim();
    if (!v) return setSaveMsg("Please enter a Visit ID (visit) before saving.");
    if (!selectedTemplateId || !selectedTemplate)
      return setSaveMsg("Please select a template.");

    const items = Array.isArray(selectedTemplate.items)
      ? selectedTemplate.items.map((it) => ({
          medication: it.medication, // template serializer returns medication FK id
          dosage: it.dosage || "",
          route: it.route || "",
          frequency: it.frequency || "",
          duration: it.duration || "",
          instructions: it.instructions || "",
          allow_outside_purchase: false,
        }))
      : [];

    if (items.length === 0) {
      return setSaveMsg("This template has no items. Add items in admin first.");
    }

    setIsSaving(true);
    try {
      const payload = {
        visit: Number(v),
        template_used: selectedTemplateId,
        notes: notes || "",
        items,
      };

      const created = await createPrescription(payload);
      setSaveMsg(`Saved. Prescription #${created?.id ?? ""}`);
    } catch (e) {
      setSaveMsg("Save failed. Check Visit ID and backend validation.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rx-page">
      <header className="rx-topbar">
        <div className="rx-brand">
          <img className="rx-logo" src={logo} alt="ClinicFlowHQ" />
          <div className="rx-brandText">
            <div className="rx-brandName">ClinicFlowHQ</div>
            <div className="rx-brandSub">Prescriptions</div>
          </div>
        </div>

        <div className="rx-actions">
          <button
            className="rx-btn rx-btnGhost"
            onClick={() => setNotes("")}
            disabled={isSaving}
          >
            Clear
          </button>
          <button
            className="rx-btn rx-btnPrimary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      <main className="rx-layout">
        {/* Left: Templates */}
        <aside className="rx-panel rx-templates">
          <div className="rx-panelHeader">
            <div>
              <div className="rx-panelTitle">Templates</div>
              <div className="rx-panelHint">Select a model, then edit.</div>
            </div>
          </div>

          <div className="rx-search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search template..."
            />
          </div>

          <div className="rx-list">
            {templatesLoading ? (
              <div className="rx-muted">Loading templates…</div>
            ) : templatesError ? (
              <div className="rx-error">{templatesError}</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="rx-muted">No templates found.</div>
            ) : (
              filteredTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  className={
                    "rx-item " + (tpl.id === selectedTemplateId ? "is-active" : "")
                  }
                  onClick={() => selectTemplate(tpl.id)}
                >
                  <div className="rx-itemName">{tpl.name}</div>
                  {tpl.is_active === false ? (
                    <span className="rx-tag rx-tagOff">OFF</span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Right: Editor */}
        <section className="rx-panel rx-editor">
          <div className="rx-editorHeader">
            <div className="rx-editorTitleRow">
              <div className="rx-editorTitle">
                {selectedTemplate?.name ||
                  (selectedTemplateId ? "Loading…" : "New prescription")}
              </div>
              <div className="rx-rightInfo">
                <span className="rx-chip">Draft</span>
              </div>
            </div>

            <div className="rx-meta">
              <label>
                Visit ID
                <input
                  value={visitId}
                  onChange={(e) => setVisitId(e.target.value)}
                  placeholder="e.g. 12"
                  inputMode="numeric"
                />
              </label>

              <label className="rx-metaWide">
                Notes / Prescription text
                <span className="rx-help">
                  Edit freely (this will be stored as notes).
                </span>
              </label>
            </div>

            {saveMsg ? (
              <div
                className={
                  "rx-banner " + (saveMsg.startsWith("Saved") ? "ok" : "bad")
                }
              >
                {saveMsg}
              </div>
            ) : null}
          </div>

          <div className="rx-editorBody">
            <textarea
              className="rx-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write prescription here…"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
