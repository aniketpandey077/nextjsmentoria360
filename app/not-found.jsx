import Link from "next/link";

export default function NotFound() {
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
      <div style={{ fontSize: 56, marginBottom: 16 }}>404</div>
      <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, color: "var(--accent2)", marginBottom: 12 }}>
        Page not found
      </h1>
      <p style={{ color: "var(--text3)", fontSize: 14, maxWidth: 360, marginBottom: 28, lineHeight: 1.6 }}>
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        href="/"
        style={{
          padding: "12px 28px",
          borderRadius: 12,
          background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        Back to home
      </Link>
    </div>
  );
}
