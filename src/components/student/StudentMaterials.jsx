"use client";
// src/components/student/StudentMaterials.jsx
// ============================================================
// Student browses and downloads study materials.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useStudentCoaching } from "../../contexts/StudentCoachingContext";
import { getMaterials } from "../../services/firestoreService";

const SUBJECTS   = ["All", "Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science", "General"];
const TYPE_ICON = { PDF: "PDF", "Video Link": "Video", Notes: "Notes", Assignment: "Assignment", Other: "File" };

export default function StudentMaterials() {
  const { profile } = useAuth();
  const { activeCoachingId } = useStudentCoaching();
  const [materials, setMaterials] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("All");
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    if (!activeCoachingId) { setLoading(false); return; }
    getMaterials(activeCoachingId)
      .then(setMaterials)
      .finally(() => setLoading(false));
  }, [activeCoachingId]);

  const filtered = materials
    .filter(m => filter === "All" || m.subject === filter)
    .filter(m => !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.subject.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Study Materials</h2>
        <p>Download notes, PDFs, and watch video lectures</p>
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <div className="search-wrap">
          <span className="search-icon" aria-hidden><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg></span>
          <input
            placeholder="Search materials..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SUBJECTS.map(s => (
            <button
              key={s}
              className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter(s)}
              style={{ fontSize: 11 }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <p>{search || filter !== "All" ? "No matching materials found" : "No study materials uploaded yet"}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {filtered.map(m => (
          <div key={m.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 20, background: "var(--accent-bg)", flexShrink: 0,
              }}>
                {TYPE_ICON[m.type] || "📁"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{m.title}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{m.subject} · {m.type}</div>
                {m.description && (
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4, lineHeight: 1.5 }}>{m.description}</div>
                )}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>
              By {m.authorName} · {m.uploadedAt?.seconds ? new Date(m.uploadedAt.seconds * 1000).toLocaleDateString("en-IN") : "—"}
            </div>
            {m.downloadUrl && (
              <a
                href={m.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{ textAlign: "center", textDecoration: "none" }}
              >
                {m.type === "Video Link" ? "▶️ Watch Video" : "⬇️ Download"}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

