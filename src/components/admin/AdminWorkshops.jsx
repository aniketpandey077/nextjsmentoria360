"use client";
// src/components/admin/AdminWorkshops.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getWorkshops, addWorkshop } from "../../services/firestoreService";
import Modal from "../shared/Modal";
import Icon from "../shared/Icon";
import toast from "react-hot-toast";

export default function AdminWorkshops() {
  const { profile } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [form, setForm]           = useState({ title: "", date: "", time: "", seats: "", fee: "", description: "" });

  const load = async () => {
    const w = await getWorkshops(profile.coachingId);
    setWorkshops(w);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleAdd = async () => {
    if (!form.title || !form.date) { toast.error("Title and date are required."); return; }
    try {
      await addWorkshop(profile.coachingId, {
        title:       form.title,
        date:        form.date,
        time:        form.time,
        seats:       Number(form.seats) || 30,
        fee:         Number(form.fee)   || 0,
        description: form.description,
      });
      toast.success("Workshop added!");
      setForm({ title: "", date: "", time: "", seats: "", fee: "", description: "" });
      setShowAdd(false);
      load();
    } catch { toast.error("Failed to add workshop."); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Workshops</h2>
        <p>Special events and programs</p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={12} /> Add Workshop
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 60 }}><span className="spinner" /></div>}

      {!loading && workshops.length === 0 && (
        <div className="card empty-state"><div className="emoji">🎓</div><p>No workshops yet</p></div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {workshops.map(w => {
          const pct = Math.round(((w.enrolled || 0) / (w.seats || 1)) * 100);
          const full = (w.enrolled || 0) >= (w.seats || 1);
          return (
            <div key={w.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 17, fontFamily: "Syne, sans-serif", marginBottom: 6 }}>{w.title}</h3>
                  {w.description && <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8 }}>{w.description}</p>}
                  <div style={{ fontSize: 13, color: "var(--text2)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span>📅 {w.date}</span>
                    {w.time && <span>⏰ {w.time}</span>}
                    <span>💺 {w.enrolled || 0}/{w.seats} seats</span>
                    <span>{w.fee === 0 ? "🆓 Free" : `💰 ₹${w.fee}`}</span>
                  </div>
                </div>
                <span className={`badge ${full ? "badge-rejected" : "badge-approved"}`}>
                  {full ? "Full" : "Open"}
                </span>
              </div>
              <div className="progress-bar" style={{ marginTop: 14 }}>
                <div className="progress-fill" style={{
                  width: `${pct}%`,
                  background: full ? "var(--red)" : "var(--accent)",
                }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
                {pct}% full · {(w.seats || 0) - (w.enrolled || 0)} seats remaining
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Workshop">
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input placeholder="e.g. JEE Advanced Mock Test" value={form.title} onChange={set("title")} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea rows={2} placeholder="Brief description..." value={form.description} onChange={set("description")} style={{ resize: "vertical" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input type="date" value={form.date} onChange={set("date")} />
          </div>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input placeholder="9:00 AM" value={form.time} onChange={set("time")} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Total Seats</label>
            <input type="number" placeholder="60" value={form.seats} onChange={set("seats")} />
          </div>
          <div className="form-group">
            <label className="form-label">Fee (₹, 0 = free)</label>
            <input type="number" placeholder="200" value={form.fee} onChange={set("fee")} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd}>Add Workshop</button>
          <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

