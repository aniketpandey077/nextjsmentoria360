"use client";
// src/components/admin/AdminBatches.jsx
// ============================================================
// Admin manages student Batches (groups).
// Each batch has: name, subject, schedule, description,
// and a list of enrolled students.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  createBatch, getBatches, updateBatch, deleteBatch,
  getCoaching, getStudentProfiles,
} from "../../services/firestoreService";
import Modal from "../shared/Modal";
import toast from "react-hot-toast";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const emptyForm = () => ({
  name: "", subject: "", schedule: "", description: "",
  days: [], startTime: "", endTime: "", studentIds: [],
});

export default function AdminBatches() {
  const { profile } = useAuth();
  const [batches,   setBatches]   = useState([]);
  const [students,  setStudents]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [editBatch, setEditBatch] = useState(null); // batch being edited
  const [managing,  setManaging]  = useState(null); // batch whose students we're managing
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState(emptyForm());

  const load = async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([
        getBatches(profile.coachingId),
        getCoaching(profile.coachingId),
      ]);
      const s = await getStudentProfiles(c?.students || []);
      setBatches(b);
      setStudents(s);
    } catch { toast.error("Failed to load batches."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day],
    }));
  };

  const toggleStudent = (id) => {
    setForm(f => ({
      ...f,
      studentIds: f.studentIds.includes(id)
        ? f.studentIds.filter(x => x !== id)
        : [...f.studentIds, id],
    }));
  };

  const openAdd = () => {
    setForm(emptyForm());
    setEditBatch(null);
    setShowAdd(true);
  };

  const openEdit = (batch) => {
    setEditBatch(batch);
    setForm({
      name:        batch.name        || "",
      subject:     batch.subject     || "",
      schedule:    batch.schedule    || "",
      description: batch.description || "",
      days:        batch.days        || [],
      startTime:   batch.startTime   || "",
      endTime:     batch.endTime     || "",
      studentIds:  batch.studentIds  || [],
    });
    setShowAdd(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Batch name is required."); return; }
    setSaving(true);
    try {
      const scheduleStr = form.days.length > 0
        ? `${form.days.join("/")} ${form.startTime}–${form.endTime}`.trim()
        : form.schedule;

      const data = {
        name:        form.name.trim(),
        subject:     form.subject.trim(),
        schedule:    scheduleStr,
        description: form.description.trim(),
        days:        form.days,
        startTime:   form.startTime,
        endTime:     form.endTime,
        studentIds:  form.studentIds,
      };

      if (editBatch) {
        await updateBatch(profile.coachingId, editBatch.id, data);
        toast.success("Batch updated!");
      } else {
        await createBatch(profile.coachingId, data);
        toast.success("Batch created!");
      }
      setShowAdd(false);
      setEditBatch(null);
      await load();
    } catch { toast.error("Failed to save batch."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this batch? Students won't be removed from the coaching, just from this batch.")) return;
    try {
      await deleteBatch(profile.coachingId, id);
      setBatches(prev => prev.filter(b => b.id !== id));
      toast.success("Batch deleted.");
    } catch { toast.error("Delete failed."); }
  };

  // ── Manage students in batch ────────────────────────────
  const handleToggleStudentInBatch = async (batch, studentId) => {
    const current = batch.studentIds || [];
    const updated = current.includes(studentId)
      ? current.filter(x => x !== studentId)
      : [...current, studentId];
    try {
      await updateBatch(profile.coachingId, batch.id, { ...batch, studentIds: updated });
      setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, studentIds: updated } : b));
      setManaging(prev => prev ? { ...prev, studentIds: updated } : prev);
    } catch { toast.error("Failed to update batch students."); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>📦 Batches</h2>
        <p>Group students into batches by schedule, subject, or level</p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={openAdd}>+ Create Batch</button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

      {!loading && batches.length === 0 && (
        <div className="empty-state">
          <div className="emoji">📦</div>
          <p>No batches created yet</p>
          <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
            Create batches to group students by schedule, subject, or level.
          </p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={openAdd}>
            Create First Batch
          </button>
        </div>
      )}

      {/* Batch cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {batches.map(b => {
          const count = b.studentIds?.length || 0;
          return (
            <div key={b.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{b.name}</div>
                  {b.subject && (
                    <span style={{
                      fontSize: 10, padding: "2px 9px", borderRadius: 20,
                      background: "var(--accent-bg)", color: "var(--accent)", fontWeight: 600,
                    }}>{b.subject}</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" style={{ fontSize: 11 }} onClick={() => openEdit(b)}>Edit</button>
                  <button className="btn btn-danger btn-sm" style={{ fontSize: 11 }} onClick={() => handleDelete(b.id)}>✕</button>
                </div>
              </div>

              {/* Schedule */}
              {b.schedule && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text2)" }}>
                  <span>🕐</span> {b.schedule}
                </div>
              )}

              {/* Days pills */}
              {b.days?.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {b.days.map(d => (
                    <span key={d} style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                      background: "rgba(108,99,255,0.15)", color: "var(--accent2)",
                    }}>{d}</span>
                  ))}
                </div>
              )}

              {/* Description */}
              {b.description && (
                <p style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.5, margin: 0 }}>{b.description}</p>
              )}

              {/* Student count + manage button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                <span style={{ fontSize: 12, color: "var(--text3)" }}>
                  👥 {count} student{count !== 1 ? "s" : ""}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11 }}
                  onClick={() => setManaging(b)}
                >
                  Manage Students
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Create / Edit Batch Modal ───────────────────── */}
      <Modal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setEditBatch(null); }}
        title={editBatch ? "Edit Batch" : "Create Batch"}
      >
        <div className="form-group">
          <label className="form-label">Batch Name *</label>
          <input value={form.name} onChange={set("name")} placeholder="e.g. Morning Batch A" />
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input value={form.subject} onChange={set("subject")} placeholder="e.g. IIT-JEE, Maths" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input value={form.description} onChange={set("description")} placeholder="Short note about this batch" />
          </div>
        </div>

        {/* Days of week */}
        <div className="form-group">
          <label className="form-label">Days</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {DAYS.map(d => (
              <button
                key={d} type="button"
                className={`btn btn-sm ${form.days.includes(d) ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: 11, minWidth: 40 }}
                onClick={() => toggleDay(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Time range */}
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Start Time</label>
            <input type="time" value={form.startTime} onChange={set("startTime")} />
          </div>
          <div className="form-group">
            <label className="form-label">End Time</label>
            <input type="time" value={form.endTime} onChange={set("endTime")} />
          </div>
        </div>

        {/* Students (optional during create) */}
        {students.length > 0 && (
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>
                Assign Students
                {form.studentIds.length > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: "var(--accent)" }}>
                    {form.studentIds.length} selected
                  </span>
                )}
              </label>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                style={{ fontSize: 10 }}
                onClick={() => setForm(f => ({
                  ...f,
                  studentIds: f.studentIds.length === students.length ? [] : students.map(s => s.id),
                }))}
              >
                {form.studentIds.length === students.length ? "Clear All" : "Select All"}
              </button>
            </div>
            <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg3)" }}>
              {students.map((s, i) => {
                const sel = form.studentIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleStudent(s.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                      borderBottom: i < students.length - 1 ? "1px solid var(--border)" : "none",
                      background: sel ? "rgba(108,99,255,0.08)" : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${sel ? "var(--accent)" : "var(--border2)"}`,
                      background: sel ? "var(--accent)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {sel && <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13 }}>{s.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : editBatch ? "Update Batch" : "Create Batch"}
          </button>
          <button className="btn btn-secondary" onClick={() => { setShowAdd(false); setEditBatch(null); }}>Cancel</button>
        </div>
      </Modal>

      {/* ── Manage Students Modal ────────────────────────── */}
      {managing && (
        <Modal isOpen={!!managing} onClose={() => setManaging(null)} title={`Students — ${managing.name}`}>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
            Toggle students in/out of this batch. Changes are saved immediately.
          </p>
          {students.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}>
              <p style={{ fontSize: 13 }}>No students enrolled in this coaching yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 350, overflowY: "auto" }}>
              {students.map(s => {
                const inBatch = (managing.studentIds || []).includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => handleToggleStudentInBatch(managing, s.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                      background: inBatch ? "var(--accent-bg)" : "var(--bg3)",
                      border: `1px solid ${inBatch ? "var(--accent)" : "var(--border)"}`,
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${inBatch ? "var(--accent)" : "var(--border2)"}`,
                      background: inBatch ? "var(--accent)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {inBatch && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: inBatch ? 600 : 400 }}>{s.name}</span>
                    {inBatch && (
                      <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 600 }}>In Batch</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <button className="btn btn-secondary" style={{ marginTop: 14, width: "100%" }} onClick={() => setManaging(null)}>Done</button>
        </Modal>
      )}
    </div>
  );
}

