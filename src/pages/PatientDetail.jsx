// src/pages/PatientDetail.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPatient, updatePatient } from "../api/patients";

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    sex: "M",
    phone: "",
    date_of_birth: "",
    address: "",
  });

  async function load() {
    setLoading(true);
    try {
      const data = await getPatient(id);
      setPatient(data);

      // initialize edit form from server
      setForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        sex: data.sex || "M",
        phone: data.phone || "",
        date_of_birth: data.date_of_birth || "",
        address: data.address || "",
      });
    } catch (err) {
      console.log("PATIENT DETAIL ERROR:", err?.response?.data || err);
      alert("❌ Failed to load patient details.");
      navigate("/patients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        sex: form.sex,
        phone: form.phone.trim(),
        date_of_birth: form.date_of_birth,
        address: form.address.trim(),
      };

      const updated = await updatePatient(id, payload);
      setPatient(updated);
      setEditing(false);
      alert("✅ Patient updated!");
    } catch (err) {
      console.log("UPDATE PATIENT ERROR:", err?.response?.data || err);
      alert(
        "❌ Failed to update patient:\n" +
          JSON.stringify(err?.response?.data || err, null, 2)
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ marginTop: 20 }}>Loading patient...</p>;
  if (!patient) return null;

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate("/patients")}>← Back</button>

      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 14 }}>
        <h2 style={{ margin: 0 }}>
          {patient.first_name} {patient.last_name}
        </h2>
        <span style={{ color: "#666" }}>{patient.patient_code || "-"}</span>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              style={btn}
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  // reset to server values
                  setForm({
                    first_name: patient.first_name || "",
                    last_name: patient.last_name || "",
                    sex: patient.sex || "M",
                    phone: patient.phone || "",
                    date_of_birth: patient.date_of_birth || "",
                    address: patient.address || "",
                  });
                  setEditing(false);
                }}
                style={btn}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{ ...btn, fontWeight: 700 }}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEW MODE */}
      {!editing && (
        <div style={{ marginTop: 12, lineHeight: 1.9 }}>
          <div><b>Patient code:</b> {patient.patient_code || "-"}</div>
          <div><b>Sex:</b> {patient.sex || "-"}</div>
          <div><b>Date of birth:</b> {patient.date_of_birth || "-"}</div>
          <div><b>Phone:</b> {patient.phone || "-"}</div>
          <div><b>Address:</b> {patient.address || "-"}</div>

          {/* Future field (once backend provides it) */}
          <div><b>Last visit:</b> {patient.last_visit_date || "-"}</div>
        </div>
      )}

      {/* EDIT MODE */}
      {editing && (
        <form
          onSubmit={handleSave}
          style={{
            marginTop: 14,
            padding: 16,
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            background: "white",
            maxWidth: 640,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Edit Patient</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              placeholder="First name"
              required
              style={input}
            />
            <input
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              placeholder="Last name"
              required
              style={input}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <select
              value={form.sex}
              onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}
              style={input}
              required
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>

            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Phone"
              style={input}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
              required
              style={input}
            />

            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Address"
              required
              style={input}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#f7f7f7",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      )}
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

const input = {
  padding: 10,
  border: "1px solid #ddd",
  borderRadius: 8,
};
