"use client";
// src/components/student/StudentAttendance.jsx
// ============================================================
// Student sees their attendance % and a full history calendar.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useStudentCoaching } from "../../contexts/StudentCoachingContext";
import { getStudentAttendanceHistory } from "../../services/firestoreService";

const STATUS_EMOJI = { present: "✅", absent: "❌", late: "🕐" };
const STATUS_COLOR = { present: "var(--green)", absent: "var(--red)", late: "var(--amber)" };

export default function StudentAttendance() {
  const { profile } = useAuth();
  const { activeCoachingId } = useStudentCoaching();
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!activeCoachingId) { setLoading(false); return; }
    getStudentAttendanceHistory(activeCoachingId, profile.uid)
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCoachingId]);

  const total   = records.length;
  const present = records.filter(r => r.status === "present").length;
  const absent  = records.filter(r => r.status === "absent").length;
  const late    = records.filter(r => r.status === "late").length;
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0;

  const pctColor = pct >= 75 ? "var(--green)" : pct >= 50 ? "var(--amber)" : "var(--red)";

  // Group by month
  const byMonth = {};
  records.forEach(r => {
    const [yr, mo] = r.date.split("-");
    const key = `${yr}-${mo}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(r);
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>📅 My Attendance</h2>
        <p>Track your presence and attendance percentage</p>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

      {!loading && (
        <>
          {/* Attendance % */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card" style={{ gridColumn: "span 2", textAlign: "center" }}>
              <span className="stat-label">Overall Attendance</span>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: pctColor, fontFamily: "Syne, sans-serif" }}>
                  {pct}%
                </span>
              </div>
              {/* Progress bar */}
              <div style={{ height: 8, background: "var(--bg3)", borderRadius: 10, margin: "12px 0 4px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pctColor, borderRadius: 10, transition: "width 0.5s" }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>
                {pct >= 75 ? "✅ Good attendance!" : pct >= 50 ? "⚠️ At risk — attendance below 75%" : "🚨 Critical — attendance very low!"}
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Classes</span>
              <span className="stat-value" style={{ color: "var(--text)" }}>{total}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Present</span>
              <span className="stat-value" style={{ color: "var(--green)" }}>{present}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Absent</span>
              <span className="stat-value" style={{ color: "var(--red)" }}>{absent}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Late</span>
              <span className="stat-value" style={{ color: "var(--amber)" }}>{late}</span>
            </div>
          </div>

          {/* Monthly history */}
          {Object.keys(byMonth).length === 0 ? (
            <div className="empty-state">
              <div className="emoji">📅</div>
              <p>No attendance records yet</p>
              <span style={{ fontSize: 12, color: "var(--text3)" }}>Your institute admin will start marking attendance soon</span>
            </div>
          ) : (
            Object.keys(byMonth).sort().reverse().map(monthKey => {
              const [yr, mo] = monthKey.split("-");
              const monthName = new Date(yr, mo - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
              const monthRecords = byMonth[monthKey];
              const mp = monthRecords.filter(r => r.status === "present").length;
              const mt = monthRecords.length;

              return (
                <div key={monthKey} className="card" style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14 }}>{monthName}</h3>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                      background: mt > 0 && mp / mt >= 0.75 ? "rgba(34,197,94,0.15)" : "rgba(234,179,8,0.15)",
                      color: mt > 0 && mp / mt >= 0.75 ? "var(--green)" : "var(--amber)",
                    }}>
                      {mt > 0 ? Math.round((mp / mt) * 100) : 0}% ({mp}/{mt})
                    </span>
                  </div>

                  {/* Day grid */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {monthRecords.sort((a, b) => a.date.localeCompare(b.date)).map(r => (
                      <div
                        key={r.date}
                        title={`${r.date}: ${r.status}`}
                        style={{
                          width: 44, textAlign: "center", padding: "6px 4px", borderRadius: 8,
                          background: STATUS_COLOR[r.status] + "22",
                          border: `1px solid ${STATUS_COLOR[r.status]}44`,
                          cursor: "default",
                        }}
                      >
                        <div style={{ fontSize: 10, color: STATUS_COLOR[r.status], fontWeight: 600 }}>
                          {r.date.slice(8)}
                        </div>
                        <div style={{ fontSize: 12 }}>{STATUS_EMOJI[r.status]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}

