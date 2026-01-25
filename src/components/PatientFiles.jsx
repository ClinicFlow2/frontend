// src/components/PatientFiles.jsx
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  getPatientFiles,
  uploadPatientFile,
  deletePatientFile,
  downloadPatientFile,
} from "../api/patients";

const FILE_CATEGORIES = [
  { value: "lab_result", labelKey: "patientFiles.categories.labResult" },
  { value: "imaging", labelKey: "patientFiles.categories.imaging" },
  { value: "prescription", labelKey: "patientFiles.categories.prescription" },
  { value: "consent", labelKey: "patientFiles.categories.consent" },
  { value: "insurance", labelKey: "patientFiles.categories.insurance" },
  { value: "other", labelKey: "patientFiles.categories.other" },
];

export default function PatientFiles({ patientId }) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Upload form state
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");

  // Preview modal state
  const [previewFile, setPreviewFile] = useState(null);

  // Collapse state
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    loadFiles();
  }, [patientId]);

  async function loadFiles() {
    setLoading(true);
    setError("");
    try {
      const data = await getPatientFiles(patientId);
      setFiles(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Error loading files:", err);
      setError(t("patientFiles.loadError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      await uploadPatientFile(patientId, selectedFile, category, description);
      setSuccess(t("patientFiles.uploadSuccess"));
      setSelectedFile(null);
      setCategory("other");
      setDescription("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await loadFiles();
    } catch (err) {
      console.error("Upload error:", err);
      const msg = err.response?.data?.file?.[0] || err.response?.data?.detail || t("patientFiles.uploadError");
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(fileId, filename) {
    if (!confirm(t("patientFiles.confirmDelete", { filename }))) return;

    try {
      await deletePatientFile(patientId, fileId);
      setSuccess(t("patientFiles.deleteSuccess"));
      await loadFiles();
    } catch (err) {
      console.error("Delete error:", err);
      setError(t("patientFiles.deleteError"));
    }
  }

  async function handleDownload(fileId, filename) {
    try {
      const blob = await downloadPatientFile(patientId, fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download error:", err);
      setError(t("patientFiles.downloadError"));
    }
  }

  async function handlePreview(file) {
    try {
      const blob = await downloadPatientFile(patientId, file.id);
      const url = window.URL.createObjectURL(blob);
      setPreviewFile({ ...file, previewUrl: url });
    } catch (err) {
      console.error("Preview error:", err);
      setError(t("patientFiles.downloadError"));
    }
  }

  function closePreview() {
    if (previewFile?.previewUrl) {
      window.URL.revokeObjectURL(previewFile.previewUrl);
    }
    setPreviewFile(null);
  }

  function isPreviewable(fileType) {
    return fileType?.startsWith("image/") || fileType === "application/pdf";
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileIcon(fileType) {
    if (fileType?.startsWith("image/")) return "🖼️";
    if (fileType === "application/pdf") return "📄";
    if (fileType?.includes("word")) return "📝";
    return "📎";
  }

  function getCategoryLabel(cat) {
    const found = FILE_CATEGORIES.find((c) => c.value === cat);
    return found ? t(found.labelKey) : cat;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={styles.collapseBtn}
          aria-expanded={expanded}
        >
          <span style={{
            ...styles.chevron,
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          }}>
            ▶
          </span>
          <h3 style={styles.title}>
            {t("patientFiles.title")}
            {!loading && files.length > 0 && (
              <span style={styles.countBadge}>{files.length}</span>
            )}
          </h3>
        </button>
      </div>

      {expanded && (
        <>
          {/* Messages */}
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          {/* Upload Form */}
          <form onSubmit={handleUpload} style={styles.uploadForm}>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>{t("patientFiles.upload")}</label>
            <div style={styles.customFileInput}>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                style={styles.hiddenFileInput}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                id="patient-file-input"
              />
              <label htmlFor="patient-file-input" style={styles.fileInputLabel}>
                {t("patientFiles.chooseFile")}
              </label>
              <span style={styles.fileInputText}>
                {selectedFile ? selectedFile.name : t("patientFiles.noFileSelected")}
              </span>
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>{t("patientFiles.category")}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.select}
            >
              {FILE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {t(cat.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>{t("patientFiles.descriptionPlaceholder")}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("patientFiles.descriptionPlaceholder")}
              style={styles.descInput}
            />
          </div>
          <div style={{ ...styles.formGroup, justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              style={{
                ...styles.uploadBtn,
                opacity: !selectedFile || uploading ? 0.6 : 1,
              }}
            >
              {uploading ? t("patientFiles.uploading") : t("patientFiles.upload")}
            </button>
          </div>
        </div>
      </form>

      {/* File List */}
      {loading ? (
        <p style={styles.loadingText}>{t("common.loading")}</p>
      ) : files.length === 0 ? (
        <p style={styles.emptyText}>{t("patientFiles.noFiles")}</p>
      ) : (
        <div style={styles.fileList}>
          {files.map((file) => (
            <div key={file.id} style={styles.fileCard}>
              <div style={styles.fileIcon}>{getFileIcon(file.file_type)}</div>
              <div style={styles.fileInfo}>
                <div style={styles.fileName}>{file.original_filename}</div>
                <div style={styles.fileMeta}>
                  <span style={styles.categoryBadge}>
                    {getCategoryLabel(file.category)}
                  </span>
                  <span>{formatFileSize(file.file_size)}</span>
                  <span>
                    {new Date(file.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
                {file.description && (
                  <div style={styles.fileDesc}>{file.description}</div>
                )}
              </div>
              <div style={styles.fileActions}>
                {isPreviewable(file.file_type) && (
                  <button
                    onClick={() => handlePreview(file)}
                    style={styles.viewBtn}
                    title={t("patientFiles.view")}
                  >
                    👁️
                  </button>
                )}
                <button
                  onClick={() => handleDownload(file.id, file.original_filename)}
                  style={styles.downloadBtn}
                  title={t("patientFiles.download")}
                >
                  ⬇️
                </button>
                <button
                  onClick={() => handleDelete(file.id, file.original_filename)}
                  style={styles.deleteBtn}
                  title={t("patientFiles.delete")}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {/* Preview Modal - always rendered outside of expanded check */}
      {previewFile && (
        <div style={styles.modalOverlay} onClick={closePreview}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>{previewFile.original_filename}</span>
              <button onClick={closePreview} style={styles.modalCloseBtn}>
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              {previewFile.file_type?.startsWith("image/") ? (
                <img
                  src={previewFile.previewUrl}
                  alt={previewFile.original_filename}
                  style={styles.previewImage}
                />
              ) : previewFile.file_type === "application/pdf" ? (
                <iframe
                  src={previewFile.previewUrl}
                  title={previewFile.original_filename}
                  style={styles.previewPdf}
                />
              ) : null}
            </div>
            <div style={styles.modalFooter}>
              <button
                onClick={() => handleDownload(previewFile.id, previewFile.original_filename)}
                style={styles.modalDownloadBtn}
              >
                {t("patientFiles.download")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginTop: 24,
    padding: 20,
    background: "var(--card-bg, #fff)",
    borderRadius: 12,
    border: "1px solid var(--border-color, #e5e7eb)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  collapseBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  chevron: {
    fontSize: "0.75rem",
    color: "var(--text-secondary, #6b7280)",
    transition: "transform 200ms ease",
  },
  title: {
    margin: 0,
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "var(--text-primary, #1f2937)",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  countBadge: {
    fontSize: "0.75rem",
    fontWeight: 500,
    padding: "2px 8px",
    background: "rgba(37, 99, 235, 0.1)",
    color: "#2563eb",
    borderRadius: 10,
  },
  error: {
    padding: "10px 14px",
    marginBottom: 12,
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: 8,
    color: "#dc2626",
    fontSize: "0.875rem",
  },
  success: {
    padding: "10px 14px",
    marginBottom: 12,
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    borderRadius: 8,
    color: "#10b981",
    fontSize: "0.875rem",
  },
  uploadForm: {
    marginBottom: 20,
    padding: 16,
    background: "var(--bg-secondary, #f9fafb)",
    borderRadius: 8,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 12,
    marginBottom: 12,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--text-secondary, #6b7280)",
  },
  customFileInput: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  hiddenFileInput: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
  },
  fileInputLabel: {
    padding: "8px 16px",
    background: "var(--input-bg, #fff)",
    border: "1px solid var(--border-color, #d1d5db)",
    borderRadius: 6,
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--text-primary, #1f2937)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 150ms ease",
  },
  fileInputText: {
    fontSize: "0.875rem",
    color: "var(--text-secondary, #6b7280)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 300,
  },
  select: {
    padding: "8px 12px",
    border: "1px solid var(--border-color, #d1d5db)",
    borderRadius: 6,
    fontSize: "0.875rem",
    background: "var(--input-bg, #fff)",
    color: "var(--text-primary, #1f2937)",
    minWidth: 150,
    height: 38,
  },
  descInput: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid var(--border-color, #d1d5db)",
    borderRadius: 6,
    fontSize: "0.875rem",
    background: "var(--input-bg, #fff)",
    color: "var(--text-primary, #1f2937)",
  },
  uploadBtn: {
    padding: "8px 20px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  loadingText: {
    color: "var(--text-secondary, #6b7280)",
    textAlign: "center",
    padding: 20,
  },
  emptyText: {
    color: "var(--text-secondary, #6b7280)",
    textAlign: "center",
    padding: 20,
    fontStyle: "italic",
  },
  fileList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  fileCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    background: "var(--bg-secondary, #f9fafb)",
    borderRadius: 8,
    border: "1px solid var(--border-color, #e5e7eb)",
  },
  fileIcon: {
    fontSize: "1.5rem",
    width: 40,
    textAlign: "center",
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontWeight: 500,
    color: "var(--text-primary, #1f2937)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  fileMeta: {
    display: "flex",
    gap: 10,
    fontSize: "0.75rem",
    color: "var(--text-secondary, #6b7280)",
    marginTop: 4,
  },
  categoryBadge: {
    padding: "2px 8px",
    background: "rgba(37, 99, 235, 0.1)",
    color: "#2563eb",
    borderRadius: 4,
    fontWeight: 500,
  },
  fileDesc: {
    fontSize: "0.8rem",
    color: "var(--text-secondary, #6b7280)",
    marginTop: 4,
    fontStyle: "italic",
  },
  fileActions: {
    display: "flex",
    gap: 6,
  },
  downloadBtn: {
    padding: "6px 10px",
    background: "transparent",
    border: "1px solid var(--border-color, #d1d5db)",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "1rem",
  },
  deleteBtn: {
    padding: "6px 10px",
    background: "transparent",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "1rem",
  },
  viewBtn: {
    padding: "6px 10px",
    background: "transparent",
    border: "1px solid rgba(37, 99, 235, 0.3)",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "1rem",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "var(--card-bg, #fff)",
    borderRadius: 12,
    maxWidth: "90vw",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid var(--border-color, #e5e7eb)",
  },
  modalTitle: {
    fontWeight: 600,
    color: "var(--text-primary, #1f2937)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "calc(100% - 40px)",
  },
  modalCloseBtn: {
    background: "transparent",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
    color: "var(--text-secondary, #6b7280)",
    padding: "4px 8px",
  },
  modalBody: {
    flex: 1,
    overflow: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    background: "var(--bg-secondary, #f9fafb)",
  },
  previewImage: {
    maxWidth: "100%",
    maxHeight: "70vh",
    objectFit: "contain",
  },
  previewPdf: {
    width: "80vw",
    height: "70vh",
    border: "none",
  },
  modalFooter: {
    padding: "12px 16px",
    borderTop: "1px solid var(--border-color, #e5e7eb)",
    display: "flex",
    justifyContent: "flex-end",
  },
  modalDownloadBtn: {
    padding: "8px 16px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
};
