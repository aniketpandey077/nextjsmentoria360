"use client";
// src/components/admin/AdminRequests.jsx
// ============================================================
// Admin can view all join requests and approve/reject them.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getJoinRequests, approveJoinRequest, rejectJoinRequest } from "../../services/firestoreService";
import { getInitials, formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function AdminRequests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all"); // all | pending | approved | rejected

  const load = async () => {
    const r = await getJoinRequests(profile.coachingId);
    setRequests(r);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleApprove = async (req) => {
    try {
      await approveJoinRequest(profile.coachingId, req.id, req.studentId);
      toast.success(`${req.studentName} approved!`);
      setRequests(rs => rs.map(r => r.id === req.id ? { ...r, status: "approved" } : r));
    } catch { toast.error("Failed to approve."); }
  };

  const handleReject = async (req) => {
    try {
      await rejectJoinRequest(profile.coachingId, req.id, req.studentId);
      toast.success("Request rejected.");
      setRequests(rs => rs.map(r => r.id === req.id ? { ...r, status: "rejected" } : r));
    } catch { toast.error("Failed to reject."); }
  };

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const counts = {
    all:      requests.length,
    pending:  requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Join Requests</h2>
        <p>Review and manage student applications</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["all", "pending", "approved", "rejected"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: "1px solid",
              borderColor: filter === f ? "var(--accent)" : "var(--border2)",
              background: filter === f ? "var(--accent-bg)" : "transparent",
              color: filter === f ? "var(--accent2)" : "var(--text2)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 500,
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="card">
        {loading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="emoji">📋</div>
            <p>No {filter === "all" ? "" : filter} requests found</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Requested On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar">{getInitials(r.studentName)}</div>
                      <span style={{ fontWeight: 500 }}>{r.studentName}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--text2)" }}>{r.studentEmail}</td>
                  <td style={{ color: "var(--text3)", fontSize: 12 }}>{formatDate(r.timestamp)}</td>
                  <td>
                    <span className={`badge badge-${
                      r.status === "approved" ? "approved" :
                      r.status === "rejected" ? "rejected" : "pending"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === "pending" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(r)}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(r)}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

