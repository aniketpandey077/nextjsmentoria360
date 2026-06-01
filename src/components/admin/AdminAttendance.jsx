"use client";
// src/components/admin/AdminAttendance.jsx
// ============================================================
// Admin marks daily attendance for all approved students.
// Batch writes to Firestore: coachings/{id}/attendance/{date}
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getCoaching, getStudentProfiles,
  markAttendance, getAttendanceForDate,
} from "../../services/firestoreService";
import toast from "react-hot-toast";

const STATUS_OPTIONS = ["present", "absent", "late"];
const STATUS_STYLE = {
  present: { bg: "var(--green)", color: "#fff" },
  absent:  { bg: "var(--red)",   color: "#fff" },
  late:    { bg: "var(--amber)", color: "#fff" },
};
const today = () => new Date().toISOString().slice(0, 10);

export default function AdminAttendance() {
  const { profile } = useAuth();
  const [students,  setStudents]  = useState([]);
  const [date,      setDate]      = useState(today());
  const [records,   setRecords]   = useState({});   // { uid: "present"|"absent"|"late" }
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  const loadStudents = async () => {
    const c = await getCoaching(profile.coachingId);
    const s = await getStudentProfiles(c?.students || []);
    setStudents(s);
    return s;
  };

  const loadAttendance = async (d, studs) => {
    const existing = await getAttendanceForDate(profile.coachingId, d);
    if (existing) {
      setRecords(existing.records || {});
      setSaved(true);
    } else {
      // Default all to present
      const defaults = {};
      (studs || students).forEach(s => { defaults[s.id] = "present"; });
      setRecords(defaults);
      setSaved(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const studs = await loadStudents();
      await loadAttendance(date, studs);
      setLoading(false);
    })();
  }, []);

  const handleDateChange = async (d) => {
    setDate(d);
    setLoading(true);
    await loadAttendance(d);
    setLoading(false);
  };

  const toggle = (uid) => {
    setRecords(prev => {
      const cur = prev[uid] || "present";
      const idx = STATUS_OPTIONS.indexOf(cur);
      const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
      return { ...prev, [uid]: next };
    });
    setSaved(false);
  };

  const setAll = (status) => {
    const all = {};
    students.forEach(s => { all[s.id] = status; });
    setRecords(all);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await markAttendance(profile.coachingId, date, records);
      toast.success(`Attendance saved for ${date}!`);
      setSaved(true);
    } catch {
      toast.error("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(records).filter(v => v === "present").length;
  const absentCount  = Object.values(records).filter(v => v === "absent").length;
  const lateCount    = Object.values(records).filter(v => v === "late").length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>📅 Attendance</h2>
        <p>Mark and track student attendance by date</p>
      </div>

      {/* Date picker + bulk actions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div>
            <label className="form-label" style={{ display: "block", marginBottom: 4 }}>Select Date</label>
            <input
              type="date"
              value={date}
              max={today()}
              onChange={e => handleDateChange(e.target.value)}
              style={{ fontSize: 14, padding: "8px 12px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
            />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setAll("present")}>✅ All Present</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setAll("absent")}>❌ All Absent</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {students.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <span className="stat-label">Total Students</span>
            <span className="stat-value" style={{ color: "var(--text)" }}>{students.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Present</span>
            <span className="stat-value" style={{ color: "var(--green)" }}>{presentCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Absent</span>
            <span className="stat-value" style={{ color: "var(--red)" }}>{absentCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Late</span>
            <span className="stat-value" style={{ color: "var(--amber)" }}>{lateCount}</span>
          </div>
        </div>
      )}

      <div className="card">
        {loading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

        {!loading && students.length === 0 && (
          <div className="empty-state">
            <div className="emoji">👥</div>
            <p>No students enrolled yet</p>
          </div>
        )}

        {!loading && students.length > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: "var(--text2)" }}>
                Click on a student's status to cycle: Present → Absent → Late
              </span>
              {saved && <span style={{ fontSize: 12, color: "var(--green)" }}>✓ Saved</span>}
            </div>

            {students.map(s => {
              const status = records[s.id] || "present";
              const style  = STATUS_STYLE[status];
              return (
                <div key={s.id} className="attendance-row" style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 0", borderBottom: "1px solid var(--border)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
                      {s.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{s.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(s.id)}
                    style={{
                      background: style.bg, color: style.color,
                      border: "none", borderRadius: 20, padding: "6px 18px",
                      fontWeight: 600, fontSize: 12, cursor: "pointer",
                      textTransform: "capitalize", minWidth: 82,
                      transition: "all 0.15s",
                    }}
                  >
                    {status}
                  </button>
                </div>
              );
            })}

            <div className="sticky-action-bar-spacer" />
            <div className="sticky-action-bar">
              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <span className="spinner" /> : `💾 Save Attendance for ${date}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

