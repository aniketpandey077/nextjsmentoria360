"use client";
// src/components/admin/AdminClasses.jsx
// ============================================================
// Create and manage class schedules.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getClasses, addClass, deleteClass } from "../../services/firestoreService";
import Modal from "../shared/Modal";
import Icon from "../shared/Icon";
import toast from "react-hot-toast";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AdminClasses() {
  const { profile } = useAuth();
  const [classes,  setClasses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [form, setForm]         = useState({ subject: "", teacher: "", day: "", time: "", room: "" });

  const load = async () => {
    const c = await getClasses(profile.coachingId);
    setClasses(c);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleAdd = async () => {
    if (!form.subject || !form.teacher) { toast.error("Fill subject and teacher."); return; }
    try {
      await addClass(profile.coachingId, form);
      toast.success("Class added!");
      setForm({ subject: "", teacher: "", day: "", time: "", room: "" });
      setShowAdd(false);
      load();
    } catch { toast.error("Failed to add class."); }
  };

  const handleDelete = async (classId, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      await deleteClass(profile.coachingId, classId);
      setClasses(c => c.filter(x => x.id !== classId));
      toast.success("Class deleted.");
    } catch { toast.error("Failed to delete."); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Class Schedule</h2>
        <p>Manage your timetable</p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={12} /> Add Class
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 60 }}><span className="spinner" /></div>}

      {!loading && classes.length === 0 && (
        <div className="card empty-state"><div className="emoji">📚</div><p>No classes scheduled yet</p></div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {classes.map(cl => (
          <div key={cl.id} style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 18,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <h3 style={{ fontSize: 17, fontFamily: "Syne, sans-serif", color: "var(--accent2)" }}>{cl.subject}</h3>
              <button
                className="btn btn-danger btn-sm"
                style={{ padding: "4px 8px" }}
                onClick={() => handleDelete(cl.id, cl.subject)}
              >
                <Icon name="trash" size={12} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.8 }}>
              <div>👨‍🏫 {cl.teacher}</div>
              <div>📅 {cl.day}</div>
              <div>⏰ {cl.time}</div>
              {cl.room && <div>🏫 Room {cl.room}</div>}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Class">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input placeholder="e.g. Physics" value={form.subject} onChange={set("subject")} />
          </div>
          <div className="form-group">
            <label className="form-label">Teacher *</label>
            <input placeholder="Dr. Kapoor" value={form.teacher} onChange={set("teacher")} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Days</label>
            <input placeholder="Mon/Wed/Fri" value={form.day} onChange={set("day")} />
          </div>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input placeholder="8:00 AM" value={form.time} onChange={set("time")} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Room / Location</label>
          <input placeholder="A101" value={form.room} onChange={set("room")} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd}>Add Class</button>
          <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

