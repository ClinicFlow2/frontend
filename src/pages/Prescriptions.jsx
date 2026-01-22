// src/pages/Prescriptions.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Prescriptions.css";

import { api } from "../api/client";
import { getPatients } from "../api/patients";

import {
  getPrescriptionTemplates,
  getPrescriptionTemplateDetail,
  createPrescriptionTemplate,
  updatePrescriptionTemplate,
  deletePrescriptionTemplate,
  createPrescription,
  deletePrescription,
  getVisitsForPicker,
  unwrapListResults,
  downloadPrescriptionPdf,
  getMedications,
  createMedication,
} from "../api/prescriptions";
import { formatDateTime } from "../utils/dateFormat";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

// Get patient name display
function getPatientDisplay(p) {
  if (!p) return "";
  return `${p.first_name || ""} ${p.last_name || ""}`.trim() || `Patient #${p.id}`;
}

// Best-effort patient/visit label extraction
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

function getVisitOptionLabel(v) {
  const pid = v?.id ?? "";
  const patientName =
    v?.patient_name ??
    v?.patient?.full_name ??
    `${v?.patient?.first_name || ""} ${v?.patient?.last_name || ""}`.trim();

  return patientName ? `${pid} — ${patientName}` : String(pid);
}

// Empty custom item template
const createEmptyItem = () => ({
  medication: "",
  medication_display: "",
  dosage: "",
  route: "",
  frequency: "",
  duration: "",
  instructions: "",
});

// Helper to get localized template name
function getTemplateName(tpl, lang) {
  if (lang === "fr" && tpl.name_fr) return tpl.name_fr;
  return tpl.name;
}

