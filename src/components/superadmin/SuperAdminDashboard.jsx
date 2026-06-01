"use client";
// src/components/superadmin/SuperAdminDashboard.jsx
// ============================================================
// Platform-level overview for the super admin.
// Manages all institutes, tutors, users, and platform analytics.
// ============================================================

import React, { useEffect, useState } from "react";
import {
  getAllCoachings, getAllUsers, getAllTutors,
  updateExploreVisibility,
} from "../../services/firestoreService";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

const ROLE_COLOR = {
  superadmin: "#ec4899",
  admin:      "#6366f1",
  student:    "#10b981",
};

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

// ── Coaching Detail Panel ─────────────────────────────────
function CoachingDetailPanel({ coaching, admin, onClose, onVisibilityChange }) {
  const [toggling, setToggling] = useState(false);
  const visible = coaching.showInExplore !== false;

  const handleToggle = async () => {
    setToggling(true);
    try {
      await updateExploreVisibility(coaching.id, !visible);
      onVisibilityChange(coaching.id, !visible);
      toast.success(!visible ? "Coaching is now visible on Explore" : "Coaching hidden from Explore");
    } catch {
      toast.error("Failed to update visibility.");
    } finally {
      setToggling(false);
    }
  };

  const mapsUrl = coaching.city
    ? `https://www.google.com/maps/search/${encodeURIComponent(coaching.name + " " + coaching.city)}`
    : null;

  const createdDate = coaching.createdAt?.seconds
    ? new Date(coaching.createdAt.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,.65)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }} onClick={onClose}>
      <div
        className="card"
        style={{
          width: "100%", maxWidth: 560,
          maxHeight: "85vh", overflowY: "auto",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          boxShadow: "var(--shadow-sm)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0,
            }}>
              {coaching.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{coaching.name}</div>
              {mapsUrl
                ? <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>{coaching.city} ↗</a>
                : <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{coaching.city || "—"}</span>
              }
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        {/* Key Stats */}
        <div className="grid-3" style={{ marginBottom: 20 }}>
          {[
            { label: "Students", value: coaching.students?.length || 0 },
            { label: "Subject", value: coaching.subject || "—" },
            { label: "Registered", value: createdDate },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: "14px 12px" }}>
              <span className="stat-label">{s.label}</span>
              <span className="stat-value" style={{ fontSize: s.label === "Registered" ? "0.875rem" : undefined }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Admin info */}
        <div className="card" style={{ background: "var(--bg3)", marginBottom: 16, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Admin Info</div>
          {admin ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "#fff",
              }}>
                {admin.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{admin.name}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{admin.email || admin.phone || "—"}</div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text3)" }}>Admin information not found</div>
          )}
          {coaching.phone && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-secondary)" }}>{coaching.phone}</div>
          )}
        </div>

        {/* Explore Visibility Control */}
        <div className="card" style={{ padding: "16px 18px", marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                Explore Visibility
              </div>
              <div style={{ fontSize: 12, color: visible ? "var(--success)" : "var(--error)", fontWeight: 500 }}>
                {visible ? "Visible to students" : "Hidden from search"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                {visible ? "Students can discover this institute." : "Not appearing in Explore results."}
              </div>
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling}
              style={{
                width: 52, height: 28,
                borderRadius: 14,
                border: "none",
                background: visible ? "var(--green)" : "var(--bg3)",
                position: "relative",
                cursor: toggling ? "not-allowed" : "pointer",
                transition: "background .3s",
                flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute",
                top: 3, left: visible ? "calc(100% - 25px)" : 3,
                width: 22, height: 22,
                borderRadius: "50%",
                background: "#fff",
                transition: "left .25s cubic-bezier(.16,1,.3,1)",
                boxShadow: "0 1px 4px rgba(0,0,0,.3)",
              }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Super Admin Dashboard ────────────────────────────────
export default function SuperAdminDashboard({ active }) {
  const [coachings, setCoachings] = useState([]);
  const [users,     setUsers]     = useState([]);
  const [tutors,    setTutors]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState(null); // coaching detail panel

  useEffect(() => {
    Promise.all([getAllCoachings(), getAllUsers()])
      .then(([c, u]) => { setCoachings(c); setUsers(u); })
      .catch(() => toast.error("Failed to load data — check Firestore rules."))
      .finally(() => setLoading(false));

    getAllTutors()
      .then(t => setTutors(t))
      .catch(() => {});
  }, []);

  // Update showInExplore locally so UI refreshes without re-fetch
  const handleVisibilityChange = (coachingId, visible) => {
    setCoachings(prev => prev.map(c => c.id === coachingId ? { ...c, showInExplore: visible } : c));
    if (selected?.id === coachingId) setSelected(s => ({ ...s, showInExplore: visible }));
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 0", gap: 16 }}>
      <span className="spinner" style={{ width: 40, height: 40 }} />
      <p style={{ color: "var(--text3)", fontSize: 14 }}>Loading platform data...</p>
    </div>
  );

  const admins   = users.filter(u => u.role === "admin");
  const students = users.filter(u => u.role === "student");
  const pending  = students.filter(u => u.status === "pending");
  const totalStudentsEnrolled = coachings.reduce((s, c) => s + (c.students?.length || 0), 0);

  // ── Dashboard Overview ──────────────────────────────────────
  if (active === "dashboard") {
    const recentCoachings = [...coachings]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 5);

    return (
      <div className="fade-in">
        <div className="page-header">
          <h2>Platform Overview</h2>
          <p>Mentoria360 multi-tenant coaching management platform</p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <StatCard label="Total Institutes" value={coachings.length} />
          <StatCard label="Total Admins" value={admins.length} />
          <StatCard label="Total Students" value={students.length} />
          <StatCard label="Enrolled Students" value={totalStudentsEnrolled} />
          <StatCard label="Pending Approvals" value={pending.length} />
          <StatCard label="Platform Users" value={users.length} />
          <StatCard label="Tutors" value={tutors.length} />
          <StatCard label="Visible on Explore" value={coachings.filter(c => c.showInExplore !== false).length} />
        </div>

        {/* Quick Insights */}
        <div className="grid-2" style={{ marginBottom: 20 }}>
          {/* Top institutes by student count */}
          <div className="card">
            <h3 style={{ fontSize: "0.875rem", marginBottom: 16, color: "var(--text-secondary)", fontWeight: 600 }}>Top Institutes by Students</h3>
            {[...coachings]
              .sort((a, b) => (b.students?.length || 0) - (a.students?.length || 0))
              .slice(0, 5)
              .map((c, i) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)", minWidth: 20 }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{c.city || "—"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{c.students?.length || 0}</span>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>students</span>
                  </div>
                </div>
              ))}
            {coachings.length === 0 && <div className="empty-state" style={{ padding: 20 }}><p>No institutes yet</p></div>}
          </div>

          {/* City distribution */}
          <div className="card">
            <h3 style={{ fontSize: "0.875rem", marginBottom: 16, color: "var(--text-secondary)", fontWeight: 600 }}>City Distribution</h3>
            {(() => {
              const cityMap = {};
              coachings.forEach(c => { if (c.city) cityMap[c.city] = (cityMap[c.city] || 0) + 1; });
              const sorted = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
              const max = sorted[0]?.[1] || 1;
              return sorted.map(([city, count]) => (
                <div key={city} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{city}</span>
                    <span style={{ color: "var(--text3)" }}>{count} institute{count > 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--bg3)", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 10,
                      width: `${(count / max) * 100}%`,
                      background: "var(--accent)",
                      transition: "width 0.5s",
                    }} />
                  </div>
                </div>
              ));
            })()}
            {coachings.length === 0 && <div className="empty-state" style={{ padding: 20 }}><p>No data yet</p></div>}
          </div>
        </div>

        {/* Recently registered institutes */}
        <div className="card">
          <h3 style={{ fontSize: "0.875rem", marginBottom: 16, color: "var(--text-secondary)", fontWeight: 600 }}>Recently Registered Institutes</h3>
          {recentCoachings.length === 0 && (
            <div className="empty-state"><p>No institutes yet</p></div>
          )}
          <div className="table-wrap">
          <table className="table-mobile-cards">
            <thead>
              <tr>
                <th>Institute</th>
                <th>City</th>
                <th>Focus</th>
                <th>Students</th>
                <th>Explore</th>
              </tr>
            </thead>
            <tbody>
              {recentCoachings.map(c => (
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setSelected(c)}>
                  <td data-label="Institute" style={{ fontWeight: 600 }}>{c.name}</td>
                  <td data-label="City" style={{ color: "var(--text2)" }}>{c.city || "—"}</td>
                  <td data-label="Focus">
                    {c.subject ? <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "var(--accent-bg)", color: "var(--accent)" }}>{c.subject}</span> : "—"}
                  </td>
                  <td data-label="Students" style={{ fontWeight: 600 }}>{(c.students || []).length}</td>
                  <td data-label="Explore">
                    <span style={{ fontSize: 11, fontWeight: 500, color: c.showInExplore !== false ? "var(--success)" : "var(--error)" }}>
                      {c.showInExplore !== false ? "Visible" : "Hidden"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {selected && (
          <CoachingDetailPanel
            coaching={selected}
            admin={users.find(u => u.uid === selected.adminId || u.id === selected.adminId)}
            onClose={() => setSelected(null)}
            onVisibilityChange={handleVisibilityChange}
          />
        )}
      </div>
    );
  }

  // ── All Institutes ──────────────────────────────────────────
  if (active === "institutes") {
    const filtered = coachings.filter(c => {
      const q = search.toLowerCase();
      return !q || c.name?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q) || c.subject?.toLowerCase().includes(q);
    });

    return (
      <div className="fade-in">
        <div className="page-header">
          <h2>All Institutes</h2>
          <p>{coachings.length} registered coaching institutes · {coachings.filter(c => c.showInExplore !== false).length} visible on Explore</p>
        </div>

        <div className="search-wrap" style={{ marginBottom: 20 }}>
          <span className="search-icon" aria-hidden><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg></span>
          <input placeholder="Search by name, city, subject..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 && (
            <div className="card empty-state"><p>No institutes found</p></div>
          )}
          {filtered.map(c => {
            const admin = users.find(u => u.uid === c.adminId || u.id === c.adminId);
            const mapsUrl = c.city ? `https://www.google.com/maps/search/${encodeURIComponent(c.name + " " + c.city)}` : null;
            const studentCount = c.students?.length || 0;
            const visible = c.showInExplore !== false;

            return (
              <div
                key={c.id}
                className="card"
                style={{ cursor: "pointer", transition: "border-color .2s", borderColor: "var(--border)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                onClick={() => setSelected(c)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 10, background: "var(--accent)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, fontWeight: 800, color: "#fff", flexShrink: 0,
                      }}>
                        {c.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                        {mapsUrl ? (
                          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 12, color: "var(--accent2)", textDecoration: "none" }}>
                            {c.city || "—"} ↗
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--text3)" }}>{c.city || "—"}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "var(--text2)" }}>
                      {c.subject && <span>{c.subject}</span>}
                      {c.phone   && <span>{c.phone}</span>}
                      {admin     && <span>{admin.name}</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                      background: visible ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)",
                      color: visible ? "var(--green)" : "var(--red)",
                    }}>
                      {visible ? "Visible" : "Hidden"}
                    </span>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--green)", textAlign: "right" }}>{studentCount}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>students</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selected && (
          <CoachingDetailPanel
            coaching={selected}
            admin={users.find(u => u.uid === selected.adminId || u.id === selected.adminId)}
            onClose={() => setSelected(null)}
            onVisibilityChange={handleVisibilityChange}
          />
        )}
      </div>
    );
  }

  // ── Tutors section ──────────────────────────────────────────
  if (active === "tutors") {
    const filteredTutors = tutors.filter(t => {
      const q = search.toLowerCase();
      return !q || t.name?.toLowerCase().includes(q) || t.subject?.toLowerCase().includes(q) || t.city?.toLowerCase().includes(q);
    });

    return (
      <div className="fade-in">
        <div className="page-header">
          <h2>All Tutors</h2>
          <p>{tutors.length} registered tutors on the platform</p>
        </div>
        <div className="search-wrap" style={{ marginBottom: 20 }}>
          <span className="search-icon" aria-hidden><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg></span>
          <input placeholder="Search by name, subject, city..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredTutors.length === 0 && (
            <div className="card empty-state"><p>No tutors found</p></div>
          )}
          {filteredTutors.map(t => (
            <div key={t.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%",
                      background: "var(--bg-tertiary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, fontWeight: 700, color: "#fff",
                    }}>
                      {t.name?.[0]?.toUpperCase() || "T"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text3)" }}>{t.city || "—"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "var(--text2)" }}>
                    {t.subject  && <span>{t.subject}</span>}
                    {t.yearsExp > 0 && <span>{t.yearsExp} years exp</span>}
                    {t.phone    && <span>{t.phone}</span>}
                    {t.avgRating && <span>{t.avgRating} ({t.reviewCount || 0} reviews)</span>}
                  </div>
                  {t.bio && <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 8, maxWidth: 500 }}>{t.bio.slice(0, 120)}...</p>}
                </div>
                <span className="badge badge-approved">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Reviews ─────────────────────────────────────────────────
  if (active === "reviews") {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h2>Reviews Overview</h2>
          <p>Platform-wide reviews are stored per coaching / per tutor in Firestore</p>
        </div>
        <div className="card">
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ color: "var(--text2)" }}>Reviews are stored in each Coaching and Tutor subcollection.</p>
            <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 8 }}>Use the Institutes or Tutors section to view individual reviews.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── All Users ───────────────────────────────────────────────
  if (active === "users") {
    const filtered = users.filter(u => {
      const q = search.toLowerCase();
      return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
    });

    const roleGroups = {
      superadmin: filtered.filter(u => u.role === "superadmin"),
      admin:      filtered.filter(u => u.role === "admin"),
      student:    filtered.filter(u => u.role === "student"),
    };

    return (
      <div className="fade-in">
        <div className="page-header">
          <h2>All Users</h2>
          <p>{users.length} registered platform users</p>
        </div>

        <div className="search-wrap" style={{ marginBottom: 20 }}>
          <span className="search-icon" aria-hidden><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg></span>
          <input placeholder="Search by name, email, or role..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="stats-grid" style={{ marginBottom: 20 }}>
          {Object.entries(roleGroups).map(([role, list]) => (
            <div key={role} className="stat-card" style={{ textAlign: "center" }}>
              <span className="stat-value" style={{ color: ROLE_COLOR[role], fontSize: 28 }}>{list.length}</span>
              <span className="stat-label" style={{ textTransform: "capitalize" }}>{role}s</span>
            </div>
          ))}
        </div>

        <div className="card">
          {filtered.length === 0 && (
            <div className="empty-state"><p>No users found</p></div>
          )}
          <div className="table-wrap">
          <table className="table-mobile-cards">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email / Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Institute</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const coaching = u.coachingId ? coachings.find(c => c.id === u.coachingId) : null;
                const statusBadge =
                  u.status === "approved" || u.status === "active" ? "approved" :
                  u.status === "pending" ? "pending" : "rejected";

                return (
                  <tr key={u.id}>
                    <td data-label="Name">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%",
                          background: ROLE_COLOR[u.role] || "var(--accent)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>
                          {u.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{u.name || "—"}</span>
                      </div>
                    </td>
                    <td data-label="Contact" style={{ color: "var(--text2)", fontSize: 12 }}>{u.email || u.phone || "—"}</td>
                    <td data-label="Role">
                      <span style={{
                        fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 700,
                        background: (ROLE_COLOR[u.role] || "var(--accent)") + "22",
                        color: ROLE_COLOR[u.role] || "var(--accent)",
                        textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td data-label="Status"><span className={`badge badge-${statusBadge}`}>{u.status || "active"}</span></td>
                    <td data-label="Institute" style={{ color: "var(--text2)", fontSize: 12 }}>
                      {coaching?.name || (u.coachingId ? "Unknown" : "—")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Platform Overview</h2>
        <p>Select a section from the sidebar</p>
      </div>
      <div className="card empty-state">
        <p>Select a page from the sidebar to continue</p>
      </div>
    </div>
  );
}

