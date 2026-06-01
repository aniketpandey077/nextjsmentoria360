import Link from "next/link";

export default function NotFound() {
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
      <div style={{ fontSize: "3rem", fontWeight: 600, marginBottom: 16, color: "var(--text-tertiary)" }}>404</div>
      <h1 style={{ marginBottom: 12 }}>Page not found</h1>
      <p style={{ color: "var(--text-secondary)", maxWidth: 360, marginBottom: 28 }}>
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link href="/" className="btn btn-primary" style={{ textDecoration: "none" }}>
        Back to home
      </Link>
    </div>
  );
}
