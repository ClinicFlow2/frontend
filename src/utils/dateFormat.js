// src/utils/dateFormat.js
// Centralized date/time formatting for the entire application
// Format: DD/MM/YYYY and 24-hour time

/**
 * Format a date as DD/MM/YYYY
 * @param {Date|string|number} date - The date to format
 * @returns {string} Formatted date string or "-" if invalid
 */
export function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format a date-only string (YYYY-MM-DD) for display.
 * Pure string manipulation — no Date object, no timezone shifts.
 * Use this for date_of_birth and any calendar date that has no time component.
 *
 * Locale-aware:
 *   "fr" → DD-MM-YYYY  (e.g. "15-01-2000")
 *   "en" → MM/DD/YYYY  (e.g. "01/15/2000")
 *
 * @param {string} dateStr - Date in YYYY-MM-DD format (from API / input[type=date])
 * @param {string} [lang="fr"] - Language code ("fr" or "en")
 * @returns {string} Formatted date string, or "-" if invalid
 */
export function formatDOB(dateStr, lang = "fr") {
  if (!dateStr || typeof dateStr !== "string") return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "-";
  const [year, month, day] = parts;
  if (!year || !month || !day) return "-";

  if (lang && lang.startsWith("en")) {
    return `${month}/${day}/${year}`;
  }
  return `${day}-${month}-${year}`;
}

/**
 * Safely extract / normalise a date-only value to YYYY-MM-DD.
 * Accepts YYYY-MM-DD (pass-through), DD-MM-YYYY, or MM/DD/YYYY.
 * Pure string manipulation — never uses new Date().
 *
 * @param {string} value - A date string in any of the accepted formats
 * @returns {string} ISO date (YYYY-MM-DD) or "" if invalid
 */
export function toISODate(value) {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();

  // Already YYYY-MM-DD (from <input type="date"> or API)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("-");
    return `${year}-${month}-${day}`;
  }

  // MM/DD/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [month, day, year] = trimmed.split("/");
    return `${year}-${month}-${day}`;
  }

  return "";
}

/**
 * Format a time as HH:MM (24-hour)
 * @param {Date|string|number} date - The date/time to format
 * @returns {string} Formatted time string or "-" if invalid
 */
export function formatTime(date) {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

/**
 * Format a date and time as DD/MM/YYYY HH:MM (24-hour)
 * @param {Date|string|number} date - The date/time to format
 * @returns {string} Formatted datetime string or "-" if invalid
 */
export function formatDateTime(date) {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  return `${formatDate(d)} ${formatTime(d)}`;
}

/**
 * Format a date for display with month name (e.g., "15 January 2024")
 * @param {Date|string|number} date - The date to format
 * @param {string} locale - Locale for month name (default: "en-GB")
 * @returns {string} Formatted date string or "-" if invalid
 */
export function formatDateLong(date, locale = "en-GB") {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format a date and time with full month name (e.g., "3 February 2026, 14:30")
 * Locale-aware: uses "fr-FR" or "en-GB" depending on the locale parameter.
 * @param {Date|string|number} date - The date/time to format
 * @param {string} locale - Locale string (default: "en-GB")
 * @returns {string} Formatted datetime string or "-" if invalid
 */
export function formatDateTimeLong(date, locale = "en-GB") {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
