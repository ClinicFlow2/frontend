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
 * Format a date-only string (YYYY-MM-DD) as DD-MM-YYYY.
 * Pure string manipulation — no Date object, no timezone shifts.
 * Use this for date_of_birth and any calendar date that has no time component.
 * @param {string} dateStr - Date in YYYY-MM-DD format (from API)
 * @returns {string} Formatted as DD-MM-YYYY, or "-" if invalid
 */
export function formatDOB(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "-";
  const [year, month, day] = parts;
  if (!year || !month || !day) return "-";
  return `${day}-${month}-${year}`;
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
