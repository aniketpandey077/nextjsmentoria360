"use client";
// src/components/student/StudentClasses.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useStudentCoaching } from "../../contexts/StudentCoachingContext";
import { getClasses } from "../../services/firestoreService";

export default function StudentClasses() {
  const { profile } = useAuth();
  const { activeCoachingId } = useStudentCoaching();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCoachingId) { setLoading(false); return; }
    getClasses(activeCoachingId)
      .then(setClasses)
      .finally(() => setLoading(false));
  }, [activeCoachingId]);

  const COLORS = ["var(--accent)", "var(--green)", "var(--blue)", "var(--amber)"];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>My Classes</h2>
        <p>Your weekly schedule</p>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 60 }}><span className="spinner" /></div>}

      {!loading && classes.length === 0 && (
        <div className="card empty-state">
          <p>No classes scheduled yet</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {classes.map((cl, i) => (
          <div key={cl.id} style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderTop: `3px solid ${COLORS[i % COLORS.length]}`,
            borderRadius: "var(--radius)",
            padding: 18,
          }}>
            <h3 style={{ fontSize: 17, color: COLORS[i % COLORS.length], marginBottom: 10 }}>
              {cl.subject}
            </h3>
            <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.9 }}>
              <div>{cl.teacher}</div>
              <div>{cl.day}</div>
              <div>⏰ {cl.time}</div>
              {cl.room && <div>Room {cl.room}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

