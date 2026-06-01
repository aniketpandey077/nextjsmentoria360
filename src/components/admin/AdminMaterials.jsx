"use client";
// src/components/admin/AdminMaterials.jsx
// ============================================================
// Admin uploads study materials (PDF, video links, notes)
// stored in Firebase Storage, metadata in Firestore.
// ============================================================

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  uploadMaterial, getMaterials, deleteMaterial,
} from "../../services/firestoreService";
import Modal from "../shared/Modal";
import toast from "react-hot-toast";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science", "General"];
const TYPES    = ["PDF", "Video Link", "Notes", "Assignment", "Other"];
const TYPE_ICON = { PDF: "PDF", "Video Link": "Video", Notes: "Notes", Assignment: "Assignment", Other: "File" };

export default function AdminMaterials() {
  const { profile } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [filter,    setFilter]    = useState("All");
  const [form,      setForm]      = useState({
    title: "", subject: "Mathematics", type: "PDF", description: "", videoUrl: ""
  });
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const list = await getMaterials(profile.coachingId);
      setMaterials(list);
    } catch { toast.error("Failed to load materials."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleUpload = async () => {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    const file = fileRef.current?.files[0];
    if (form.type === "PDF" && !file && !form.videoUrl) {
      toast.error("Please select a file or provide a URL."); return;
    }

    setUploading(true);
    try {
      await uploadMaterial(profile.coachingId, {
        ...form,
        file: file || null,
        authorName: profile.name,
      }, setProgress);
      toast.success("Material uploaded!");
      setShowAdd(false);
      setForm({ title: "", subject: "Mathematics", type: "PDF", description: "", videoUrl: "" });
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e) {
      toast.error("Upload failed: " + (e.message || "Unknown error"));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Delete "${m.title}"?`)) return;
    try {
      await deleteMaterial(profile.coachingId, m.id, m.storagePath);
      setMaterials(prev => prev.filter(x => x.id !== m.id));
      toast.success("Deleted.");
    } catch { toast.error("Delete failed."); }
  };

  const subjects  = ["All", ...SUBJECTS];
  const filtered  = filter === "All" ? materials : materials.filter(m => m.subject === filter);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Study Materials</h2>
        <p>Upload notes, PDFs, and video links for your students</p>
      </div>

      {/* Filter + Add */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {subjects.map(s => (
            <button
              key={s}
              className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Upload Material</button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <p>No materials uploaded yet</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowAdd(true)}>
            Upload First Material
          </button>
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
              Uploaded by {m.authorName} · {m.uploadedAt?.seconds ? new Date(m.uploadedAt.seconds * 1000).toLocaleDateString("en-IN") : "—"}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {m.downloadUrl && (
                <a href={m.downloadUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: "center", textDecoration: "none" }}>
                  {m.type === "Video Link" ? "▶️ Watch" : "⬇️ Download"}
                </a>
              )}
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Upload Study Material">
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input placeholder="e.g. Chapter 5 – Thermodynamics Notes" value={form.title} onChange={set("title")} />
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Subject</label>
            <select value={form.subject} onChange={set("subject")}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select value={form.type} onChange={set("type")}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description (optional)</label>
          <input placeholder="Brief description of this material" value={form.description} onChange={set("description")} />
        </div>
        {form.type === "Video Link" ? (
          <div className="form-group">
            <label className="form-label">Video URL (YouTube / Drive)</label>
            <input type="url" placeholder="https://youtube.com/watch?v=..." value={form.videoUrl} onChange={set("videoUrl")} />
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">File (PDF, DOC, etc.)</label>
            <input type="file" ref={fileRef} accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.png" style={{ fontSize: 12 }} />
          </div>
        )}
        {uploading && (
          <div style={{ margin: "8px 0" }}>
            <div style={{ height: 6, background: "var(--bg3)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent)", transition: "width 0.2s" }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{progress}% uploaded</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpload} disabled={uploading}>
            {uploading ? <span className="spinner" /> : "Upload"}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

