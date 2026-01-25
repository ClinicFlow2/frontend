// src/components/PatientPrescriptions.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPrescriptions, downloadPrescriptionPdf } from "../api/prescriptions";
import { formatDate } from "../utils/dateFormat";

export default function PatientPrescriptions({ patientId }) {
  const { t, i18n } = useTranslation();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, [patientId]);

  async function loadPrescriptions() {
    setLoading(true);
    setError("");
    try {
      const data = await getPrescriptions({ patientId, pageSize: 50 });
      const results = Array.isArray(data) ? data : data.results || [];
      setPrescriptions(results);
    } catch (err) {
      console.error("Error loading prescriptions:", err);
      setError(t("prescriptions.loadError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPdf(prescriptionId) {
    try {
      await downloadPrescriptionPdf(prescriptionId, i18n.language);
    } catch (err) {
      console.error("PDF download error:", err);
      setError(t("prescriptions.pdfError"));
    }
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
            {t("patientPrescriptions.title")}
            {!loading && prescriptions.length > 0 && (
              <span style={styles.countBadge}>{prescriptions.length}</span>
            )}
          </h3>
        </button>
        <Link
          to={`/prescriptions?patient=${patientId}`}
          style={styles.newBtn}
        >
          + {t("patientPrescriptions.newPrescription")}
        </Link>
      </div>

      {expanded && (
        <>
          {error && <div style={styles.error}>{error}</div>}

          {loading ? (
            <p style={styles.loadingText}>{t("common.loading")}</p>
          ) : prescriptions.length === 0 ? (
            <p style={styles.emptyText}>{t("patientPrescriptions.noPrescriptions")}</p>
          ) : (
            <div style={styles.list}>
              {prescriptions.map((rx) => (
                <div key={rx.id} style={styles.card}>
                  <div style={styles.cardIcon}>📋</div>
                  <div style={styles.cardInfo}>
                    <div style={styles.cardTitle}>
                      {t("patientPrescriptions.prescription")} #{rx.id}
                    </div>
                    <div style={styles.cardMeta}>
                      <span>{formatDate(rx.created_at)}</span>
                      {rx.items_count > 0 && (
                        <span style={styles.itemsBadge}>
                          {rx.items_count} {t("patientPrescriptions.items")}
                        </span>
                      )}
                      {rx.doctor_name && (
                        <span style={styles.doctorName}>
                          {t("patientPrescriptions.by")} {rx.doctor_name}
                        </span>
                      )}
                    </div>
                    {rx.notes && (
                      <div style={styles.notes}>{rx.notes}</div>
                    )}
                  </div>
                  <div style={styles.actions}>
                    <button
                      onClick={() => handleDownloadPdf(rx.id)}
                      style={styles.pdfBtn}
                      title={t("prescriptions.downloadPdf")}
                    >
                      📄
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
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
  newBtn: {
    padding: "8px 16px",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 6,
    fontSize: "0.875rem",
    fontWeight: 500,
    textDecoration: "none",
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
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    background: "var(--bg-secondary, #f9fafb)",
    borderRadius: 8,
    border: "1px solid var(--border-color, #e5e7eb)",
  },
  cardIcon: {
    fontSize: "1.5rem",
    width: 40,
    textAlign: "center",
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontWeight: 500,
    color: "var(--text-primary, #1f2937)",
  },
  cardMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    fontSize: "0.75rem",
    color: "var(--text-secondary, #6b7280)",
    marginTop: 4,
  },
  itemsBadge: {
    padding: "2px 8px",
    background: "rgba(37, 99, 235, 0.1)",
    color: "#2563eb",
    borderRadius: 4,
    fontWeight: 500,
  },
  doctorName: {
    fontStyle: "italic",
  },
  notes: {
    fontSize: "0.8rem",
    color: "var(--text-secondary, #6b7280)",
    marginTop: 4,
    fontStyle: "italic",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  actions: {
    display: "flex",
    gap: 6,
  },
  pdfBtn: {
    padding: "6px 10px",
    background: "transparent",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "1rem",
  },
};
