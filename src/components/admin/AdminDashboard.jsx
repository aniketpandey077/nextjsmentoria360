"use client";
// src/components/admin/AdminDashboard.jsx
// ============================================================
// Main dashboard for coaching admins. Shows stats, pending
// requests, recent transactions, fee status overview, and
// Explore visibility toggle.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getCoaching, getJoinRequests, getCoachingFees,
  getTransactions, approveJoinRequest, rejectJoinRequest,
  updateExploreVisibility,
} from "../../services/firestoreService";
import { formatCurrency, formatDate, getInitials } from "../../utils/helpers";
import toast from "react-hot-toast";

// ── Explore Visibility Toggle Card ───────────────────────────
function ExploreToggleCard({ coachingId, initialValue }) {
  const [visible,  setVisible]  = useState(initialValue !== false);
  const [saving,   setSaving]   = useState(false);

  const toggle = async () => {
    const next = !visible;
    setVisible(next);   // optimistic
    setSaving(true);
    try {
      await updateExploreVisibility(coachingId, next);
      toast.success(next ? "Institute is now visible on Explore 🟢" : "Institute hidden from Explore 🔴");
    } catch {
      setVisible(!next); // rollback
      toast.error("Failed to update visibility.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="stat-card"
      style={{
        display: "flex", flexDirection: "column", gap: 14,
        background: visible
          ? "linear-gradient(135deg, rgba(16,185,129,.08), rgba(16,185,129,.03))"
          : "linear-gradient(135deg, rgba(239,68,68,.08), rgba(239,68,68,.03))",
        border: `1px solid ${visible ? "rgba(16,185,129,.25)" : "rgba(239,68,68,.22)"}`,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 22, marginBottom: 4 }}>🔍</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Explore Visibility
          </div>
        </div>
        {/* Toggle switch */}
        <button
          onClick={toggle}
          disabled={saving}
          title={visible ? "Click to hide from Explore" : "Click to show on Explore"}
          style={{
            width: 52, height: 28,
            borderRadius: 14,
            border: "none",
            background: visible ? "var(--green)" : "var(--bg3)",
            position: "relative",
            cursor: saving ? "not-allowed" : "pointer",
            transition: "background .3s",
            flexShrink: 0,
            boxShadow: visible ? "0 0 12px rgba(16,185,129,.4)" : "none",
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

      {/* Status text */}
      <div>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: visible ? "var(--green)" : "var(--red)",
          marginBottom: 4,
        }}>
          {saving ? "Saving…" : visible ? "🟢 Visible to students" : "🔴 Hidden from search"}
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>
          {visible
            ? "Students can find and join your institute from the Explore page."
            : "Your institute won't appear in student searches. Existing students are unaffected."}
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────
export default function AdminDashboard({ setActive }) {
  const { profile } = useAuth();
  const [coaching,      setCoaching]      = useState(null);
  const [requests,      setRequests]      = useState([]);
  const [fees,          setFees]          = useState([]);
  const [transactions,  setTransactions]  = useState([]);
  const [studentCount,  setStudentCount]  = useState(0);
  const [loading,       setLoading]       = useState(true);

  const loadData = async () => {
    try {
      const c  = await getCoaching(profile.coachingId);
      const jr = await getJoinRequests(profile.coachingId);
      const f  = await getCoachingFees(profile.coachingId);
      const tx = await getTransactions(profile.coachingId);
      setCoaching(c);
      setRequests(jr.filter(r => r.status === "pending"));
      setFees(f);
      setTransactions(tx.slice(0, 5));
      setStudentCount(c?.students?.length || 0);
    } catch (e) {
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [profile.coachingId]);

  const handleApprove = async (req) => {
    try {
      await approveJoinRequest(profile.coachingId, req.id, req.studentId);
      toast.success(`${req.studentName} approved!`);
      setRequests(r => r.filter(x => x.id !== req.id));
      setStudentCount(n => n + 1);
    } catch { toast.error("Approval failed."); }
  };

  const handleReject = async (req) => {
    try {
      await rejectJoinRequest(profile.coachingId, req.id, req.studentId);
      toast.success(`${req.studentName}'s request rejected.`);
      setRequests(r => r.filter(x => x.id !== req.id));
    } catch { toast.error("Rejection failed."); }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <span className="spinner" />
    </div>
  );

  const totalRevenue = fees.reduce((s, f) => s + (f.paid  || 0), 0);
  const totalDue     = fees.reduce((s, f) => s + (f.due   || 0), 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>{coaching?.name || "Dashboard"}</h2>
        <p>{coaching?.city} · {coaching?.subject}</p>
      </div>

      {/* Stats — 4 existing + Explore toggle */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
        <div className="stat-card">
          <span className="stat-label">Total Students</span>
          <span className="stat-value" style={{ color: "var(--accent2)" }}>{studentCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value" style={{ color: "var(--green)" }}>{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending Dues</span>
          <span className="stat-value" style={{ color: "var(--amber)" }}>{formatCurrency(totalDue)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending Requests</span>
          <span className="stat-value" style={{ color: requests.length > 0 ? "var(--red)" : "var(--green)" }}>
            {requests.length}
          </span>
        </div>
        {/* ── Explore Visibility Toggle ── */}
        <ExploreToggleCard
          coachingId={profile.coachingId}
          initialValue={coaching?.showInExplore}
        />
      </div>

      {/* Pending join requests */}
      {requests.length > 0 && (
        <div className="card" style={{ borderLeft: "3px solid var(--amber)", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15 }}>Pending Join Requests</h3>
            <span className="badge badge-pending">{requests.length} pending</span>
          </div>
          {requests.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div className="avatar">{getInitials(r.studentName)}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.studentName}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{r.studentEmail} · {formatDate(r.timestamp)}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-success btn-sm" onClick={() => handleApprove(r)}>Approve</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleReject(r)}>Reject</button>
              </div>
            </div>
          ))}
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 12 }}
            onClick={() => setActive("requests")}
          >
            View All Requests →
          </button>
        </div>
      )}

      <div className="grid-2">
        {/* Recent transactions */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Recent Transactions</h3>
          {transactions.length === 0 && (
            <div className="empty-state" style={{ padding: 24 }}>
              <p>No transactions yet</p>
            </div>
          )}
          {transactions.map(t => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{t.studentName}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{t.note} · {t.date}</div>
              </div>
              <div style={{ color: "var(--green)", fontWeight: 500, fontSize: 13 }}>
                +{formatCurrency(t.amount)}
              </div>
            </div>
          ))}
        </div>

        {/* Fee status */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Fee Status</h3>
          {fees.length === 0 && (
            <div className="empty-state" style={{ padding: 24 }}>
              <p>No fee records yet</p>
            </div>
          )}
          {fees.slice(0, 5).map(f => (
            <div key={f.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span>{f.studentName} — {f.month}</span>
                <span className={`badge badge-${f.status === "paid" ? "approved" : f.status === "partial" ? "pending" : "rejected"}`}>
                  {f.status}
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.round((f.paid / f.amount) * 100)}%` }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                {formatCurrency(f.paid)} of {formatCurrency(f.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

