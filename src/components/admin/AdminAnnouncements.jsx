"use client";
// src/components/admin/AdminAnnouncements.jsx
// ============================================================
// Admin creates / manages announcements for their coaching.
// Students see these on their announcements page in real-time.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  createAnnouncement, getAnnouncements, deleteAnnouncement, pinAnnouncement,
} from "../../services/firestoreService";
import Modal from "../shared/Modal";
import toast from "react-hot-toast";

const CATEGORIES = ["General", "Exam", "Fee Reminder", "Holiday", "Event", "Urgent"];
const CAT_COLOR = {
  General: "var(--accent)", Exam: "var(--blue)", "Fee Reminder": "var(--amber)",
  Holiday: "var(--green)", Event: "var(--accent2)", Urgent: "var(--red)",
};

export default function AdminAnnouncements() {
  const { profile } = useAuth();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form,    setForm]    = useState({ title: "", body: "", category: "General", pinned: false });

  const load = async () => {
    try {
      const list = await getAnnouncements(profile.coachingId);
      setItems(list);
    } catch { toast.error("Failed to load announcements."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    try {
      await createAnnouncement(profile.coachingId, {
        ...form,
        authorName: profile.name,
      });
      toast.success("Announcement posted!");
      setShowAdd(false);
      setForm({ title: "", body: "", category: "General", pinned: false });
      load();
    } catch { toast.error("Failed to post announcement."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteAnnouncement(profile.coachingId, id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success("Deleted.");
    } catch { toast.error("Delete failed."); }
  };

  const handlePin = async (item) => {
    try {
      await pinAnnouncement(profile.coachingId, item.id, !item.pinned);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, pinned: !item.pinned } : i));
    } catch { toast.error("Failed to update pin."); }
  };

  const pinned   = items.filter(i => i.pinned);
  const unpinned = items.filter(i => !i.pinned);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>📢 Announcements</h2>
        <p>Post notices, exam schedules, and holiday updates to your students</p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + New Announcement
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <div className="emoji">📢</div>
          <p>No announcements yet</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowAdd(true)}>
            Post Your First Announcement
          </button>
        </div>
      )}

      {/* Pinned */}
      {pinned.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
            📌 Pinned
          </div>
          {pinned.map(item => (
            <AnnouncementCard key={item.id} item={item} onDelete={handleDelete} onPin={handlePin} isAdmin />
          ))}
        </div>
      )}

      {/* All others */}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
              All Posts
            </div>
          )}
          {unpinned.map(item => (
            <AnnouncementCard key={item.id} item={item} onDelete={handleDelete} onPin={handlePin} isAdmin />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Announcement">
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input placeholder="e.g. Exam schedule for April" value={form.title} onChange={set("title")} />
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea
            placeholder="Write your announcement here..."
            value={form.body} onChange={set("body")}
            rows={4}
            style={{ resize: "vertical", width: "100%", fontFamily: "inherit", fontSize: 13, padding: "10px 12px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select value={form.category} onChange={set("category")}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", paddingBottom: 10 }}>
              <input type="checkbox" checked={form.pinned} onChange={set("pinned")} style={{ accentColor: "var(--accent)" }} />
              📌 Pin this announcement
            </label>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate}>Post Announcement</button>
          <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

function AnnouncementCard({ item, onDelete, onPin, isAdmin }) {
  const catColor = CAT_COLOR[item.category] || "var(--accent)";
  const ts = item.createdAt?.seconds
    ? new Date(item.createdAt.seconds * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "Just now";

  return (
    <div className="card" style={{ marginBottom: 12, borderLeft: `3px solid ${catColor}`, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            {item.pinned && <span style={{ fontSize: 12 }}>📌</span>}
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
              background: catColor + "22", color: catColor, letterSpacing: "0.05em",
            }}>
              {item.category?.toUpperCase()}
            </span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{item.title}</div>
          {item.body && <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{item.body}</div>}
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>
            By {item.authorName} · {ts}
          </div>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onPin(item)}
              title={item.pinned ? "Unpin" : "Pin"}
              style={{ fontSize: 14, padding: "4px 8px" }}
            >
              {item.pinned ? "📌" : "📍"}
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onDelete(item.id)}
              style={{ fontSize: 12 }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { AnnouncementCard };

