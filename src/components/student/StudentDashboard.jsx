"use client";
// src/components/student/StudentDashboard.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useStudentCoaching } from "../../contexts/StudentCoachingContext";
import {
  getCoaching, getStudentFees, getClasses, getWorkshops,
} from "../../services/firestoreService";
import { formatCurrency, whatsappUrl } from "../../utils/helpers";
import toast from "react-hot-toast";

/* ── Premium stat card ──────────────────────────────────────── */
function StatCard({ icon, label, value, accent, iconBg, sub }) {
  return (
    <div
      className="stat-card-premium"
      style={{ "--card-accent": accent, "--card-icon-bg": iconBg }}
    >
      <div className="stat-card-top">
        <div className="stat-card-icon" style={{ background: iconBg }}>
          {icon}
        </div>
        {sub != null && (
          <span style={{ fontSize: "0.625rem", color: "var(--text-tertiary)" }}>{sub}</span>
        )}
      </div>
      <div>
        <div className="stat-value-premium" style={{ color: accent }}>{value}</div>
        <div className="stat-label-premium">{label}</div>
      </div>
    </div>
  );
}

export default function StudentDashboard({ setActive }) {
  const { profile, refreshProfile } = useAuth();
  const { coachings, activeCoachingId, setActiveCoachingId } = useStudentCoaching();
  const [coaching, setCoaching] = useState(() => {
    if (typeof window !== "undefined" && activeCoachingId) {
      const saved = localStorage.getItem(`m360_cache_coaching_${activeCoachingId}`);
      try { return saved ? JSON.parse(saved) : null; } catch { return null; }
    }
    return null;
  });
  const [fees, setFees] = useState(() => {
    if (typeof window !== "undefined" && activeCoachingId) {
      const saved = localStorage.getItem(`m360_cache_fees_student_${activeCoachingId}_${profile?.uid}`);
      try { return saved ? JSON.parse(saved) : []; } catch { return []; }
    }
    return [];
  });
  const [classes, setClasses] = useState(() => {
    if (typeof window !== "undefined" && activeCoachingId) {
      const saved = localStorage.getItem(`m360_cache_classes_${activeCoachingId}`);
      try { return saved ? JSON.parse(saved) : []; } catch { return []; }
    }
    return [];
  });
  const [workshops, setWorkshops] = useState(() => {
    if (typeof window !== "undefined" && activeCoachingId) {
      const saved = localStorage.getItem(`m360_cache_workshops_${activeCoachingId}`);
      try { return saved ? JSON.parse(saved) : []; } catch { return []; }
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      const isPending = profile?.status === "pending" && (!profile?.coachingIds?.length);
      if (isPending) return false;
      if (!activeCoachingId) return false;
      const hasCache = localStorage.getItem(`m360_cache_coaching_${activeCoachingId}`);
      return !hasCache;
    }
    return true;
  });

  const isIndependent = !profile?.status || profile?.status === "independent";
  const isPending     = profile?.status === "pending" && (!profile?.coachingIds?.length);
  const hasCoachings  = (profile?.coachingIds?.length > 0) || (profile?.coachingId);

  useEffect(() => {
    if (isPending) {
      const interval = setInterval(refreshProfile, 15000);
      setLoading(false);
      return () => clearInterval(interval);
    }
    if (!activeCoachingId) { setLoading(false); return; }
    // Only set loading to true if we don't have cached data yet
    if (typeof window !== "undefined" && !localStorage.getItem(`m360_cache_coaching_${activeCoachingId}`)) {
      setLoading(true);
    }
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

        // Save to cache
        if (typeof window !== "undefined") {
          localStorage.setItem(`m360_cache_coaching_${activeCoachingId}`, JSON.stringify(c));
          localStorage.setItem(`m360_cache_fees_student_${activeCoachingId}_${profile.uid}`, JSON.stringify(f));
          localStorage.setItem(`m360_cache_classes_${activeCoachingId}`, JSON.stringify(cl));
          localStorage.setItem(`m360_cache_workshops_${activeCoachingId}`, JSON.stringify(w));
        }
      } catch {
        if (!coaching) {
          toast.error("Failed to load dashboard data.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [activeCoachingId, profile?.status]);

  /* ── Pending screen ────────────────────────────────────────── */
  if (isPending) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>Approval Pending</h2>
        <p style={{ color: "var(--text2)", lineHeight: 1.7, marginBottom: 20 }}>
          Your join request has been submitted. The coaching admin will review and approve it shortly.
          This page updates automatically.
        </p>
        <div className="alert alert-info" style={{ textAlign: "left" }}>
          <strong>What happens next?</strong><br />
          The admin will approve or reject your request. You'll gain full access after approval.
        </div>
        <div style={{ marginTop: 20 }}>
          <span className="badge badge-pending" style={{ fontSize: 13, padding: "8px 20px" }}>
            ● Awaiting Admin Approval
          </span>
        </div>
      </div>
    </div>
  );

  /* ── No coaching screen ────────────────────────────────────── */
  if (isIndependent || (!hasCoachings && !isPending)) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>🎓</div>
        <h2 style={{ fontSize: 24, marginBottom: 10 }}>Welcome to Mentoria360!</h2>
        <p style={{ color: "var(--text2)", lineHeight: 1.7, marginBottom: 24 }}>
          You're not enrolled in any coaching institute yet.<br />
          Search and join one to access classes, fees, tests, and more.
        </p>
        <button
          className="btn btn-primary"
          style={{ fontSize: 15, padding: "12px 32px" }}
          onClick={() => setActive("profile")}
        >
          Find & Join a Coaching →
        </button>
        <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 14 }}>
          Go to <strong>My Profile</strong> → <em>My Coachings</em> to search and send join requests.
        </p>
      </div>
    </div>
  );

  /* ── Loading ────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
      <span className="spinner" />
    </div>
  );

  const totalPaid  = fees.reduce((s, f) => s + (f.paid || 0), 0);
  const totalDue   = fees.reduce((s, f) => s + (f.due  || 0), 0);
  const paidCount  = fees.filter(f => f.status === "paid").length;
  const upcomingClasses = classes.slice(0, 3);

  /* Quick nav items */
  const QUICK_NAV = [
    { icon: "📅", label: "Classes",     key: "classes",      bg: "rgba(91,106,240,0.12)"  },
    { icon: "💰", label: "Fees",        key: "fees",         bg: "rgba(34,197,94,0.12)"   },
    { icon: "✅", label: "Attendance",  key: "attendance",   bg: "rgba(6,182,212,0.12)"   },
    { icon: "📝", label: "Tests",       key: "tests",        bg: "rgba(239,68,68,0.12)"   },
    { icon: "📚", label: "Homework",    key: "homework",     bg: "rgba(245,158,11,0.12)"  },
    { icon: "📦", label: "Materials",   key: "materials",    bg: "rgba(139,92,246,0.12)"  },
    { icon: "📢", label: "Announcements", key: "announcements", bg: "rgba(245,158,11,0.12)" },
    { icon: "🏆", label: "Workshops",   key: "workshops",    bg: "rgba(6,182,212,0.12)"   },
  ];

  return (
    <div className="fade-in">

      {/* ── Welcome Banner ── */}
      <div className="dash-welcome-banner">
        <div>
          <div className="dash-welcome-title">
            👋 Welcome back, {(profile?.name || "Student").split(" ")[0]}!
          </div>
          <div className="dash-welcome-sub">
            {coaching
              ? `Enrolled at ${coaching.name} · ${coaching.city}`
              : "Select a coaching above to view your full dashboard"}
          </div>
        </div>
        {coaching?.whatsapp && (
          <a
            href={whatsappUrl(coaching.whatsapp, `Hello! I'm ${profile?.name}, a student at ${coaching.name}.`)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#25d366", color: "#fff", padding: "9px 18px",
              borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: "none",
              flexShrink: 0,
            }}
          >
            💬 WhatsApp Institute
          </a>
        )}
      </div>

      {!coaching && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          Select a coaching institute above to see your classes, fees, and more.
          Or go to <strong>My Profile</strong> to join a new coaching.
        </div>
      )}

      {coaching && (
        <>
          {/* ── Stats ── */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <StatCard
              icon="📅" label="My Classes" value={classes.length}
              accent="var(--accent)" iconBg="var(--accent-bg)"
            />
            <StatCard
              icon="💰" label="Total Paid" value={formatCurrency(totalPaid)}
              accent="#22c55e" iconBg="rgba(34,197,94,0.12)"
              sub={`${paidCount} months`}
            />
            <StatCard
              icon="⏳" label="Pending Due" value={formatCurrency(totalDue)}
              accent={totalDue > 0 ? "#f59e0b" : "#22c55e"} iconBg="rgba(245,158,11,0.12)"
            />
            <StatCard
              icon="🏆" label="Workshops" value={workshops.length}
              accent="var(--accent)" iconBg="var(--accent-bg)"
            />
          </div>

          {/* ── Quick Navigation ── */}
          <div className="quick-actions-grid">
            {QUICK_NAV.map((a) => (
              <button
                key={a.key}
                type="button"
                className="quick-action-btn"
                onClick={() => setActive(a.key)}
              >
                <div className="quick-action-icon" style={{ background: a.bg }}>{a.icon}</div>
                <span className="quick-action-label">{a.label}</span>
              </button>
            ))}
          </div>

          {/* ── Two column ── */}
          <div className="grid-2">
            {/* Upcoming Classes */}
            <div className="card">
              <div className="card-header-row">
                <div>
                  <div className="card-title">📅 Upcoming Classes</div>
                  <div className="card-subtitle">{classes.length} class{classes.length !== 1 ? "es" : ""} scheduled</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setActive("classes")}>
                  View All →
                </button>
              </div>
              {classes.length === 0 && (
                <div className="empty-state" style={{ padding: "32px 0" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>📅</div>
                  <p style={{ fontSize: 13 }}>No classes scheduled yet.</p>
                </div>
              )}
              {upcomingClasses.map(cl => (
                <div
                  key={cl.id}
                  style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "10px 0", borderBottom: "1px solid var(--border)",
                    alignItems: "center", gap: 8,
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: "rgba(91,106,240,0.12)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1rem", flexShrink: 0,
                      }}
                    >
                      📖
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{cl.subject}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{cl.teacher}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{cl.time}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{cl.day}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Fee Summary */}
            <div className="card">
              <div className="card-header-row">
                <div>
                  <div className="card-title">💰 Fee Summary</div>
                  <div className="card-subtitle">
                    {totalDue > 0
                      ? `${formatCurrency(totalDue)} pending`
                      : "All paid up! 🎉"}
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setActive("fees")}>
                  View All →
                </button>
              </div>

              {/* Due alert */}
              {totalDue > 0 && (
                <div
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>⚠️</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>
                      {formatCurrency(totalDue)} pending
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                      Please clear dues to avoid access issues.
                    </div>
                  </div>
                </div>
              )}

              {fees.length === 0 && (
                <div className="empty-state" style={{ padding: "24px 0" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>💳</div>
                  <p style={{ fontSize: 13 }}>No fee records yet.</p>
                </div>
              )}
              {fees.slice(0, 4).map(f => (
                <div key={f.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <div style={{ fontWeight: 500 }}>{f.month}</div>
                    <span
                      className={`badge badge-${f.status === "paid" ? "approved" : f.status === "partial" ? "pending" : "rejected"}`}
                    >
                      {f.status}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.round((f.paid / f.amount) * 100)}%`,
                        background: f.status === "paid" ? "#22c55e" : f.status === "partial" ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                    {formatCurrency(f.paid)} paid · {formatCurrency(f.due)} due
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Enroll more CTA ── */}
          <div
            className="card"
            style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>📚 Enroll in Another Coaching</div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>
                You can be part of multiple coaching institutes at once
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActive("profile")}>
              + Join a Coaching
            </button>
          </div>
        </>
      )}

      {/* ── Enroll CTA when no coaching selected ── */}
      {!coaching && (
        <div
          className="card"
          style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>📚 Join a Coaching Institute</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>
              Find coaching institutes and send a join request
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setActive("profile")}>
            Browse & Join →
          </button>
        </div>
      )}
    </div>
  );
}
