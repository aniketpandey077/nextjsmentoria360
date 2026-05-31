"use client";
// src/components/shared/ErrorBoundary.jsx
// ============================================================
// Catches unhandled React render errors so a single broken
// component cannot crash the entire app.
// ============================================================

import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you'd send this to Sentry / Firebase Crashlytics
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        position: "fixed", inset: 0,
        background: "#0a0816",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 32, textAlign: "center",
        fontFamily: "DM Sans, sans-serif",
        color: "#e0d8ff",
        zIndex: 9999,
      }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>⚠️</div>
        <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, marginBottom: 12, color: "#a78bfa" }}>
          Something went wrong
        </h2>
        <p style={{ color: "#6b5faa", fontSize: 14, maxWidth: 380, marginBottom: 28, lineHeight: 1.6 }}>
          An unexpected error occurred. Please refresh the page.<br />
          If the issue persists, try clearing your browser cache.
        </p>
        {process.env.NODE_ENV === "development" && this.state.error && (
          <pre style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10, padding: "12px 16px", fontSize: 11,
            color: "#f87171", maxWidth: 600, overflow: "auto",
            textAlign: "left", marginBottom: 24, maxHeight: 200,
          }}>
            {this.state.error.toString()}
          </pre>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "13px 32px", border: "none", borderRadius: 12,
            background: "linear-gradient(135deg,#6c3ff5,#8b82ff)",
            color: "#fff", fontFamily: "DM Sans, sans-serif",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 6px 22px rgba(108,50,255,0.4)",
          }}
        >
          🔄 Refresh Page
        </button>
      </div>
    );
  }
}

