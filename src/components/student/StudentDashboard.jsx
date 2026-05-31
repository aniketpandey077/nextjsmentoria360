"use client";
// src/components/student/StudentDashboard.jsx
// ============================================================
// Student home dashboard.
// - "independent" / no coaching: show CTA to join one
// - "pending": show waiting screen
// - "approved" + coachings: show coaching switcher + data
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useStudentCoaching } from "../../contexts/StudentCoachingContext";
import {
  getCoaching, getStudentFees, getClasses, getWorkshops,
} from "../../services/firestoreService";
import { formatCurrency, whatsappUrl } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function StudentDashboard({ setActive }) {
  const { profile, refreshProfile } = useAuth();
  const { coachings, activeCoachingId, setActiveCoachingId } = useStudentCoaching();
  const [coaching,   setCoaching]   = useState(null);
  const [fees,       setFees]       = useState([]);
  const [classes,    setClasses]    = useState([]);
  const [workshops,  setWorkshops]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  const isIndependent = !profile?.status || profile?.status === "independent";
  const isPending     = profile?.status === "pending" && (!profile?.coachingIds?.length);
  const hasCoachings  = (profile?.coachingIds?.length > 0) || (profile?.coachingId);

  useEffect(() => {
    // Poll for approval if pending
    if (isPending) {
      const interval = setInterval(refreshProfile, 15000);
      setLoading(false);
      return () => clearInterval(interval);
    }

    if (!activeCoachingId) { setLoading(false); return; }

    setLoading(true);
    (async () => {
      try {
        const [c, f, cl, w] = await Promise.all([
          getCoaching(activeCoachingId),
          getStudentFees(activeCoachingId, profile.uid),
          getClasses(activeCoachingId),
          getWorkshops(activeCoachingId),
        ]);
        setCoaching(c);
        setFees(f);
        setClasses(cl);
        setWorkshops(w);
      } catch { toast.error("Failed to load dashboard data."); }
      finally   { setLoading(false); }
    })();
  }, [activeCoachingId, profile?.status]);

  // ─── Pending screen (no coachings approved yet, has a pending request) ─────
  if (isPending) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>⏳</div>
        <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, marginBottom: 12 }}>Approval Pending</h2>
        <p style={{ color: "var(--text2)", lineHeight: 1.7, marginBottom: 20 }}>
          Your join request has been submitted. The coaching admin will review and
          approve it. This page updates automatically once approved.
        </p>
        <div className="alert alert-info" style={{ textAlign: "left" }}>
          <strong>What happens next?</strong><br />
          The admin will approve or reject your request.
          You'll gain full access after approval. You can also join more coachings from your Profile.
        </div>
        <div style={{ marginTop: 20 }}>
          <span className="badge badge-pending" style={{ fontSize: 13, padding: "6px 16px" }}>
            ● Awaiting Admin Approval
          </span>
        </div>
      </div>
    </div>
  );

  // ─── No coaching (independent) — CTA to join ──────────────────────────────
  if (isIndependent || (!hasCoachings && !isPending)) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <div style={{ textAlign: "center", maxWidth: 460 }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🎓</div>
        <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 26, marginBottom: 12 }}>
          Welcome to Mentoria360!
        </h2>
        <p style={{ color: "var(--text2)", lineHeight: 1.7, marginBottom: 24 }}>
          You're not enrolled in any coaching institute yet.
          Search and join one (or multiple) to access classes, fees, tests, and more.
        </p>
        <button
          className="btn btn-primary"
          style={{ fontSize: 15, padding: "12px 28px" }}
          onClick={() => setActive("profile")}
        >
          🔍 Find &amp; Join a Coaching
        </button>
        <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 16 }}>
          Go to <strong>My Profile</strong> → <em>My Coachings</em> to search and send join requests.
        </p>
      </div>
    </div>
  );

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <span className="spinner" />
    </div>
  );

  const totalPaid = fees.reduce((s, f) => s + (f.paid || 0), 0);
  const totalDue  = fees.reduce((s, f) => s + (f.due  || 0), 0);

  // ─── Main dashboard ────────────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Welcome, {(profile?.name || "Student").split(" ")[0]}! 👋</h2>
        <p>
          {coaching
            ? `Enrolled at ${coaching.name} · ${coaching.city}`
            : "Select a coaching above to view your dashboard"}
        </p>
      </div>

      {!coaching && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          📌 Select a coaching institute above to see your classes, fees, and more.
          Or go to <strong>My Profile</strong> to join a new coaching.
        </div>
      )}

      {coaching && (
        <>
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">My Classes</span>
              <span className="stat-value" style={{ color: "var(--accent2)" }}>{classes.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Paid</span>
              <span className="stat-value" style={{ color: "var(--green)" }}>{formatCurrency(totalPaid)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Pending Dues</span>
              <span className="stat-value" style={{ color: totalDue > 0 ? "var(--amber)" : "var(--green)" }}>
                {formatCurrency(totalDue)}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Workshops</span>
              <span className="stat-value" style={{ color: "var(--blue)" }}>{workshops.length}</span>
            </div>
          </div>

          <div className="grid-2">
            {/* Upcoming classes */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ fontSize: 15 }}>Upcoming Classes</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setActive("classes")}>View All →</button>
              </div>
              {classes.length === 0 && <p style={{ color: "var(--text3)", fontSize: 13 }}>No classes scheduled yet.</p>}
              {classes.slice(0, 3).map(cl => (
                <div key={cl.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{cl.subject}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{cl.teacher}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--accent2)", fontWeight: 500 }}>{cl.time}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{cl.day}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Fee summary */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ fontSize: 15 }}>Fee Summary</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setActive("fees")}>View All →</button>
              </div>
              {fees.length === 0 && <p style={{ color: "var(--text3)", fontSize: 13 }}>No fee records yet.</p>}
              {fees.slice(0, 3).map(f => (
                <div key={f.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span>{f.month}</span>
                    <span className={`badge badge-${f.status === "paid" ? "approved" : f.status === "partial" ? "pending" : "rejected"}`}>
                      {f.status}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.round((f.paid / f.amount) * 100)}%` }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                    {formatCurrency(f.paid)} paid · {formatCurrency(f.due)} due
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact institute */}
          <div className="card" style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: 15 }}>📞 Contact Institute</h3>
              <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>
                {coaching.name} · {coaching.city}
              </p>
            </div>
            {coaching.whatsapp && (
              <a
                href={whatsappUrl(coaching.whatsapp, `Hello! I'm ${profile?.name}, a student at ${coaching.name}.`)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#25d366", color: "#fff", padding: "9px 18px",
                  borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: "none",
                }}
              >
                💬 WhatsApp
              </a>
            )}
          </div>
        </>
      )}

      {/* CTA to join more coachings */}
      <div className="card" style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>🏫 Enroll in Another Coaching</div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>
            You can be part of multiple coaching institutes at once
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setActive("profile")}>
          + Join a Coaching
        </button>
      </div>
    </div>
  );
}

