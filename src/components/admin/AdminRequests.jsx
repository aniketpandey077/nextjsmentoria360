"use client";
// src/components/admin/AdminRequests.jsx
// ============================================================
// Admin can view all join requests and approve/reject them.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  getJoinRequestStudentId,
} from "../../services/firestoreService";
import { getInitials, formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function AdminRequests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all"); // all | pending | approved | rejected
  const [actingId, setActingId] = useState(null);

  const load = async () => {
    if (!profile?.coachingId) {
      setLoading(false);
      return;
    }
    try {
      const r = await getJoinRequests(profile.coachingId);
      setRequests(r);
    } catch (err) {
      console.error("getJoinRequests:", err);
      toast.error(err?.message || "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [profile?.coachingId]);

  const handleApprove = async (req) => {
    const studentId = getJoinRequestStudentId(req);
    if (!profile?.coachingId) {
      toast.error("Your account is not linked to an institute.");
      return;
    }
    if (!studentId) {
      toast.error("This request has no student ID. Ask the student to submit again.");
      return;
    }
    setActingId(req.id);
    try {
      await approveJoinRequest(profile.coachingId, req.id, studentId);
      toast.success(`${req.studentName || "Student"} approved!`);
      setRequests(rs => rs.map(r => r.id === req.id ? { ...r, status: "approved" } : r));
    } catch (err) {
      console.error("approveJoinRequest:", err);
      toast.error(err?.message || "Failed to approve.");
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (req) => {
    const studentId = getJoinRequestStudentId(req);
    if (!profile?.coachingId) {
      toast.error("Your account is not linked to an institute.");
      return;
    }
    if (!studentId) {
      toast.error("This request has no student ID. Ask the student to submit again.");
      return;
    }
    setActingId(req.id);
    try {
      await rejectJoinRequest(profile.coachingId, req.id, studentId);
      toast.success("Request rejected.");
      setRequests(rs => rs.map(r => r.id === req.id ? { ...r, status: "rejected" } : r));
    } catch (err) {
      console.error("rejectJoinRequest:", err);
      toast.error(err?.message || "Failed to reject.");
    } finally {
      setActingId(null);
    }
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
      <div className="filter-chips">
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
            <p>No {filter === "all" ? "" : filter} requests found</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="table-wrap">
          <table className="table-mobile-cards">
            <thead>
              <tr>
                <th>Student</th>
                <th className="hide-mobile">Email</th>
                <th>Requested On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td data-label="Student">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar">{getInitials(r.studentName)}</div>
                      <span style={{ fontWeight: 500 }}>{r.studentName}</span>
                    </div>
                  </td>
                  <td className="hide-mobile" data-label="Email" style={{ color: "var(--text2)" }}>{r.studentEmail}</td>
                  <td data-label="Requested" style={{ color: "var(--text3)", fontSize: 12 }}>{formatDate(r.timestamp)}</td>
                  <td data-label="Status">
                    <span className={`badge badge-${
                      r.status === "approved" ? "approved" :
                      r.status === "rejected" ? "rejected" : "pending"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td data-label="Actions" className="td-actions">
                    {r.status === "pending" && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={actingId === r.id}
                          onClick={() => handleApprove(r)}
                        >
                          {actingId === r.id ? "…" : "Approve"}
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
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}

