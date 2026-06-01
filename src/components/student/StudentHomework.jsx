"use client";
// src/components/student/StudentHomework.jsx
// ============================================================
// Student views homework and marks it as submitted.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useStudentCoaching } from "../../contexts/StudentCoachingContext";
import { getHomework, submitHomework } from "../../services/firestoreService";
import toast from "react-hot-toast";

export default function StudentHomework() {
  const { profile } = useAuth();
  const { activeCoachingId } = useStudentCoaching();
  const [homework,  setHomework]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [notes,     setNotes]     = useState({});

  const load = async () => {
    try {
      const list = await getHomework(activeCoachingId);
      setHomework(list);
    } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => {
    if (!activeCoachingId) { setLoading(false); return; }
    load();
  }, [activeCoachingId]);

  const handleSubmit = async (hw) => {
    setSubmitting(hw.id);
    try {
      await submitHomework(activeCoachingId, hw.id, {
        studentId:   profile.uid,
        studentName: profile.name,
        note:        notes[hw.id] || "",
      });
      toast.success("Homework submitted!");
      load();
    } catch { toast.error("Submission failed."); }
    finally { setSubmitting(null); }
  };

  const submitted = (hw) => !!hw.submissions?.[profile.uid];
  const isOverdue = (d) => d && d < new Date().toISOString().slice(0, 10);

  const pending  = homework.filter(hw => !submitted(hw));
  const done     = homework.filter(hw => submitted(hw));

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Homework</h2>
        <p>View assigned homework and mark as submitted</p>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

      {!loading && homework.length === 0 && (
        <div className="empty-state">
          <p>No homework assigned yet</p>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>Your teacher will assign homework here</span>
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            ⏳ Pending ({pending.length})
          </div>
          {pending.map(hw => {
            const overdue = isOverdue(hw.dueDate);
            return (
              <div key={hw.id} className="card" style={{ marginBottom: 12, borderLeft: `3px solid ${overdue ? "var(--red)" : "var(--accent)"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                    background: "var(--accent-bg)", color: "var(--accent)",
                  }}>
                    {hw.subject?.toUpperCase()}
                  </span>
                  {overdue && <span style={{ fontSize: 10, color: "var(--red)", fontWeight: 600 }}>OVERDUE</span>}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{hw.title}</div>
                {hw.description && (
                  <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5, marginBottom: 8 }}>{hw.description}</div>
                )}
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12 }}>
                  Due: <strong style={{ color: overdue ? "var(--red)" : "var(--text)" }}>{hw.dueDate}</strong>
                </div>
                <textarea
                  placeholder="Add a note (optional)..."
                  value={notes[hw.id] || ""}
                  onChange={e => setNotes(n => ({ ...n, [hw.id]: e.target.value }))}
                  rows={2}
                  style={{ width: "100%", resize: "vertical", fontFamily: "inherit", fontSize: 12, padding: "8px 10px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", marginBottom: 10 }}
                />
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleSubmit(hw)}
                  disabled={submitting === hw.id}
                  style={{ width: "100%" }}
                >
                  {submitting === hw.id ? <span className="spinner" /> : "✓ Mark as Submitted"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            ✅ Submitted ({done.length})
          </div>
          {done.map(hw => (
            <div key={hw.id} className="card" style={{ marginBottom: 10, borderLeft: "3px solid var(--green)", opacity: 0.85 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{hw.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                    {hw.subject} · Due {hw.dueDate}
                  </div>
                </div>
                <span className="badge badge-approved">Submitted</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

