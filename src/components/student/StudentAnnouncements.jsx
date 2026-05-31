"use client";
// src/components/student/StudentAnnouncements.jsx
// ============================================================
// Student reads announcements in real-time via Firestore onSnapshot.
// ============================================================

import React, { useEffect, useState } from "react";
import { useStudentCoaching } from "../../contexts/StudentCoachingContext";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";

const CAT_COLOR = {
  General: "var(--accent)", Exam: "var(--blue)", "Fee Reminder": "var(--amber)",
  Holiday: "var(--green)", Event: "var(--accent2)", Urgent: "var(--red)",
};

export default function StudentAnnouncements() {
  const { profile } = useAuth();
  const { activeCoachingId } = useStudentCoaching();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCoachingId) { setLoading(false); return; }

    const q = query(
      collection(db, "coachings", activeCoachingId, "announcements"),
      orderBy("pinned", "desc"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));

    return unsub;
  }, [activeCoachingId]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>📢 Announcements</h2>
        <p>Latest updates from your coaching institute</p>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <div className="emoji">📢</div>
          <p>No announcements yet</p>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>Your institute admin will post updates here</span>
        </div>
      )}

      {items.map(item => {
        const catColor = CAT_COLOR[item.category] || "var(--accent)";
        const ts = item.createdAt?.seconds
          ? new Date(item.createdAt.seconds * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
          : "Recently";

        return (
          <div key={item.id} className="card" style={{ marginBottom: 12, borderLeft: `3px solid ${catColor}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {item.pinned && <span style={{ fontSize: 12 }}>📌</span>}
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                background: catColor + "22", color: catColor, letterSpacing: "0.05em",
              }}>
                {item.category?.toUpperCase()}
              </span>
              {item.pinned && (
                <span style={{ fontSize: 10, color: "var(--text3)", marginLeft: "auto" }}>Pinned</span>
              )}
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{item.title}</div>
            {item.body && (
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{item.body}</div>
            )}
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>
              Posted by {item.authorName} · {ts}
            </div>
          </div>
        );
      })}
    </div>
  );
}

