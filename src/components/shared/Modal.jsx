"use client";
// src/components/shared/Modal.jsx
// ============================================================
// Reusable modal overlay. Closes on backdrop click or ESC key.
// ============================================================

import React, { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children, maxWidth = 500 }) {
  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal fade-in"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 18, fontWeight: 700 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
            >×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

