"use client";

export default function GlobalError({ error, reset }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        textAlign: "center",
        background: "var(--bg-primary)",
      }}
    >
      <h1 style={{ marginBottom: 12 }}>Something went wrong</h1>
      <p style={{ color: "var(--text-secondary)", maxWidth: 400, marginBottom: 24 }}>
        An unexpected error occurred. Please try again.
      </p>
      {process.env.NODE_ENV === "development" && error?.message && (
        <pre
          style={{
            background: "var(--red-bg)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 6,
            padding: "12px 16px",
            fontSize: 11,
            color: "var(--error)",
            maxWidth: 560,
            overflow: "auto",
            textAlign: "left",
            marginBottom: 24,
          }}
        >
          {error.message}
        </pre>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <button type="button" className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <a href="/" className="btn btn-secondary" style={{ textDecoration: "none" }}>
          Go home
        </a>
      </div>
    </div>
  );
}