export default function Prescriptions() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const query = useQuery();
  const currentLang = i18n.language?.split("-")[0] || "en";

  const visitFromQuery = query.get("visit");
  const patientFromQuery = query.get("patient");

  // Templates
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState("");

  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Custom prescription mode
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customItems, setCustomItems] = useState([createEmptyItem()]);

  // Medications list for custom mode
  const [medications, setMedications] = useState([]);
  const [medicationsLoading, setMedicationsLoading] = useState(false);

  // Patient and visit picker
  const [patientId, setPatientId] = useState(patientFromQuery ? String(patientFromQuery) : "");
  const [visitId, setVisitId] = useState(visitFromQuery ? String(visitFromQuery) : "");
  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(false);

  // Notes + save
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Message state
  const [message, setMessage] = useState({ type: "", text: "" });

  // Saved prescriptions
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [rxLoading, setRxLoading] = useState(false);
  const [rxError, setRxError] = useState("");
  const [prescriptions, setPrescriptions] = useState([]);

  // Filters
  const [filterPatientId, setFilterPatientId] = useState("");
  const [filterVisitId, setFilterVisitId] = useState("");

  // View modal
  const [viewRx, setViewRx] = useState(null);

  // PDF download state
  const [downloadingId, setDownloadingId] = useState(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Template editing modal
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    name_fr: "",
    description: "",
    description_fr: "",
    items: [],
  });
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateDeleting, setTemplateDeleting] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);

  // New medication modal
  const [newMedModalOpen, setNewMedModalOpen] = useState(false);
  const [newMedForm, setNewMedForm] = useState({ name: "", form: "", strength: "" });
  const [newMedSaving, setNewMedSaving] = useState(false);

  // Load templates
  useEffect(() => {
    let alive = true;
    async function run() {
      setTemplatesLoading(true);
      setTemplatesError("");
      try {
        const data = await getPrescriptionTemplates({ page: 1, pageSize: 200 });
        const arr = unwrapListResults(data);
        if (alive) setTemplates(arr);
      } catch {
        if (alive) setTemplatesError(t("prescriptionsPage.loadTemplatesError"));
      } finally {
        if (alive) setTemplatesLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [t]);

  // Load medications for custom mode
  useEffect(() => {
    let alive = true;
    async function run() {
      setMedicationsLoading(true);
      try {
        const data = await getMedications({ page: 1, pageSize: 500 });
        const arr = unwrapListResults(data);
        if (alive) setMedications(arr);
      } catch {
        if (alive) setMedications([]);
      } finally {
        if (alive) setMedicationsLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, []);

  // Load visits for picker
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
    return () => { alive = false; };
  }, [visitFromQuery]);

  // Load patients for filters
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
    return () => { alive = false; };
  }, []);

  // Load saved prescriptions
  async function loadSavedPrescriptions() {
    setRxLoading(true);
    setRxError("");
    try {
      const res = await api.get("/api/prescriptions/", { params: { page: 1, page_size: 200 } });
      const arr = unwrapListResults(res?.data);
      setPrescriptions(arr);
    } catch {
      setPrescriptions([]);
      setRxError(t("prescriptionsPage.loadError"));
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
        rx?.patient?.id ?? rx?.patient_id ?? rx?.patient ?? rx?.visit?.patient?.id ?? null;

      const okPatient = pid == null || Number(rxPatientId) === pid;
      const okVisit = vid == null || Number(rxVisitId) === vid;
      const autoVisitOk = visitFromQuery ? Number(rxVisitId) === Number(visitFromQuery) : true;

      return okPatient && okVisit && autoVisitOk;
    });
  }, [prescriptions, filterPatientId, filterVisitId, visitFromQuery]);

  async function handleSelectTemplate(tpl) {
    setIsCustomMode(false);
    setCustomItems([createEmptyItem()]);
    setSelectedTemplateId(tpl.id);
    setSelectedTemplate(null);
    setMessage({ type: "", text: "" });
    setNotes("");

    try {
      const detail = await getPrescriptionTemplateDetail(tpl.id);
      setSelectedTemplate(detail);

      const items = Array.isArray(detail.items) ? detail.items : [];
      const lines = items.map((it, i) => {
        const med = it.medication_display || `Medication #${it.medication}`;
        const line = `${i + 1}) ${med} — ${it.dosage || ""}, ${it.route || ""}, ${it.frequency || ""}, ${it.duration || ""}`;
        return line.replace(/\s+,/g, ",");
      });

      setNotes(lines.join("\n"));
    } catch {
      setMessage({ type: "error", text: t("prescriptionsPage.loadTemplateDetailError") });
    }
  }

  function handleSelectCustom() {
    setIsCustomMode(true);
    setSelectedTemplateId(null);
    setSelectedTemplate(null);
    setCustomItems([createEmptyItem()]);
    setNotes("");
    setMessage({ type: "", text: "" });
  }

  function handleAddCustomItem() {
    setCustomItems([...customItems, createEmptyItem()]);
  }

  function handleRemoveCustomItem(index) {
    if (customItems.length <= 1) return;
    setCustomItems(customItems.filter((_, i) => i !== index));
  }

  function handleCustomItemChange(index, field, value) {
    const updated = [...customItems];
    updated[index] = { ...updated[index], [field]: value };

    // If medication changed, update display name
    if (field === "medication" && value) {
      const med = medications.find(m => String(m.id) === String(value));
      if (med) {
        const display = [med.name, med.strength, med.form ? `(${med.form})` : ""].filter(Boolean).join(" ");
        updated[index].medication_display = display;
      }
    }

    setCustomItems(updated);
  }

  async function handleSave() {
    setMessage({ type: "", text: "" });

    const p = String(patientId).trim();
    const v = String(visitId).trim();

    // Patient is required
    if (!p) {
      setMessage({ type: "error", text: t("prescriptionsPage.selectPatientOrVisitError") });
      return;
    }

    let itemsPayload = [];

    if (isCustomMode) {
      // Validate custom items - at least one medication required
      const validItems = customItems.filter(it => it.medication);
      if (validItems.length === 0) {
        setMessage({ type: "error", text: t("prescriptionsPage.addAtLeastOneMed") });
        return;
      }

      itemsPayload = validItems.map((it) => ({
        medication: Number(it.medication),
        dosage: it.dosage || "",
        route: it.route || "",
        frequency: it.frequency || "",
        duration: it.duration || "",
        instructions: it.instructions || "",
        allow_outside_purchase: false,
      }));
    } else {
      // Template mode
      if (!selectedTemplateId || !selectedTemplate) {
        setMessage({ type: "error", text: t("prescriptionsPage.selectTemplateError") });
        return;
      }

      const templateItems = Array.isArray(selectedTemplate.items) ? selectedTemplate.items : [];
      if (templateItems.length === 0) {
        setMessage({ type: "error", text: t("prescriptionsPage.noTemplateItemsError") });
        return;
      }

      itemsPayload = templateItems.map((it) => ({
        medication: it.medication,
        dosage: it.dosage || "",
        route: it.route || "",
        frequency: it.frequency || "",
        duration: it.duration || "",
        instructions: it.instructions || "",
        allow_outside_purchase: false,
      }));
    }

    setIsSaving(true);
    try {
      const payload = {
        patient: p ? Number(p) : undefined,
        visit: v ? Number(v) : undefined,
        template_used: isCustomMode ? null : selectedTemplateId,
        notes: notes || "",
        items: itemsPayload,
      };

      const created = await createPrescription(payload);
      setMessage({ type: "success", text: t("prescriptionsPage.createSuccess", { id: created?.id ?? "" }) });

      await loadSavedPrescriptions();

      if (visitFromQuery || patientFromQuery) setTimeout(() => navigate(-1), 250);
    } catch (err) {
      // Check if it's a permission error (403)
      if (err?.response?.status === 403) {
        setMessage({ type: "error", text: t("prescriptionsPage.permissionError") });
      } else {
        setMessage({ type: "error", text: t("prescriptionsPage.createError") });
      }
    } finally {
      setIsSaving(false);
    }
  }

  function handleClear() {
    setSelectedTemplateId(null);
    setSelectedTemplate(null);
    setIsCustomMode(false);
    setCustomItems([createEmptyItem()]);
    setNotes("");
    setMessage({ type: "", text: "" });
    if (!visitFromQuery) setVisitId("");
    if (!patientFromQuery) setPatientId("");
  }

  async function handleDownloadPdf(rxId) {
    setDownloadingId(rxId);
    try {
      await downloadPrescriptionPdf(rxId, currentLang);
    } catch {
      setMessage({ type: "error", text: t("prescriptionsPage.pdfError") });
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(rxId) {
    try {
      await deletePrescription(rxId);
      setMessage({ type: "success", text: t("prescriptionsPage.deleteSuccess") });
      setDeleteConfirmId(null);
      await loadSavedPrescriptions();
    } catch {
      setMessage({ type: "error", text: t("prescriptionsPage.deleteError") });
    }
  }

  // Get medication display name
  function getMedDisplay(med) {
    if (!med) return "";
    return [med.name, med.strength, med.form ? `(${med.form})` : ""].filter(Boolean).join(" ");
  }

  // -------- Template CRUD --------
  async function openTemplateModal(tpl = null) {
    if (tpl) {
      // Editing existing template - fetch detail to get items with medication IDs
      setTemplateModalOpen(true);
      setTemplateLoading(true);
      setEditingTemplate(tpl);
      setTemplateForm({
        name: tpl.name || "",
        name_fr: tpl.name_fr || "",
        description: tpl.description || "",
        description_fr: tpl.description_fr || "",
        items: [],
      });

      try {
        const detail = await getPrescriptionTemplateDetail(tpl.id);
        setTemplateForm({
          name: detail.name || "",
          name_fr: detail.name_fr || "",
          description: detail.description || "",
          description_fr: detail.description_fr || "",
          items: (detail.items || []).map((it) => ({
            medication: it.medication || "",
            dosage: it.dosage || "",
            route: it.route || "",
            frequency: it.frequency || "",
            duration: it.duration || "",
            instructions: it.instructions || "",
          })),
        });
      } catch (err) {
        console.error("Failed to load template detail:", err);
        setMessage({ type: "error", text: t("prescriptionsPage.templateLoadError") });
      } finally {
        setTemplateLoading(false);
      }
    } else {
      // Creating new template
      setEditingTemplate(null);
      setTemplateForm({
        name: "",
        name_fr: "",
        description: "",
        description_fr: "",
        items: [{ medication: "", dosage: "", route: "", frequency: "", duration: "", instructions: "" }],
      });
      setTemplateModalOpen(true);
    }
  }

  function closeTemplateModal() {
    setTemplateModalOpen(false);
    setEditingTemplate(null);
    setTemplateForm({ name: "", name_fr: "", description: "", description_fr: "", items: [] });
  }

  function handleTemplateFormChange(field, value) {
    setTemplateForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleTemplateItemChange(index, field, value) {
    setTemplateForm((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  }

  function addTemplateItem() {
    setTemplateForm((prev) => ({
      ...prev,
      items: [...prev.items, { medication: "", dosage: "", route: "", frequency: "", duration: "", instructions: "" }],
    }));
  }

  function removeTemplateItem(index) {
    if (templateForm.items.length <= 1) return;
    setTemplateForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  async function handleSaveTemplate() {
    if (!templateForm.name.trim()) {
      setMessage({ type: "error", text: t("prescriptionsPage.templateNameRequired") });
      return;
    }

    const validItems = templateForm.items.filter((it) => it.medication);
    if (validItems.length === 0) {
      setMessage({ type: "error", text: t("prescriptionsPage.templateNeedsMed") });
      return;
    }

    setTemplateSaving(true);
    try {
      const payload = {
        name: templateForm.name,
        name_fr: templateForm.name_fr,
        description: templateForm.description,
        description_fr: templateForm.description_fr,
        is_active: true,
        items: validItems.map((it) => ({
          medication: Number(it.medication),
          dosage: it.dosage || "",
          route: it.route || "",
          frequency: it.frequency || "",
          duration: it.duration || "",
          instructions: it.instructions || "",
        })),
      };

      if (editingTemplate) {
        await updatePrescriptionTemplate(editingTemplate.id, payload);
        setMessage({ type: "success", text: t("prescriptionsPage.templateUpdated") });
      } else {
        await createPrescriptionTemplate(payload);
        setMessage({ type: "success", text: t("prescriptionsPage.templateCreated") });
      }

      closeTemplateModal();
      // Reload templates
      const data = await getPrescriptionTemplates({ page: 1, pageSize: 200 });
      setTemplates(unwrapListResults(data));
    } catch {
      setMessage({ type: "error", text: t("prescriptionsPage.templateSaveError") });
    } finally {
      setTemplateSaving(false);
    }
  }

  async function handleDeleteTemplate() {
    if (!editingTemplate) return;

    setTemplateDeleting(true);
    try {
      await deletePrescriptionTemplate(editingTemplate.id);
      setMessage({ type: "success", text: t("prescriptionsPage.templateDeleted") });
      closeTemplateModal();
      // Reload templates
      const data = await getPrescriptionTemplates({ page: 1, pageSize: 200 });
      setTemplates(unwrapListResults(data));
    } catch {
      setMessage({ type: "error", text: t("prescriptionsPage.templateDeleteError") });
    } finally {
      setTemplateDeleting(false);
    }
  }

  // -------- New Medication --------
  function openNewMedModal() {
    setNewMedForm({ name: "", form: "", strength: "" });
    setNewMedModalOpen(true);
  }

  function closeNewMedModal() {
    setNewMedModalOpen(false);
    setNewMedForm({ name: "", form: "", strength: "" });
  }

  async function handleSaveNewMedication() {
    if (!newMedForm.name.trim()) {
      setMessage({ type: "error", text: t("prescriptionsPage.medNameRequired") });
      return;
    }

    setNewMedSaving(true);
    try {
      const created = await createMedication({
        name: newMedForm.name.trim(),
        form: newMedForm.form.trim(),
        strength: newMedForm.strength.trim(),
        is_active: true,
      });
      setMessage({ type: "success", text: t("prescriptionsPage.medCreated", { name: created.name }) });
      closeNewMedModal();

      // Reload medications
      const data = await getMedications({ page: 1, pageSize: 500 });
      setMedications(unwrapListResults(data));
    } catch {
      setMessage({ type: "error", text: t("prescriptionsPage.medCreateError") });
    } finally {
      setNewMedSaving(false);
    }
  }

  // Loading skeleton
  if (templatesLoading && rxLoading) {
    return (
      <div className="cf-animate-in" style={{ padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="cf-skeleton" style={{ height: 32, width: 180 }} />
          <div className="cf-skeleton" style={{ height: 20, width: 280 }} />
          <div className="rx-layout">
            <div className="cf-skeleton" style={{ height: 400, borderRadius: 16 }} />
            <div className="cf-skeleton" style={{ height: 400, borderRadius: 16 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cf-animate-in" style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, color: "var(--text)" }}>{t("prescriptions.title")}</h2>
          <p style={{ color: "var(--muted)", margin: "4px 0 0 0", fontSize: "0.875rem" }}>
            {t("prescriptionsPage.subtitle")}
          </p>
        </div>
        <div className="rx-header-actions">
          <button className="rx-btn" onClick={handleClear} disabled={isSaving}>
            {t("common.clear")}
          </button>
          <button className="rx-btn rx-btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>

      {/* Status message */}
      {message.text && (
        <div className={`rx-message ${message.type}`} style={{ marginBottom: 16 }}>
          {message.text}
        </div>
      )}

      {/* Editor grid */}
      <div className="rx-layout">
        {/* Templates panel */}
        <div className="rx-card">
          <div className="rx-card-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 className="rx-card-title">{t("prescriptions.templates")}</h3>
                <p className="rx-card-subtitle">{t("prescriptionsPage.selectTemplate")}</p>
              </div>
              <button
                className="rx-btn rx-btn-sm"
                onClick={() => openTemplateModal(null)}
              >
                + {t("prescriptionsPage.createTemplate")}
              </button>
            </div>
          </div>

          <div className="rx-template-list">
            {/* Custom prescription button */}
            <button
              onClick={handleSelectCustom}
              className={`rx-template-item rx-template-custom ${isCustomMode ? "active" : ""}`}
            >
              + {t("prescriptionsPage.customPrescription")}
            </button>

            {templatesLoading ? (
              <div style={{ padding: 16, color: "var(--muted)" }}>{t("common.loading")}</div>
            ) : templatesError ? (
              <div style={{ padding: 16, color: "var(--error)" }}>{templatesError}</div>
            ) : templates.length === 0 ? (
              <div className="rx-empty">{t("prescriptionsPage.noTemplates")}</div>
            ) : (
              templates.map((tpl) => (
                <div key={tpl.id} className="rx-template-item-wrapper">
                  <button
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`rx-template-item ${selectedTemplateId === tpl.id ? "active" : ""}`}
                  >
                    {getTemplateName(tpl, currentLang)}
                  </button>
                  <button
                    className="rx-template-edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openTemplateModal(tpl);
                    }}
                    title={t("common.edit")}
                  >
                    ✎
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor panel */}
        <div className="rx-card">
          <div className="rx-card-header">
            <div className="rx-editor-header">
              <div>
                <h3 className="rx-editor-title">
                  {isCustomMode
                    ? t("prescriptionsPage.customPrescription")
                    : (selectedTemplate ? getTemplateName(selectedTemplate, currentLang) : t("prescriptions.newPrescription"))}
                </h3>
                <p className="rx-card-subtitle">
                  {isCustomMode
                    ? t("prescriptionsPage.customPrescriptionDesc")
                    : t("prescriptionsPage.notesLabel")}
                </p>
              </div>
              <span className="rx-chip">
                {isCustomMode ? t("prescriptionsPage.custom") : t("prescriptionsPage.draft")}
              </span>
            </div>
          </div>

          <div className="rx-card-body">
            <div style={{ display: "grid", gap: 16 }}>
              {/* Patient selector */}
              <div className="rx-form-group">
                <label className="rx-label">{t("prescriptionsPage.patient")} *</label>
                {patientFromQuery ? (
                  <input
                    value={patients.find(p => String(p.id) === patientFromQuery)
                      ? getPatientDisplay(patients.find(p => String(p.id) === patientFromQuery))
                      : `Patient #${patientFromQuery}`}
                    disabled
                    style={{ opacity: 0.7 }}
                  />
                ) : (
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    disabled={patientsLoading}
                  >
                    <option value="">{t("prescriptionsPage.selectPatient")}</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {getPatientDisplay(p)} ({p.patient_code || `#${p.id}`})
                      </option>
                    ))}
                  </select>
                )}
                <span className="rx-help">
                  {patientFromQuery ? t("prescriptionsPage.linkedFromPatient") : t("prescriptionsPage.pickPatient")}
                </span>
              </div>

              {/* Visit selector (optional) */}
              <div className="rx-form-group">
                <label className="rx-label">{t("prescriptionsPage.visit")} ({t("common.optional")})</label>
                {visitFromQuery ? (
                  <input value={visitId} disabled style={{ opacity: 0.7 }} />
                ) : (
                  <select
                    value={visitId}
                    onChange={(e) => setVisitId(e.target.value)}
                    disabled={visitsLoading}
                  >
                    <option value="">{t("prescriptionsPage.noVisit")}</option>
                    {visits.map((v) => (
                      <option key={v.id} value={v.id}>
                        {getVisitOptionLabel(v)}
                      </option>
                    ))}
                  </select>
                )}
                <span className="rx-help">
                  {visitFromQuery ? t("prescriptionsPage.linkedFromVisit") : t("prescriptionsPage.pickVisitOptional")}
                </span>
              </div>

              {/* Custom prescription items */}
              {isCustomMode && (
                <div className="rx-custom-items">
                  <div className="rx-custom-items-header">
                    <label className="rx-label">{t("prescriptions.medications")}</label>
                    <button
                      type="button"
                      className="rx-btn rx-btn-sm"
                      onClick={handleAddCustomItem}
                    >
                      + {t("prescriptionsPage.addMedication")}
                    </button>
                  </div>

                  {customItems.map((item, idx) => (
                    <div key={idx} className="rx-custom-item">
                      <div className="rx-custom-item-header">
                        <span className="rx-custom-item-number">{idx + 1}</span>
                        {customItems.length > 1 && (
                          <button
                            type="button"
                            className="rx-btn rx-btn-sm rx-btn-danger"
                            onClick={() => handleRemoveCustomItem(idx)}
                          >
                            {t("common.delete")}
                          </button>
                        )}
                      </div>

                      <div className="rx-custom-item-grid">
                        <div className="rx-form-group">
                          <label className="rx-label">{t("prescriptionsPage.medication")}</label>
                          <div className="rx-medication-select-row">
                            <select
                              value={item.medication}
                              onChange={(e) => handleCustomItemChange(idx, "medication", e.target.value)}
                              disabled={medicationsLoading}
                            >
                              <option value="">{t("prescriptionsPage.selectMedication")}</option>
                              {medications.map((med) => (
                                <option key={med.id} value={med.id}>
                                  {getMedDisplay(med)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="rx-btn rx-btn-sm rx-btn-new-med"
                              onClick={openNewMedModal}
                              title={t("prescriptionsPage.createMedication")}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="rx-form-group">
                          <label className="rx-label">{t("prescriptions.dosage")}</label>
                          <input
                            type="text"
                            value={item.dosage}
                            onChange={(e) => handleCustomItemChange(idx, "dosage", e.target.value)}
                            placeholder={t("prescriptionsPage.dosagePlaceholder")}
                          />
                        </div>

                        <div className="rx-form-group">
                          <label className="rx-label">{t("prescriptionsPage.route")}</label>
                          <select
                            value={item.route}
                            onChange={(e) => handleCustomItemChange(idx, "route", e.target.value)}
                          >
                            <option value="">{t("prescriptionsPage.selectRoute")}</option>
                            <option value="oral">{t("prescriptionsPage.routes.oral")}</option>
                            <option value="topical">{t("prescriptionsPage.routes.topical")}</option>
                            <option value="inhalation">{t("prescriptionsPage.routes.inhalation")}</option>
                            <option value="injection">{t("prescriptionsPage.routes.injection")}</option>
                            <option value="sublingual">{t("prescriptionsPage.routes.sublingual")}</option>
                            <option value="rectal">{t("prescriptionsPage.routes.rectal")}</option>
                            <option value="ophthalmic">{t("prescriptionsPage.routes.ophthalmic")}</option>
                            <option value="otic">{t("prescriptionsPage.routes.otic")}</option>
                            <option value="nasal">{t("prescriptionsPage.routes.nasal")}</option>
                          </select>
                        </div>

                        <div className="rx-form-group">
                          <label className="rx-label">{t("prescriptions.frequency")}</label>
                          <input
                            type="text"
                            value={item.frequency}
                            onChange={(e) => handleCustomItemChange(idx, "frequency", e.target.value)}
                            placeholder={t("prescriptionsPage.frequencyPlaceholder")}
                          />
                        </div>

                        <div className="rx-form-group">
                          <label className="rx-label">{t("prescriptions.duration")}</label>
                          <input
                            type="text"
                            value={item.duration}
                            onChange={(e) => handleCustomItemChange(idx, "duration", e.target.value)}
                            placeholder={t("prescriptionsPage.durationPlaceholder")}
                          />
                        </div>

                        <div className="rx-form-group rx-form-group-full">
                          <label className="rx-label">{t("prescriptions.instructions")}</label>
                          <input
                            type="text"
                            value={item.instructions}
                            onChange={(e) => handleCustomItemChange(idx, "instructions", e.target.value)}
                            placeholder={t("prescriptionsPage.instructionsPlaceholder")}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes textarea */}
              <div className="rx-form-group">
                <label className="rx-label">
                  {isCustomMode ? t("prescriptionsPage.additionalNotes") : t("prescriptionsPage.editFreely")}
                </label>
                <textarea
                  className="rx-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("prescriptionsPage.writePrescription")}
                  style={isCustomMode ? { minHeight: 100 } : {}}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved prescriptions */}
      <div className="rx-card" style={{ marginTop: 20 }}>
        <div className="rx-card-header">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <h3 className="rx-card-title">{t("prescriptionsPage.savedPrescriptions")}</h3>
              <p className="rx-card-subtitle">{t("prescriptionsPage.filterAndPrint")}</p>
            </div>
            <button className="rx-btn" onClick={loadSavedPrescriptions} disabled={rxLoading}>
              {rxLoading ? t("common.loading") : t("common.refresh")}
            </button>
          </div>
        </div>

        <div className="rx-card-body">
          {/* Filters */}
          <div className="rx-filters">
            <div className="rx-form-group">
              <label className="rx-label">{t("prescriptionsPage.filterByPatient")}</label>
              <select
                value={filterPatientId}
                onChange={(e) => setFilterPatientId(e.target.value)}
                disabled={patientsLoading}
              >
                <option value="">{t("prescriptionsPage.allPatients")}</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} (#{p.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="rx-form-group">
              <label className="rx-label">{t("prescriptionsPage.filterByVisit")}</label>
              <input
                value={filterVisitId}
                onChange={(e) => setFilterVisitId(e.target.value.replace(/[^\d]/g, ""))}
                placeholder={t("prescriptionsPage.typeVisitId")}
              />
            </div>

            <div className="rx-filter-actions">
              <button
                className="rx-btn"
                onClick={() => {
                  setFilterPatientId("");
                  setFilterVisitId("");
                }}
              >
                {t("prescriptionsPage.clearFilters")}
              </button>
              {visitFromQuery && (
                <button className="rx-btn" onClick={() => navigate(-1)}>
                  {t("prescriptionsPage.backToVisit")}
                </button>
              )}
            </div>
          </div>

          {rxError && (
            <div className="rx-message error" style={{ marginTop: 16 }}>{rxError}</div>
          )}

          {/* Table */}
          {rxLoading ? (
            <div style={{ marginTop: 16, color: "var(--muted)" }}>{t("prescriptionsPage.loadingSaved")}</div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="rx-empty">{t("prescriptionsPage.noMatching")}</div>
          ) : (
            <>
              <div className="rx-table-container">
                <table className="rx-table">
                  <thead>
                    <tr>
                      <th>{t("prescriptionsPage.rxNumber")}</th>
                      <th>{t("prescriptionsPage.patient")}</th>
                      <th>{t("prescriptionsPage.visitColumn")}</th>
                      <th>{t("prescriptionsPage.created")}</th>
                      <th>{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrescriptions.map((rx) => {
                      const rxId = rx?.id ?? "-";
                      const vId = getVisitIdFromRx(rx);
                      const patientLabel = getPatientLabelFromRx(rx);
                      const createdAt = rx?.created_at ?? rx?.created ?? rx?.createdAt ?? null;
                      const createdLabel = formatDateTime(createdAt);

                      return (
                        <tr key={String(rxId)}>
                          <td><strong>#{rxId}</strong></td>
                          <td title={patientLabel}>{patientLabel}</td>
                          <td>#{vId}</td>
                          <td>{createdLabel}</td>
                          <td>
                            <div className="rx-table-actions">
                              <button
                                className="rx-btn rx-btn-sm"
                                onClick={() => setViewRx(rx)}
                              >
                                {t("common.view")}
                              </button>
                              <button
                                className="rx-btn rx-btn-sm rx-btn-primary"
                                onClick={() => handleDownloadPdf(rxId)}
                                disabled={downloadingId === rxId}
                              >
                                {downloadingId === rxId ? t("visitDetail.downloading") : t("prescriptionsPage.printPdf")}
                              </button>
                              <button
                                className="rx-btn rx-btn-sm rx-btn-danger"
                                onClick={() => setDeleteConfirmId(rxId)}
                              >
                                {t("common.delete")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {t("prescriptionsPage.note") && (
                <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: 12 }}>
                  {t("prescriptionsPage.note")}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* View prescription modal */}
      {viewRx && (
        <div className="rx-modal-overlay" onClick={() => setViewRx(null)}>
          <div className="rx-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rx-modal-header">
              <h3 className="rx-modal-title">
                {t("visitDetail.prescriptionNumber", { id: viewRx.id })}
              </h3>
              <button className="rx-btn rx-btn-sm" onClick={() => setViewRx(null)}>
                {t("common.close")}
              </button>
            </div>

            <div className="rx-modal-body">
              <div className="rx-detail-section">
                <div className="rx-detail-label">{t("prescriptionsPage.patient")}</div>
                <div className="rx-detail-value">{getPatientLabelFromRx(viewRx)}</div>
              </div>

              <div className="rx-detail-section">
                <div className="rx-detail-label">{t("prescriptionsPage.visitColumn")}</div>
                <div className="rx-detail-value">#{getVisitIdFromRx(viewRx)}</div>
              </div>

              <div className="rx-detail-section">
                <div className="rx-detail-label">{t("prescriptions.medications")}</div>
                {viewRx.items?.length > 0 ? (
                  <div style={{ marginTop: 8 }}>
                    {viewRx.items.map((item, idx) => (
                      <div key={idx} className="rx-medication-item">
                        <div className="rx-medication-name">
                          {item.medication_display || item.medication?.name || `Medication #${item.medication}`}
                        </div>
                        <div className="rx-medication-details">
                          {[item.dosage, item.route, item.frequency, item.duration]
                            .filter(Boolean)
                            .join(" | ")}
                        </div>
                        {item.instructions && (
                          <div className="rx-medication-instructions">{item.instructions}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "var(--muted)" }}>{t("prescriptionsPage.noMedications")}</div>
                )}
              </div>

              {viewRx.notes && (
                <div className="rx-detail-section">
                  <div className="rx-detail-label">{t("visits.notes")}</div>
                  <div className="rx-detail-value rx-notes">{viewRx.notes}</div>
                </div>
              )}

              <div className="rx-detail-section">
                <div className="rx-detail-label">{t("prescriptionsPage.created")}</div>
                <div className="rx-detail-value">
                  {formatDateTime(viewRx.created_at)}
                </div>
              </div>
            </div>

            <div className="rx-modal-footer">
              <button
                className="rx-btn rx-btn-primary"
                onClick={() => handleDownloadPdf(viewRx.id)}
                disabled={downloadingId === viewRx.id}
              >
                {downloadingId === viewRx.id ? t("visitDetail.downloading") : t("visitDetail.downloadPdf")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="rx-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="rx-modal rx-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rx-modal-header">
              <h3 className="rx-modal-title">{t("prescriptionsPage.confirmDelete")}</h3>
            </div>
            <div className="rx-modal-body">
              <p className="rx-confirm-message">{t("prescriptionsPage.deleteWarning")}</p>
            </div>
            <div className="rx-modal-footer">
              <button className="rx-btn" onClick={() => setDeleteConfirmId(null)}>
                {t("common.cancel")}
              </button>
              <button className="rx-btn rx-btn-danger" onClick={() => handleDelete(deleteConfirmId)}>
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Edit/Create Modal */}
      {templateModalOpen && (
        <div className="rx-modal-overlay" onClick={closeTemplateModal}>
          <div className="rx-modal rx-template-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rx-modal-header">
              <h3 className="rx-modal-title">
                {editingTemplate ? t("prescriptionsPage.editTemplate") : t("prescriptionsPage.createTemplate")}
              </h3>
              <button className="rx-btn rx-btn-sm" onClick={closeTemplateModal}>
                {t("common.close")}
              </button>
            </div>

            <div className="rx-modal-body">
              {templateLoading ? (
                <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
                  {t("common.loading")}
                </div>
              ) : (
              <div className="rx-template-form">
                <div className="rx-form-row">
                  <div className="rx-form-group">
                    <label className="rx-label">{t("prescriptionsPage.templateNameEn")}</label>
                    <input
                      type="text"
                      value={templateForm.name}
                      onChange={(e) => handleTemplateFormChange("name", e.target.value)}
                      placeholder={t("prescriptionsPage.templateNamePlaceholder")}
                    />
                  </div>
                  <div className="rx-form-group">
                    <label className="rx-label">{t("prescriptionsPage.templateNameFr")}</label>
                    <input
                      type="text"
                      value={templateForm.name_fr}
                      onChange={(e) => handleTemplateFormChange("name_fr", e.target.value)}
                      placeholder={t("prescriptionsPage.templateNameFrPlaceholder")}
                    />
                  </div>
                </div>

                <div className="rx-form-row">
                  <div className="rx-form-group">
                    <label className="rx-label">{t("prescriptionsPage.descriptionEn")}</label>
                    <input
                      type="text"
                      value={templateForm.description}
                      onChange={(e) => handleTemplateFormChange("description", e.target.value)}
                      placeholder={t("prescriptionsPage.descriptionPlaceholder")}
                    />
                  </div>
                  <div className="rx-form-group">
                    <label className="rx-label">{t("prescriptionsPage.descriptionFr")}</label>
                    <input
                      type="text"
                      value={templateForm.description_fr}
                      onChange={(e) => handleTemplateFormChange("description_fr", e.target.value)}
                      placeholder={t("prescriptionsPage.descriptionFrPlaceholder")}
                    />
                  </div>
                </div>

                <div className="rx-template-items-section">
                  <div className="rx-template-items-header">
                    <label className="rx-label">{t("prescriptions.medications")}</label>
                    <button type="button" className="rx-btn rx-btn-sm" onClick={addTemplateItem}>
                      + {t("prescriptionsPage.addMedication")}
                    </button>
                  </div>

                  {templateForm.items.map((item, idx) => (
                    <div key={idx} className="rx-template-item-form">
                      <div className="rx-template-item-form-header">
                        <span className="rx-custom-item-number">{idx + 1}</span>
                        {templateForm.items.length > 1 && (
                          <button
                            type="button"
                            className="rx-btn rx-btn-sm rx-btn-danger"
                            onClick={() => removeTemplateItem(idx)}
                          >
                            {t("common.delete")}
                          </button>
                        )}
                      </div>

                      <div className="rx-template-item-form-grid">
                        <div className="rx-form-group">
                          <label className="rx-label">{t("prescriptionsPage.medication")}</label>
                          <div className="rx-medication-select-row">
                            <select
                              value={item.medication}
                              onChange={(e) => handleTemplateItemChange(idx, "medication", e.target.value)}
                              disabled={medicationsLoading}
                            >
                              <option value="">{t("prescriptionsPage.selectMedication")}</option>
                              {medications.map((med) => (
                                <option key={med.id} value={med.id}>
                                  {getMedDisplay(med)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="rx-btn rx-btn-sm rx-btn-new-med"
                              onClick={openNewMedModal}
                              title={t("prescriptionsPage.createMedication")}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="rx-form-group">
                          <label className="rx-label">{t("prescriptions.dosage")}</label>
                          <input
                            type="text"
                            value={item.dosage}
                            onChange={(e) => handleTemplateItemChange(idx, "dosage", e.target.value)}
                            placeholder={t("prescriptionsPage.dosagePlaceholder")}
                          />
                        </div>

                        <div className="rx-form-group">
                          <label className="rx-label">{t("prescriptionsPage.route")}</label>
                          <select
                            value={item.route}
                            onChange={(e) => handleTemplateItemChange(idx, "route", e.target.value)}
                          >
                            <option value="">{t("prescriptionsPage.selectRoute")}</option>
                            <option value="oral">{t("prescriptionsPage.routes.oral")}</option>
                            <option value="topical">{t("prescriptionsPage.routes.topical")}</option>
                            <option value="inhalation">{t("prescriptionsPage.routes.inhalation")}</option>
                            <option value="injection">{t("prescriptionsPage.routes.injection")}</option>
                            <option value="sublingual">{t("prescriptionsPage.routes.sublingual")}</option>
                            <option value="rectal">{t("prescriptionsPage.routes.rectal")}</option>
                            <option value="ophthalmic">{t("prescriptionsPage.routes.ophthalmic")}</option>
                            <option value="otic">{t("prescriptionsPage.routes.otic")}</option>
                            <option value="nasal">{t("prescriptionsPage.routes.nasal")}</option>
                          </select>
                        </div>

                        <div className="rx-form-group">
                          <label className="rx-label">{t("prescriptions.frequency")}</label>
                          <input
                            type="text"
                            value={item.frequency}
                            onChange={(e) => handleTemplateItemChange(idx, "frequency", e.target.value)}
                            placeholder={t("prescriptionsPage.frequencyPlaceholder")}
                          />
                        </div>

                        <div className="rx-form-group">
                          <label className="rx-label">{t("prescriptions.duration")}</label>
                          <input
                            type="text"
                            value={item.duration}
                            onChange={(e) => handleTemplateItemChange(idx, "duration", e.target.value)}
                            placeholder={t("prescriptionsPage.durationPlaceholder")}
                          />
                        </div>

                        <div className="rx-form-group">
                          <label className="rx-label">{t("prescriptions.instructions")}</label>
                          <input
                            type="text"
                            value={item.instructions}
                            onChange={(e) => handleTemplateItemChange(idx, "instructions", e.target.value)}
                            placeholder={t("prescriptionsPage.instructionsPlaceholder")}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>

            <div className="rx-modal-footer">
              {editingTemplate && (
                <button
                  className="rx-btn rx-btn-danger"
                  onClick={handleDeleteTemplate}
                  disabled={templateDeleting || templateSaving}
                >
                  {templateDeleting ? t("common.deleting") : t("common.delete")}
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button className="rx-btn" onClick={closeTemplateModal} disabled={templateSaving}>
                {t("common.cancel")}
              </button>
              <button
                className="rx-btn rx-btn-primary"
                onClick={handleSaveTemplate}
                disabled={templateSaving || templateDeleting}
              >
                {templateSaving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Medication Modal */}
      {newMedModalOpen && (
        <div className="rx-modal-overlay" onClick={closeNewMedModal}>
          <div className="rx-modal rx-new-med-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rx-modal-header">
              <h3 className="rx-modal-title">{t("prescriptionsPage.createMedication")}</h3>
              <button className="rx-btn rx-btn-sm" onClick={closeNewMedModal}>
                {t("common.close")}
              </button>
            </div>

            <div className="rx-modal-body">
              <div className="rx-form-group">
                <label className="rx-label">{t("prescriptionsPage.medName")} *</label>
                <input
                  type="text"
                  value={newMedForm.name}
                  onChange={(e) => setNewMedForm({ ...newMedForm, name: e.target.value })}
                  placeholder={t("prescriptionsPage.medNamePlaceholder")}
                />
              </div>

              <div className="rx-form-group">
                <label className="rx-label">{t("prescriptionsPage.medStrength")}</label>
                <input
                  type="text"
                  value={newMedForm.strength}
                  onChange={(e) => setNewMedForm({ ...newMedForm, strength: e.target.value })}
                  placeholder={t("prescriptionsPage.medStrengthPlaceholder")}
                />
              </div>

              <div className="rx-form-group">
                <label className="rx-label">{t("prescriptionsPage.medForm")}</label>
                <input
                  type="text"
                  value={newMedForm.form}
                  onChange={(e) => setNewMedForm({ ...newMedForm, form: e.target.value })}
                  placeholder={t("prescriptionsPage.medFormPlaceholder")}
                />
              </div>
            </div>

            <div className="rx-modal-footer">
              <button className="rx-btn" onClick={closeNewMedModal} disabled={newMedSaving}>
                {t("common.cancel")}
              </button>
              <button
                className="rx-btn rx-btn-primary"
                onClick={handleSaveNewMedication}
                disabled={newMedSaving}
              >
                {newMedSaving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
