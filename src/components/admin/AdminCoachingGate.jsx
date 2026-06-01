"use client";
// Blocks admin UI until the institute (coaching) record is linked to the profile.

import { useAuth } from "@/src/contexts/AuthContext";

export default function AdminCoachingGate({ children }) {
  const { profile } = useAuth();

  if (!profile?.coachingId) {
    return (
      <div className="fade-in" style={{ maxWidth: 480, margin: "48px auto", textAlign: "center" }}>
        <h2 style={{ color: "var(--accent2)", marginBottom: 12 }}>
          Institute setup incomplete
        </h2>
        <p style={{ color: "var(--text3)", fontSize: 14, lineHeight: 1.6 }}>
          Your admin account is not linked to a coaching institute yet.
          Sign out and register again as an institute admin, or contact support if you believe this is a mistake.
        </p>
      </div>
    );
  }

  return children;
}
