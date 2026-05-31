"use client";
// src/components/admin/AdminHomework.jsx
// ============================================================
// Admin assigns homework with due dates and views submissions.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  createHomework, getHomework, deleteHomework,
} from "../../services/firestoreService";
import Modal from "../shared/Modal";
import toast from "react-hot-toast";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science", "General"];

export default function AdminHomework() {
  const { profile } = useAuth();
  const [homework,  setHomework]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [selected,  setSelected]  = useState(null);   // view submissions
  const [form,      setForm]      = useState({
    title: "", description: "", subject: "Mathematics",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  });

  const load = async () => {
    try {
      const list = await getHomework(profile.coachingId);
      setHomework(list);
    } catch { toast.error("Failed to load homework."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    try {
      await createHomework(profile.coachingId, { ...form, authorName: profile.name });
      toast.success("Homework assigned!");
      setShowAdd(false);
      setForm({ title: "", description: "", subject: "Mathematics", dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) });
      load();
    } catch { toast.error("Failed to assign homework."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this homework?")) return;
    try {
      await deleteHomework(profile.coachingId, id);
      setHomework(prev => prev.filter(h => h.id !== id));
      toast.success("Deleted.");
    } catch { toast.error("Delete failed."); }
  };

  const isOverdue = (dueDate) => dueDate && dueDate < new Date().toISOString().slice(0, 10);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>📋 Homework</h2>
        <p>Assign homework and track student submissions</p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Assign Homework</button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

      {!loading && homework.length === 0 && (
        <div className="empty-state">
          <div className="emoji">📋</div>
          <p>No homework assigned yet</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowAdd(true)}>
            Assign First Homework
          </button>
        </div>
      )}

      {homework.map(hw => {
        const submittedCount = Object.keys(hw.submissions || {}).length;
        const overdue = isOverdue(hw.dueDate);

        return (
          <div key={hw.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                    background: "var(--accent-bg)", color: "var(--accent)", letterSpacing: "0.05em",
                  }}>
                    {hw.subject?.toUpperCase()}
                  </span>
                  {overdue && (
                    <span style={{ fontSize: 10, color: "var(--red)", fontWeight: 600 }}>⚠️ OVERDUE</span>
                  )}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{hw.title}</div>
                {hw.description && (
                  <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5, marginBottom: 6 }}>{hw.description}</div>
                )}
                <div style={{ fontSize: 11, color: "var(--text3)" }}>
                  Due: <strong style={{ color: overdue ? "var(--red)" : "var(--text2)" }}>{hw.dueDate}</strong>
                  {" · "}By {hw.authorName}
                  {" · "}
                  <span style={{ color: submittedCount > 0 ? "var(--green)" : "var(--text3)" }}>
                    {submittedCount} submission{submittedCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelected(hw)}>
                  View Submissions
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(hw.id)}>Delete</button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Submissions Modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Submissions: ${selected.title}`}>
          {Object.keys(selected.submissions || {}).length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <p>No submissions yet</p>
            </div>
          ) : (
            Object.entries(selected.submissions).map(([uid, sub]) => (
              <div key={uid} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{sub.studentName}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                  Submitted: {sub.submittedAt?.seconds ? new Date(sub.submittedAt.seconds * 1000).toLocaleString("en-IN") : "—"}
                </div>
                {sub.note && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{sub.note}</div>}
              </div>
            ))
          )}
          <button className="btn btn-secondary" style={{ marginTop: 16, width: "100%" }} onClick={() => setSelected(null)}>Close</button>
        </Modal>
      )}

      {/* Create Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Assign Homework">
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input placeholder="e.g. Solve Exercises 5.1 to 5.5" value={form.title} onChange={set("title")} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            placeholder="Additional instructions..."
            value={form.description} onChange={set("description")} rows={3}
            style={{ resize: "vertical", width: "100%", fontFamily: "inherit", fontSize: 13, padding: "10px 12px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <select value={form.subject} onChange={set("subject")}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" value={form.dueDate} onChange={set("dueDate")} min={new Date().toISOString().slice(0, 10)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate}>Assign</button>
          <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

