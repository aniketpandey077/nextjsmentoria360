"use client";

export default function GlobalError({ error, reset }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      textAlign: "center",
      fontFamily: "DM Sans, sans-serif",
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, color: "var(--accent2)", marginBottom: 12 }}>
        Something went wrong
      </h1>
      <p style={{ color: "var(--text3)", fontSize: 14, maxWidth: 400, marginBottom: 24, lineHeight: 1.6 }}>
        An unexpected error occurred. Please try again.
      </p>
      {process.env.NODE_ENV === "development" && error?.message && (
        <pre style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 10,
          padding: "12px 16px",
          fontSize: 11,
          color: "#f87171",
          maxWidth: 560,
          overflow: "auto",
          textAlign: "left",
          marginBottom: 24,
        }}>
          {error.message}
        </pre>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => reset()}
        >
          Try again
        </button>
        <a href="/" className="btn btn-secondary" style={{ textDecoration: "none" }}>
          Go home
        </a>
      </div>
    </div>
  );
}
