"use client";
// src/components/tutor/TutorDashboard.jsx
// ============================================================
// Dashboard for users who have enabled Tutor mode.
// Shows: profile, reviews, payment methods, enable/disable toggle.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  upsertTutorProfile,
  getTutorProfile,
  getTutorReviews,
  getPaymentMethods,
  updateUserProfile,
} from "../../services/firestoreService";
import toast from "react-hot-toast";
import AdminPaymentMethods from "../admin/AdminPaymentMethods";

const SUBJECTS_LIST = ["IIT-JEE", "NEET", "UPSC", "Class 12", "Class 10", "Commerce", "Banking", "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English", "History"];

export default function TutorDashboard() {
  const { profile, refreshProfile } = useAuth();
  const [tutorProfile, setTutorProfile] = useState(null);
  const [reviews, setReviews]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving,  setSaving]            = useState(false);
  const [activeTab, setActiveTab]       = useState("profile");
  const [form, setForm] = useState({
    name: "", bio: "", subject: "", teachesWhom: "", city: "", state: "", yearsExp: "", phone: "", whatsapp: "", hourlyRate: "",
  });

  const load = async () => {
    if (!profile?.uid) return;
    setLoading(true);
    try {
      const [tp, rv] = await Promise.all([
        getTutorProfile(profile.uid),
        getTutorReviews(profile.uid),
      ]);
      if (tp) {
        setTutorProfile(tp);
        setForm({
          name:        tp.name        || profile.name || "",
          bio:         tp.bio         || "",
          subject:     tp.subject     || "",
          teachesWhom: tp.teachesWhom || "",
          city:        tp.city        || "",
          state:       tp.state       || "",
          yearsExp:    tp.yearsExp    || "",
          phone:       tp.phone       || profile.phone || "",
          whatsapp:    tp.whatsapp    || "",
          hourlyRate:  tp.hourlyRate  || "",
        });
      } else {
        setForm(f => ({ ...f, name: profile.name || "" }));
      }
      setReviews(rv);
    } catch {
      toast.error("Failed to load tutor data.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [profile?.uid]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Enter your name."); return; }
    setSaving(true);
    try {
      await upsertTutorProfile(profile.uid, {
        name:        form.name.trim(),
        bio:         form.bio.trim(),
        subject:     form.subject.trim(),
        teachesWhom: form.teachesWhom.trim(),
        city:        form.city.trim(),
        state:       form.state.trim(),
        yearsExp:    form.yearsExp ? Number(form.yearsExp) : 0,
        phone:       form.phone.trim(),
        whatsapp:    form.whatsapp.trim(),
        hourlyRate:  form.hourlyRate ? Number(form.hourlyRate) : 0,
        isTutor:     true,
      });
      await updateUserProfile(profile.uid, { isTutor: true, teachesWhom: form.teachesWhom.trim() });
      toast.success("Tutor profile saved!");
      await load();
    } catch { toast.error("Failed to save."); }
    finally { setSaving(false); }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60 }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <h2>👨‍🏫 Tutor Dashboard</h2>
            <p>Manage your tutor profile visible to students on Mentoria360</p>
          </div>
          {tutorProfile && (
            <span className="badge badge-approved" style={{ marginLeft: "auto" }}>✓ Active on platform</span>
          )}
        </div>
      </div>

      {/* Stats row */}
      {tutorProfile && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <span style={{ fontSize: 22 }}>⭐</span>
            <span className="stat-value" style={{ color: "var(--amber)" }}>{avgRating || "—"}</span>
            <span className="stat-label">Avg Rating</span>
          </div>
          <div className="stat-card">
            <span style={{ fontSize: 22 }}>📝</span>
            <span className="stat-value" style={{ color: "var(--accent2)" }}>{reviews.length}</span>
            <span className="stat-label">Reviews</span>
          </div>
          <div className="stat-card">
            <span style={{ fontSize: 22 }}>📚</span>
            <span className="stat-value" style={{ fontSize: 18, color: "var(--text)" }}>
              {tutorProfile.subject?.split(",")[0] || "—"}
            </span>
            <span className="stat-label">Main Subject</span>
          </div>
          <div className="stat-card">
            <span style={{ fontSize: 22 }}>🕐</span>
            <span className="stat-value" style={{ color: "var(--green)" }}>{tutorProfile.yearsExp || 0}</span>
            <span className="stat-label">Years Exp.</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        {[
          { key: "profile", label: "My Profile" },
          { key: "payments", label: "💳 Payment Methods" },
          { key: "reviews", label: `⭐ Reviews (${reviews.length})` },
        ].map(t => (
          <button key={t.key} className={`tab${activeTab === t.key ? " active" : ""}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ─────────────────────────── */}
      {activeTab === "profile" && (
        <div className="card">
          <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 16, marginBottom: 20 }}>
            Tutor Profile — Visible to Students
          </h3>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input value={form.name} onChange={set("name")} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone / WhatsApp</label>
              <input value={form.phone} onChange={set("phone")} placeholder="9876543210" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bio / About You</label>
            <textarea value={form.bio} onChange={set("bio")} placeholder="Tell students about your teaching style, achievements, approach..." rows={4} style={{ resize: "vertical" }} />
          </div>

          <div className="form-group">
            <label className="form-label">Subjects You Teach (comma separated)</label>
            <input value={form.subject} onChange={set("subject")} placeholder="e.g. Mathematics, Physics, IIT-JEE" />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {SUBJECTS_LIST.map(s => (
                <button key={s} type="button"
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: 11 }}
                  onClick={() => {
                    const parts = form.subject.split(",").map(x => x.trim()).filter(Boolean);
                    if (!parts.includes(s)) setForm(f => ({ ...f, subject: [...parts, s].join(", ") }));
                  }}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Teaches Whom</label>
            <input value={form.teachesWhom} onChange={set("teachesWhom")} placeholder="e.g. Class 10, IIT-JEE aspirants, College Students" />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {["Class 9 & 10","Class 11 & 12","College Students","IIT-JEE","NEET","UPSC","Competitive Exams","Beginners"].map(chip => (
                <button key={chip} type="button"
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: 11 }}
                  onClick={() => {
                    const parts = form.teachesWhom.split(",").map(x => x.trim()).filter(Boolean);
                    if (!parts.includes(chip)) setForm(f => ({ ...f, teachesWhom: [...parts, chip].join(", ") }));
                  }}
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">City</label>
              <input value={form.city} onChange={set("city")} placeholder="Delhi" />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input value={form.state} onChange={set("state")} placeholder="Delhi" />
            </div>
            <div className="form-group">
              <label className="form-label">Years of Experience</label>
              <input type="number" value={form.yearsExp} onChange={set("yearsExp")} placeholder="e.g. 5" min={0} max={50} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hourly Rate (₹, optional)</label>
            <input type="number" value={form.hourlyRate} onChange={set("hourlyRate")} placeholder="e.g. 500" min={0} />
          </div>

          <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
            {saving ? <span className="spinner" /> : "Save & Publish Profile →"}
          </button>

          {!tutorProfile && (
            <p style={{ fontSize: 12, color: "var(--text3)", textAlign: "center", marginTop: 10 }}>
              Your profile will appear in the Tutors section of the landing page after saving.
            </p>
          )}
        </div>
      )}

      {/* ── Payment Tab ─────────────────────────── */}
      {activeTab === "payments" && (
        <AdminPaymentMethods entityType="tutor" />
      )}

      {/* ── Reviews Tab ─────────────────────────── */}
      {activeTab === "reviews" && (
        <div>
          {reviews.length === 0 ? (
            <div className="card empty-state">
              <div className="emoji">⭐</div>
              <p>No reviews yet</p>
              <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>Students who contact you will be able to leave reviews</p>
            </div>
          ) : (
            <div>
              {reviews.map(r => (
                <div key={r.id} className="review-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{r.studentName?.[0] || "S"}</div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{r.studentName}</span>
                    </div>
                    <div style={{ display: "flex" }}>
                      {[1,2,3,4,5].map(i => (
                        <span key={i} style={{ fontSize: 14, color: i <= r.rating ? "#f59e0b" : "var(--border2)" }}>★</span>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>{r.text}</p>
                  {r.createdAt?.seconds && (
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6 }}>
                      {new Date(r.createdAt.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

