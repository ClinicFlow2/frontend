// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getProfile, updateProfile, changePassword } from "../api/profile";
import { api } from "../api/client";

// Role badge colors
const roleColors = {
  admin: { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "rgba(239, 68, 68, 0.2)" },
  doctor: { bg: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.2)" },
  nurse: { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "rgba(16, 185, 129, 0.2)" },
};

// Icons
const Icons = {
  User: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Mail: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  Phone: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Building: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
    </svg>
  ),
  Badge: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
    </svg>
  ),
  Stethoscope: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>
    </svg>
  ),
  Edit: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
    </svg>
  ),
};

export default function Profile() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    specialization: "",
    license_number: "",
    department: "",
    bio: "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Password visibility state
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const data = await getProfile();
      setUser(data);
      setFormData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone: data.profile?.phone || "",
        specialization: data.profile?.specialization || "",
        license_number: data.profile?.license_number || "",
        department: data.profile?.department || "",
        bio: data.profile?.bio || "",
      });
    } catch (err) {
      console.error("Failed to load profile:", err);
      setError(t("profile.loadError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await updateProfile(formData);
      setUser(data);
      setEditMode(false);
      setSuccess(t("profile.updateSuccess"));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(err?.response?.data?.detail || t("profile.updateError"));
    } finally {
      setSaving(false);
    }
  }

  // Translate password error messages from backend
  function translatePasswordError(errorMsg) {
    if (!errorMsg) return t("profile.passwordError");

    // Map backend error messages to translation keys
    if (errorMsg.includes("at least 8 characters")) {
      return t("profile.passwordErrors.minLength");
    }
    if (errorMsg.includes("uppercase")) {
      return t("profile.passwordErrors.uppercase");
    }
    if (errorMsg.includes("lowercase")) {
      return t("profile.passwordErrors.lowercase");
    }
    if (errorMsg.includes("digit")) {
      return t("profile.passwordErrors.digit");
    }
    if (errorMsg.includes("special character")) {
      return t("profile.passwordErrors.special");
    }
    if (errorMsg.includes("do not match")) {
      return t("profile.passwordErrors.mismatch");
    }
    if (errorMsg.includes("incorrect")) {
      return t("profile.passwordErrors.incorrect");
    }

    return errorMsg;
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await changePassword(passwordData);
      setShowPasswordForm(false);
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
      setShowPasswords({ current: false, new: false, confirm: false });
      setSuccess(t("profile.passwordSuccess"));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to change password:", err);

      // Collect all error messages
      const errors = [];
      const data = err?.response?.data;

      if (data?.current_password) {
        errors.push(...data.current_password.map(translatePasswordError));
      }
      if (data?.new_password) {
        // new_password can be an array of errors
        const pwErrors = Array.isArray(data.new_password) ? data.new_password : [data.new_password];
        errors.push(...pwErrors.map(translatePasswordError));
      }
      if (data?.confirm_password) {
        errors.push(...data.confirm_password.map(translatePasswordError));
      }
      if (data?.detail) {
        errors.push(translatePasswordError(data.detail));
      }

      setError(errors.length > 0 ? errors.join(" ") : t("profile.passwordError"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="cf-animate-in" style={{ padding: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="cf-skeleton" style={{ height: 32, width: 150 }} />
          <div className="cf-skeleton" style={{ height: 200, borderRadius: 16 }} />
          <div className="cf-skeleton" style={{ height: 300, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  const role = user?.profile?.role || "nurse";
  const roleStyle = roleColors[role] || roleColors.nurse;

  return (
    <div className="cf-animate-in" style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ marginBottom: 24, color: "var(--text)" }}>{t("profile.title")}</h1>

      {/* Messages */}
      {error && (
        <div style={{
          marginBottom: 16,
          padding: "12px 16px",
          borderRadius: "var(--radius)",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          color: "#ef4444",
          fontSize: "0.875rem",
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          marginBottom: 16,
          padding: "12px 16px",
          borderRadius: "var(--radius)",
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          color: "#10b981",
          fontSize: "0.875rem",
        }}>
          {success}
        </div>
      )}

      {/* Profile Header Card */}
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}>
        {/* Avatar */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: roleStyle.bg,
          border: `2px solid ${roleStyle.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: roleStyle.color,
          flexShrink: 0,
        }}>
          <Icons.User />
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, color: "var(--text)", fontSize: "1.5rem" }}>
            {user?.full_name || user?.username}
          </h2>
          <p style={{ margin: "4px 0 12px", color: "var(--muted)", fontSize: "0.9375rem" }}>
            @{user?.username}
          </p>

          {/* Role Badge */}
          <span style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: 20,
            background: roleStyle.bg,
            border: `1px solid ${roleStyle.border}`,
            color: roleStyle.color,
            fontSize: "0.8125rem",
            fontWeight: 600,
            textTransform: "capitalize",
          }}>
            {user?.profile?.role_display || role}
          </span>
        </div>

        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--accent)",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--card)";
              e.currentTarget.style.color = "var(--accent)";
            }}
          >
            <Icons.Edit />
            {t("profile.editProfile")}
          </button>
        )}
      </div>

      {/* Profile Details / Edit Form */}
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
      }}>
        <h3 style={{ margin: "0 0 20px", color: "var(--text)", fontSize: "1.125rem" }}>
          {editMode ? t("profile.editInfo") : t("profile.personalInfo")}
        </h3>

        {editMode ? (
          <form onSubmit={handleSaveProfile}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>{t("profile.firstName")}</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  style={inputStyle}
                  placeholder={t("profile.firstName")}
                />
              </div>
              <div>
                <label style={labelStyle}>{t("profile.lastName")}</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  style={inputStyle}
                  placeholder={t("profile.lastName")}
                />
              </div>
              <div>
                <label style={labelStyle}>{t("profile.email")}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={inputStyle}
                  placeholder={t("profile.email")}
                />
              </div>
              <div>
                <label style={labelStyle}>{t("profile.phone")}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={inputStyle}
                  placeholder={t("profile.phone")}
                />
              </div>
              <div>
                <label style={labelStyle}>{t("profile.department")}</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  style={inputStyle}
                  placeholder={t("profile.department")}
                />
              </div>
              {(role === "doctor" || role === "nurse") && (
                <>
                  <div>
                    <label style={labelStyle}>{t("profile.specialization")}</label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      style={inputStyle}
                      placeholder={t("profile.specializationPlaceholder")}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>{t("profile.licenseNumber")}</label>
                    <input
                      type="text"
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      style={inputStyle}
                      placeholder={t("profile.licenseNumber")}
                    />
                  </div>
                </>
              )}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>{t("profile.bio")}</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                  placeholder={t("profile.bioPlaceholder")}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "10px 20px",
                  borderRadius: "var(--radius)",
                  border: "none",
                  background: "var(--accent)",
                  color: "white",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? t("common.saving") : t("common.save")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  // Reset form data
                  setFormData({
                    first_name: user?.first_name || "",
                    last_name: user?.last_name || "",
                    email: user?.email || "",
                    phone: user?.profile?.phone || "",
                    specialization: user?.profile?.specialization || "",
                    license_number: user?.profile?.license_number || "",
                    department: user?.profile?.department || "",
                    bio: user?.profile?.bio || "",
                  });
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <InfoItem icon={<Icons.Mail />} label={t("profile.email")} value={user?.email || "-"} />
            <InfoItem icon={<Icons.Phone />} label={t("profile.phone")} value={user?.profile?.phone || "-"} />
            <InfoItem icon={<Icons.Building />} label={t("profile.department")} value={user?.profile?.department || "-"} />
            {(role === "doctor" || role === "nurse") && (
              <>
                <InfoItem icon={<Icons.Stethoscope />} label={t("profile.specialization")} value={user?.profile?.specialization || "-"} />
                <InfoItem icon={<Icons.Badge />} label={t("profile.licenseNumber")} value={user?.profile?.license_number || "-"} />
              </>
            )}
            <InfoItem icon={<Icons.Calendar />} label={t("profile.memberSince")} value={formatDate(user?.date_joined)} />
            {user?.profile?.bio && (
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.8125rem", marginBottom: 4 }}>
                  {t("profile.bio")}
                </p>
                <p style={{ margin: 0, color: "var(--text)", fontSize: "0.9375rem", lineHeight: 1.6 }}>
                  {user.profile.bio}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Section */}
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ color: "var(--accent)" }}>
            <Icons.Lock />
          </div>
          <h3 style={{ margin: 0, color: "var(--text)", fontSize: "1.125rem" }}>
            {t("profile.security")}
          </h3>
        </div>

        {showPasswordForm ? (
          <form onSubmit={handleChangePassword}>
            <div style={{ display: "grid", gap: 16, maxWidth: 400 }}>
              <div>
                <label style={labelStyle}>{t("profile.currentPassword")}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    style={{ ...inputStyle, paddingRight: 40 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                      color: "var(--muted)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPasswords.current ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t("profile.newPassword")}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    style={{ ...inputStyle, paddingRight: 40 }}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                      color: "var(--muted)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPasswords.new ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
                  {t("profile.passwordRequirements")}
                </p>
              </div>
              <div>
                <label style={labelStyle}>{t("profile.confirmPassword")}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    style={{ ...inputStyle, paddingRight: 40 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                      color: "var(--muted)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPasswords.confirm ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "10px 20px",
                  borderRadius: "var(--radius)",
                  border: "none",
                  background: "var(--accent)",
                  color: "white",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? t("common.saving") : t("profile.changePassword")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
                  setShowPasswords({ current: false, new: false, confirm: false });
                  setError("");
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowPasswordForm(true)}
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--text)",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.875rem",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--card)";
            }}
          >
            {t("profile.changePassword")}
          </button>
        )}
      </div>

      {/* Availability Calendar - Only for doctors and admins */}
      {(role === "doctor" || role === "admin") && (
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          marginTop: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ color: "var(--accent)" }}>
              <Icons.Calendar />
            </div>
            <h3 style={{ margin: 0, color: "var(--text)", fontSize: "1.125rem" }}>
              {t("availability.title")}
            </h3>
          </div>
          <p style={{ margin: "0 0 20px", color: "var(--muted)", fontSize: "0.875rem" }}>
            {t("availability.description")}
          </p>
          <AvailabilityCalendar t={t} />
        </div>
      )}
    </div>
  );
}

// Helper component for info items
function InfoItem({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={{ color: "var(--muted)", marginTop: 2 }}>{icon}</div>
      <div>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.8125rem" }}>{label}</p>
        <p style={{ margin: "2px 0 0", color: "var(--text)", fontSize: "0.9375rem", fontWeight: 500 }}>{value}</p>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "var(--text)",
};

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  background: "var(--inputBg)",
  color: "var(--inputText)",
  fontSize: "0.9375rem",
  outline: "none",
  transition: "border-color 150ms ease",
  boxSizing: "border-box",
};

// Slot options for availability
const SLOT_OPTIONS = [
  { value: "full_day", label: "Full Day", color: "#22c55e" },
  { value: "morning", label: "Morning (8-12)", color: "#3b82f6" },
  { value: "afternoon", label: "Afternoon (12-17)", color: "#f59e0b" },
  { value: "evening", label: "Evening (17-21)", color: "#8b5cf6" },
  { value: "unavailable", label: "Unavailable", color: "#ef4444" },
];

function AvailabilityCalendar({ t }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilities, setAvailabilities] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("full_day");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    t("availability.months.january"), t("availability.months.february"),
    t("availability.months.march"), t("availability.months.april"),
    t("availability.months.may"), t("availability.months.june"),
    t("availability.months.july"), t("availability.months.august"),
    t("availability.months.september"), t("availability.months.october"),
    t("availability.months.november"), t("availability.months.december"),
  ];

  const dayNames = [
    t("availability.days.sun"), t("availability.days.mon"),
    t("availability.days.tue"), t("availability.days.wed"),
    t("availability.days.thu"), t("availability.days.fri"),
    t("availability.days.sat"),
  ];

  async function loadAvailabilities() {
    setLoading(true);
    try {
      const res = await api.get("/api/accounts/availability/", {
        params: { year, month: month + 1 }
      });
      const map = {};
      (res.data || []).forEach((a) => {
        map[a.date] = a;
      });
      setAvailabilities(map);
    } catch (err) {
      console.error("Failed to load availabilities:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAvailabilities();
  }, [year, month]);

  async function handleSetAvailability(date, slot) {
    setSaving(true);
    try {
      await api.post("/api/accounts/availability/", { date, slot });
      await loadAvailabilities();
      setSelectedDate(null);
    } catch (err) {
      console.error("Failed to set availability:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAvailability(date) {
    setSaving(true);
    try {
      await api.delete(`/api/accounts/availability/?date=${date}`);
      await loadAvailabilities();
      setSelectedDate(null);
    } catch (err) {
      console.error("Failed to delete availability:", err);
    } finally {
      setSaving(false);
    }
  }

  function getDaysInMonth(y, m) {
    return new Date(y, m + 1, 0).getDate();
  }

  function getFirstDayOfMonth(y, m) {
    return new Date(y, m, 1).getDay();
  }

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  function getDateStr(day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function getSlotColor(slot) {
    const opt = SLOT_OPTIONS.find((o) => o.value === slot);
    return opt ? opt.color : "#6b7280";
  }

  function getSlotLabel(slot) {
    switch (slot) {
      case "full_day": return t("availability.slots.fullDay");
      case "morning": return t("availability.slots.morning");
      case "afternoon": return t("availability.slots.afternoon");
      case "evening": return t("availability.slots.evening");
      case "unavailable": return t("availability.slots.unavailable");
      default: return slot;
    }
  }

  return (
    <div>
      {/* Calendar Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button
          onClick={prevMonth}
          style={{
            padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--card)", cursor: "pointer", color: "var(--text)",
          }}
        >
          ←
        </button>
        <h4 style={{ margin: 0, color: "var(--text)" }}>
          {monthNames[month]} {year}
        </h4>
        <button
          onClick={nextMonth}
          style={{
            padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--card)", cursor: "pointer", color: "var(--text)",
          }}
        >
          →
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16, fontSize: "0.75rem" }}>
        {SLOT_OPTIONS.map((opt) => (
          <div key={opt.value} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: opt.color }} />
            <span style={{ color: "var(--muted)" }}>{getSlotLabel(opt.value)}</span>
          </div>
        ))}
      </div>

      {/* Day Headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {dayNames.map((day) => (
          <div key={day} style={{
            textAlign: "center", padding: 8, fontSize: "0.75rem",
            fontWeight: 600, color: "var(--muted)", textTransform: "uppercase",
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
          {t("common.loading")}...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} />;
            }

            const dateStr = getDateStr(day);
            const avail = availabilities[dateStr];
            const isToday = dateStr === todayStr;
            const isPast = new Date(dateStr) < new Date(todayStr);
            const isSelected = selectedDate === dateStr;

            return (
              <div
                key={dateStr}
                onClick={() => !isPast && setSelectedDate(isSelected ? null : dateStr)}
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  border: isSelected ? "2px solid var(--accent)" : isToday ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: avail ? getSlotColor(avail.slot) + "20" : "var(--surface)",
                  cursor: isPast ? "default" : "pointer",
                  opacity: isPast ? 0.5 : 1,
                  transition: "all 150ms ease",
                }}
              >
                <span style={{
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? "var(--accent)" : "var(--text)",
                  fontSize: "0.875rem",
                }}>
                  {day}
                </span>
                {avail && (
                  <div style={{
                    position: "absolute",
                    bottom: 4,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: getSlotColor(avail.slot),
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Date Actions */}
      {selectedDate && (
        <div style={{
          marginTop: 16, padding: 16, borderRadius: 12,
          background: "var(--surface)", border: "1px solid var(--border)",
        }}>
          <h5 style={{ margin: "0 0 12px", color: "var(--text)" }}>
            {t("availability.setFor")} {selectedDate}
          </h5>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {SLOT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedSlot(opt.value)}
                style={{
                  padding: "8px 12px", borderRadius: 8,
                  border: selectedSlot === opt.value ? `2px solid ${opt.color}` : "1px solid var(--border)",
                  background: selectedSlot === opt.value ? opt.color + "20" : "var(--card)",
                  color: selectedSlot === opt.value ? opt.color : "var(--text)",
                  cursor: "pointer", fontWeight: 500, fontSize: "0.8125rem",
                }}
              >
                {getSlotLabel(opt.value)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => handleSetAvailability(selectedDate, selectedSlot)}
              disabled={saving}
              style={{
                padding: "10px 20px", borderRadius: 8, border: "none",
                background: "var(--accent)", color: "white",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 600, fontSize: "0.875rem", opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? t("common.saving") : t("common.save")}
            </button>
            {availabilities[selectedDate] && (
              <button
                onClick={() => handleDeleteAvailability(selectedDate)}
                disabled={saving}
                style={{
                  padding: "10px 20px", borderRadius: 8,
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  background: "var(--card)", color: "#ef4444",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: 500, fontSize: "0.875rem",
                }}
              >
                {t("common.clear")}
              </button>
            )}
            <button
              onClick={() => setSelectedDate(null)}
              style={{
                padding: "10px 20px", borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--card)", color: "var(--text)",
                cursor: "pointer", fontWeight: 500, fontSize: "0.875rem",
              }}
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
