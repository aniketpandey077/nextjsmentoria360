"use client";
// src/components/student/StudentWorkshops.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useStudentCoaching } from "../../contexts/StudentCoachingContext";
import { getWorkshops, enrollInWorkshop } from "../../services/firestoreService";
import toast from "react-hot-toast";

export default function StudentWorkshops() {
  const { profile } = useAuth();
  const { activeCoachingId } = useStudentCoaching();
  const [workshops, setWorkshops] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [enrolled,  setEnrolled]  = useState(new Set());

  useEffect(() => {
    if (!activeCoachingId) { setLoading(false); return; }
    getWorkshops(activeCoachingId)
      .then(setWorkshops)
      .finally(() => setLoading(false));
  }, [activeCoachingId]);

  const handleEnroll = async (w) => {
    if (enrolled.has(w.id)) { toast("Already registered!"); return; }
    if ((w.enrolled || 0) >= w.seats) { toast.error("Workshop is full."); return; }
    try {
      await enrollInWorkshop(activeCoachingId, w.id);
      setEnrolled(s => new Set([...s, w.id]));
      setWorkshops(ws => ws.map(x => x.id === w.id ? { ...x, enrolled: (x.enrolled || 0) + 1 } : x));
      toast.success(`Registered for "${w.title}"!`);
    } catch { toast.error("Enrollment failed."); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Workshops</h2>
        <p>Special events and programs at your institute</p>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 60 }}><span className="spinner" /></div>}

      {!loading && workshops.length === 0 && (
        <div className="card empty-state">
          <div className="emoji">🎓</div>
          <p>No upcoming workshops</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {workshops.map(w => {
          const pct  = Math.round(((w.enrolled || 0) / (w.seats || 1)) * 100);
          const full = (w.enrolled || 0) >= (w.seats || 1);
          const done = enrolled.has(w.id);

          return (
            <div key={w.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 17, fontFamily: "Syne, sans-serif", marginBottom: 6 }}>{w.title}</h3>
                  {w.description && (
                    <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8 }}>{w.description}</p>
                  )}
                  <div style={{ fontSize: 13, color: "var(--text2)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span>📅 {w.date}</span>
                    {w.time && <span>⏰ {w.time}</span>}
                    <span>💺 {w.seats - (w.enrolled || 0)} seats left</span>
                    <span>{w.fee === 0 ? "🆓 Free" : `💰 ₹${w.fee}`}</span>
                  </div>
                </div>
                <button
                  className={`btn btn-sm ${done ? "btn-secondary" : full ? "btn-danger" : "btn-primary"}`}
                  onClick={() => handleEnroll(w)}
                  disabled={full && !done}
                  style={{ marginLeft: 16, flexShrink: 0 }}
                >
                  {done ? "✓ Registered" : full ? "Full" : "Register"}
                </button>
              </div>
              <div className="progress-bar" style={{ marginTop: 14 }}>
                <div className="progress-fill" style={{
                  width: `${pct}%`,
                  background: full ? "var(--red)" : "var(--accent)",
                }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
                {pct}% filled
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

