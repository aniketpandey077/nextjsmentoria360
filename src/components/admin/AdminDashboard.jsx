"use client";
// src/components/admin/AdminDashboard.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getCoaching, getJoinRequests, getCoachingFees,
  getTransactions, approveJoinRequest, rejectJoinRequest,
  getJoinRequestStudentId, updateExploreVisibility,
} from "../../services/firestoreService";
import { formatCurrency, formatDate, getInitials } from "../../utils/helpers";
import toast from "react-hot-toast";

/* ── Explore Visibility Toggle Card ─────────────────────────── */
function ExploreToggleCard({ coachingId, initialValue }) {
  const [visible, setVisible] = useState(initialValue !== false);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    const next = !visible;
    setVisible(next);
    setSaving(true);
    try {
      await updateExploreVisibility(coachingId, next);
      toast.success(next ? "Institute is now visible on Explore" : "Institute hidden from Explore");
    } catch {
      setVisible(!next);
      toast.error("Failed to update visibility.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="stat-card-premium"
      style={{ "--card-accent": visible ? "#22c55e" : "#888", "--card-icon-bg": "rgba(34,197,94,0.1)", "--card-color": "#22c55e" }}
    >
      <div className="stat-card-top">
        <div className="stat-card-icon" style={{ background: "rgba(34,197,94,0.1)" }}>
          🌐
        </div>
        <button
          onClick={toggle}
          disabled={saving}
          title={visible ? "Click to hide" : "Click to show"}
          style={{
            width: 44, height: 24,
            borderRadius: 12,
            border: "none",
            background: visible ? "#22c55e" : "var(--bg-tertiary)",
            position: "relative",
            cursor: saving ? "not-allowed" : "pointer",
            transition: "background .25s",
            flexShrink: 0,
          }}
        >
          <div style={{
            position: "absolute",
            top: 3, left: visible ? "calc(100% - 18px)" : 3,
            width: 18, height: 18,
            borderRadius: "50%",
            background: "#fff",
            transition: "left .2s cubic-bezier(.16,1,.3,1)",
            boxShadow: "0 1px 3px rgba(0,0,0,.3)",
          }} />
        </button>
      </div>
      <div>
        <div className="stat-value-premium" style={{ fontSize: "1rem", color: visible ? "#22c55e" : "var(--text-secondary)" }}>
          {saving ? "Saving…" : visible ? "Visible" : "Hidden"}
        </div>
        <div className="stat-label-premium">Explore Listing</div>
      </div>
    </div>
  );
}

/* ── Premium Stat Card ───────────────────────────────────────── */
function StatCard({ icon, label, value, accent, iconBg, badge }) {
  return (
    <div
      className="stat-card-premium"
      style={{
        "--card-accent": accent,
        "--card-icon-bg": iconBg,
        "--card-color": accent,
      }}
    >
      <div className="stat-card-top">
        <div className="stat-card-icon" style={{ background: iconBg, fontSize: "1.125rem" }}>
          {icon}
        </div>
        {badge != null && (
          <span className="stat-card-badge">{badge}</span>
        )}
      </div>
      <div>
        <div className="stat-value-premium" style={{ color: accent }}>{value}</div>
        <div className="stat-label-premium">{label}</div>
      </div>
    </div>
  );
}

/* ── Main Admin Dashboard ────────────────────────────────────── */
export default function AdminDashboard({ setActive }) {
  const { profile } = useAuth();
  const [coaching, setCoaching] = useState(null);
  const [requests, setRequests] = useState([]);
  const [fees, setFees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const loadData = async () => {
    try {
      const [c, jr, f, tx] = await Promise.all([
        getCoaching(profile.coachingId),
        getJoinRequests(profile.coachingId),
        getCoachingFees(profile.coachingId),
        getTransactions(profile.coachingId),
      ]);
      setCoaching(c);
      setRequests(jr.filter(r => r.status === "pending"));
      setFees(f);
      setTransactions(tx.slice(0, 5));
      setStudentCount(c?.students?.length || 0);
    } catch {
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [profile.coachingId]);

  const handleApprove = async (req) => {
    const studentId = getJoinRequestStudentId(req);
    if (!profile?.coachingId || !studentId) {
      toast.error(!studentId ? "Request is missing student ID." : "Institute not linked.");
      return;
    }
    setActingId(req.id);
    try {
      await approveJoinRequest(profile.coachingId, req.id, studentId);
      toast.success(`${req.studentName} approved!`);
      setRequests(r => r.filter(x => x.id !== req.id));
      setStudentCount(n => n + 1);
    } catch (err) {
      toast.error(err?.message || "Approval failed.");
    } finally { setActingId(null); }
  };

  const handleReject = async (req) => {
    const studentId = getJoinRequestStudentId(req);
    if (!profile?.coachingId || !studentId) {
      toast.error(!studentId ? "Request is missing student ID." : "Institute not linked.");
      return;
    }
    setActingId(req.id);
    try {
      await rejectJoinRequest(profile.coachingId, req.id, studentId);
      toast.success(`${req.studentName}'s request rejected.`);
      setRequests(r => r.filter(x => x.id !== req.id));
    } catch (err) {
      toast.error(err?.message || "Rejection failed.");
    } finally { setActingId(null); }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
      <span className="spinner" />
    </div>
  );

  const totalRevenue = fees.reduce((s, f) => s + (f.paid  || 0), 0);
  const totalDue     = fees.reduce((s, f) => s + (f.due   || 0), 0);
  const collectionRate = totalRevenue + totalDue > 0
    ? Math.round((totalRevenue / (totalRevenue + totalDue)) * 100)
    : 0;

  /* Quick actions */
  const QUICK_ACTIONS = [
    { icon: "👥", label: "Students", key: "students", bg: "rgba(91,106,240,0.12)" },
    { icon: "💰", label: "Fees",     key: "fees",     bg: "rgba(34,197,94,0.12)"  },
    { icon: "📅", label: "Classes",  key: "classes",  bg: "rgba(245,158,11,0.12)" },
    { icon: "📝", label: "Tests",    key: "tests",    bg: "rgba(239,68,68,0.12)"  },
    { icon: "📋", label: "Batches",  key: "batches",  bg: "rgba(139,92,246,0.12)" },
    { icon: "✅", label: "Attend.",  key: "attendance", bg: "rgba(6,182,212,0.12)" },
    { icon: "📢", label: "Announ.",  key: "announcements", bg: "rgba(245,158,11,0.12)" },
    { icon: "📦", label: "Material", key: "materials", bg: "rgba(91,106,240,0.12)" },
  ];

  return (
    <div className="fade-in">

      {/* ── Welcome Banner ── */}
      <div className="dash-welcome-banner">
        <div>
          <div className="dash-welcome-title">
            👋 Welcome back, {profile?.name?.split(" ")[0] || "Admin"}
          </div>
          <div className="dash-welcome-sub">
            {coaching?.name || "Your Institute"} · {coaching?.city}{coaching?.subject ? ` · ${coaching.subject}` : ""}
          </div>
        </div>
        <div className="dash-welcome-actions">
          {requests.length > 0 && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setActive("requests")}
              style={{ position: "relative" }}
            >
              {requests.length} Pending {requests.length === 1 ? "Request" : "Requests"}
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setActive("students")}>
            Manage Students
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", marginBottom: 24 }}>
        <StatCard
          icon="👥" label="Total Students" value={studentCount}
          accent="var(--accent)" iconBg="var(--accent-bg)"
        />
        <StatCard
          icon="💰" label="Total Revenue" value={formatCurrency(totalRevenue)}
          accent="#22c55e" iconBg="rgba(34,197,94,0.12)"
        />
        <StatCard
          icon="⏳" label="Pending Dues" value={formatCurrency(totalDue)}
          accent={totalDue > 0 ? "#f59e0b" : "#22c55e"} iconBg="rgba(245,158,11,0.12)"
        />
        <StatCard
          icon="📊" label="Collection Rate" value={`${collectionRate}%`}
          accent="var(--accent)" iconBg="var(--accent-bg)"
          badge={collectionRate >= 80 ? "Good" : "Low"}
        />
        <ExploreToggleCard
          coachingId={profile.coachingId}
          initialValue={coaching?.showInExplore}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div className="quick-actions-grid">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.key}
            type="button"
            className="quick-action-btn"
            onClick={() => setActive(a.key)}
          >
            <div className="quick-action-icon" style={{ background: a.bg }}>
              {a.icon}
            </div>
            <span className="quick-action-label">{a.label}</span>
          </button>
        ))}
      </div>

      {/* ── Pending Join Requests ── */}
      {requests.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: "rgba(245,158,11,0.3)" }}>
          <div className="card-header-row">
            <div>
              <div className="card-title">⏳ Pending Join Requests</div>
              <div className="card-subtitle">{requests.length} student{requests.length !== 1 ? "s" : ""} waiting for approval</div>
            </div>
            <span className="badge badge-pending">{requests.length} pending</span>
          </div>
          {requests.map(r => (
            <div
              key={r.id}
              className="stack-mobile"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", gap: 12 }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 0 }}>
                <div
                  className="avatar"
                  style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}
                >
                  {getInitials(r.studentName)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.studentName}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{r.studentEmail} · {formatDate(r.timestamp)}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  disabled={actingId === r.id}
                  onClick={() => handleApprove(r)}
                >
                  {actingId === r.id ? "…" : "✓ Approve"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={actingId === r.id}
                  onClick={() => handleReject(r)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 14 }}
            onClick={() => setActive("requests")}
          >
            View All Requests →
          </button>
        </div>
      )}

      {/* ── Two column grid ── */}
      <div className="grid-2">
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header-row">
            <div>
              <div className="card-title">💳 Recent Transactions</div>
              <div className="card-subtitle">Last {transactions.length} payments received</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActive("fees")}>
              View All →
            </button>
          </div>
          {transactions.length === 0 && (
            <div className="empty-state" style={{ padding: "32px 0" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>💸</div>
              <p>No transactions yet</p>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginTop: 4 }}>
                Payments will appear here once fees are recorded.
              </div>
            </div>
          )}
          {transactions.map(t => (
            <div key={t.id} className="tx-row">
              <div className="tx-icon">₹</div>
              <div className="tx-meta">
                <div className="tx-name">{t.studentName}</div>
                <div className="tx-detail">{t.note || "Fee Payment"} · {t.date}</div>
              </div>
              <div className="tx-amount">+{formatCurrency(t.amount)}</div>
            </div>
          ))}
        </div>

        {/* Fee Status */}
        <div className="card">
          <div className="card-header-row">
            <div>
              <div className="card-title">📊 Fee Status</div>
              <div className="card-subtitle">
                {collectionRate}% collected · ₹{(totalDue / 1000).toFixed(0)}K pending
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActive("fees")}>
              Manage →
            </button>
          </div>

          {/* Collection rate bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: "var(--text-secondary)" }}>Overall collection</span>
              <span style={{ fontWeight: 600, color: collectionRate >= 80 ? "#22c55e" : "#f59e0b" }}>{collectionRate}%</span>
            </div>
            <div className="progress-bar" style={{ height: 6, borderRadius: 3 }}>
              <div
                className="progress-fill"
                style={{
                  width: `${collectionRate}%`,
                  background: collectionRate >= 80 ? "#22c55e" : collectionRate >= 50 ? "#f59e0b" : "#ef4444",
                  borderRadius: 3,
                }}
              />
            </div>
          </div>

          {fees.length === 0 && (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📋</div>
              <p>No fee records yet</p>
            </div>
          )}
          {fees.slice(0, 5).map(f => (
            <div key={f.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{f.studentName}</span>
                  <span style={{ color: "var(--text-tertiary)" }}> · {f.month}</span>
                </div>
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
    </div>
  );
}
