"use client";
// Coaching switcher shown on all student pages when enrolled in multiple institutes.

import { useStudentCoaching } from "../../contexts/StudentCoachingContext";

export default function StudentCoachingBar() {
  const { coachings, activeCoachingId, setActiveCoachingId, loadingCoachings } = useStudentCoaching();

  if (loadingCoachings || coachings.length <= 1) return null;

  const active = coachings.find((c) => c.id === activeCoachingId);

  return (
    <div
      style={{
        marginBottom: 20,
        padding: "14px 16px",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        borderRadius: 12,
      }}
    >
      <div style={{
        fontSize: 11,
        color: "var(--text3)",
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}>
        Active institute{active ? `: ${active.name}` : ""}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {coachings.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCoachingId(c.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: "1px solid",
              borderColor: activeCoachingId === c.id ? "var(--accent)" : "var(--border2)",
              background: activeCoachingId === c.id ? "var(--accent-bg)" : "transparent",
              color: activeCoachingId === c.id ? "var(--accent2)" : "var(--text2)",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 500,
            }}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
