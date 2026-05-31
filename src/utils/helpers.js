// src/utils/helpers.js
// ============================================================
// Shared utility functions used across the application.
// ============================================================

/**
 * Export an array of objects as a downloadable CSV file.
 * @param {object[]} data - Array of plain objects
 * @param {string} filename - Output filename (without .csv)
 */
export function exportToCSV(data, filename = "export") {
  if (!data || !data.length) {
    alert("No data to export.");
    return;
  }

  const headers = Object.keys(data[0]);
  const rows    = data.map(row =>
    headers.map(h => {
      const val = row[h] ?? "";
      return typeof val === "string" && (val.includes(",") || val.includes('"'))
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Get initials from a full name (up to 2 chars).
 * e.g. "Rajan Verma" → "RV"
 */
export function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join("");
}

/**
 * Format a Firestore Timestamp or ISO string to a readable date.
 * e.g. "2025-04-03T10:00:00Z" → "Apr 3, 2025"
 */
export function formatDate(value) {
  if (!value) return "—";
  let date;
  if (value?.toDate) {
    date = value.toDate();
  } else if (typeof value === "string") {
    date = new Date(value);
  } else {
    date = new Date(value);
  }
  return date.toLocaleDateString("en-IN", {
    year:  "numeric",
    month: "short",
    day:   "numeric",
  });
}

/**
 * Format a number as Indian Rupees.
 * e.g. 5000 → "₹5,000"
 */
export function formatCurrency(amount = 0) {
  return new Intl.NumberFormat("en-IN", {
    style:    "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a Firestore Timestamp for display.
 */
export function formatTimestamp(ts) {
  if (!ts) return "—";
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return "—"; }
}

/**
 * Build a WhatsApp URL for a phone number and optional message.
 */
export function whatsappUrl(phone, message = "") {
  const clean = phone.replace(/\D/g, "");
  const num   = clean.startsWith("91") ? clean : `91${clean}`;
  return `https://wa.me/${num}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

/**
 * Compute fee summary stats from an array of fee records.
 */
export function computeFeeStats(fees = []) {
  return fees.reduce(
    (acc, f) => ({
      total:   acc.total   + (f.amount || 0),
      paid:    acc.paid    + (f.paid   || 0),
      due:     acc.due     + (f.due    || 0),
      unpaid:  acc.unpaid  + (f.status === "unpaid"  ? 1 : 0),
      partial: acc.partial + (f.status === "partial" ? 1 : 0),
    }),
    { total: 0, paid: 0, due: 0, unpaid: 0, partial: 0 }
  );
}

/**
 * Simple debounce helper for search inputs.
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Merge class names (simple utility).
 */
export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
