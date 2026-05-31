"use client";
// Redirects unauthenticated users and surfaces profile load failures.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";

function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <span className="spinner" />
    </div>
  );
}

export default function DashboardAuthGate({ children, requiredRole }) {
  const { profile, loading, profileError, refreshProfile, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!profile) router.replace("/");
  }, [loading, profile, router]);

  if (loading) return <PageLoader />;

  if (!profile) return <PageLoader />;

  if (profileError) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 32,
        textAlign: "center", gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ fontFamily: "Syne, sans-serif", color: "var(--accent2)" }}>
          Could not load your profile
        </h2>
        <p style={{ color: "var(--text3)", fontSize: 14, maxWidth: 360 }}>
          Check your connection and try again. If this keeps happening, sign out and log back in.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="btn btn-primary" type="button" onClick={() => refreshProfile()}>
            Retry
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (requiredRole && profile.role !== requiredRole) {
    router.replace("/");
    return <PageLoader />;
  }

  return children;
}
