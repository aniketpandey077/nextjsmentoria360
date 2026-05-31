"use client";
// src/components/student/StudentProfile.jsx
// ============================================================
// Student can view/edit their profile AND manage coachings:
//   - See all enrolled coachings (with leave option)
//   - See pending join requests
//   - Search and send new join requests
// ============================================================

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useStudentCoaching } from "../../contexts/StudentCoachingContext";
import {
  updateUserProfile,
  searchCoachings,
  createJoinRequest,
  getCoaching,
  leaveCoaching,
} from "../../services/firestoreService";
import toast from "react-hot-toast";

// ── Helper: check if student already has a pending request ────
async function checkHasPendingRequest(coachingId, studentId) {
  try {
    const { collection, query, where, getDocs } = await import("firebase/firestore");
    const { db } = await import("../../services/firebase");
    const q = query(
      collection(db, "coachings", coachingId, "joinRequests"),
      where("studentId", "==", studentId)
    );
    const snap = await getDocs(q);
    return snap.docs.some(d => d.data().status === "pending");
  } catch {
    return false;
  }
}

// ── Coaching search & join panel ──────────────────────────────
function JoinCoachingPanel({ profile, onRequestSent }) {
  const [searchQ,          setSearchQ]          = useState("");
  const [results,          setResults]          = useState([]);
  const [searching,        setSearching]        = useState(false);
  const [sending,          setSending]          = useState("");
  const [sentIds,          setSentIds]          = useState([]);
  const enrolledIds = profile?.coachingIds || (profile?.coachingId ? [profile.coachingId] : []);

  const handleSearch = async (val) => {
    setSearchQ(val);
    if (!val.trim()) { setResults([]); return; }
    setSearching(true);
    try { setResults(await searchCoachings(val)); }
    catch { setResults([]); }
    finally { setSearching(false); }
  };

  const handleJoin = async (coaching) => {
    setSending(coaching.id);
    try {
      // Check already has pending request
      const alreadyPending = await checkHasPendingRequest(coaching.id, profile.uid);
      if (alreadyPending) {
        toast("You already have a pending request for this coaching.", { icon: "⏳" });
        setSending("");
        return;
      }
      await createJoinRequest(coaching.id, {
        studentId: profile.uid,
        studentName: profile.name,
        studentEmail: profile.email || "",
      });
      // Add to pendingCoachingIds on student profile
      const existing = profile?.pendingCoachingIds || [];
      if (!existing.includes(coaching.id)) {
        await updateUserProfile(profile.uid, {
          pendingCoachingIds: [...existing, coaching.id],
        });
      }
      setSentIds(ids => [...ids, coaching.id]);
      toast.success(`Join request sent to ${coaching.name}!`);
      onRequestSent();
    } catch (e) {
      toast.error(e.message || "Failed to send request.");
    } finally {
      setSending("");
    }
  };

  const filtered = results.filter(c => !enrolledIds.includes(c.id));

  return (
    <div>
      <div className="search-wrap" style={{ marginBottom: 12 }}>
        <span className="search-icon">🔍</span>
        <input
          placeholder="Search by name, city, or subject..."
          value={searchQ}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {searching && (
        <div style={{ textAlign: "center", padding: 20 }}>
          <span className="spinner" />
        </div>
      )}

      {!searching && searchQ && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 20, color: "var(--text3)", fontSize: 13 }}>
          No institutes found for "{searchQ}"
        </div>
      )}

      {!searching && !searchQ && (
        <div style={{ textAlign: "center", padding: 16, color: "var(--text3)", fontSize: 12 }}>
          Type the name, city, or subject to search institutes
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
        {filtered.map(c => {
          const isSent     = sentIds.includes(c.id);
          const isSending  = sending === c.id;
          return (
            <div key={c.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 14px", background: "var(--bg3)",
              border: "1px solid var(--border)", borderRadius: 10, gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                  📍 {c.city} · 📚 {c.subject || "General"}
                </div>
              </div>
              <button
                className={`btn btn-sm ${isSent ? "btn-secondary" : "btn-primary"}`}
                onClick={() => !isSent && handleJoin(c)}
                disabled={isSending || isSent}
                style={{ flexShrink: 0, whiteSpace: "nowrap" }}
              >
                {isSending ? <span className="spinner" /> : isSent ? "✅ Sent" : "Send Request"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main StudentProfile ───────────────────────────────────────
export default function StudentProfile() {
  const { profile, refreshProfile } = useAuth();
  const { coachings, setCoachings, activeCoachingId, setActiveCoachingId, reloadCoachings } = useStudentCoaching();
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [leaving,  setLeaving]  = useState("");  // coachingId being left
  const [form, setForm] = useState({
    name:   profile?.name   || "",
    phone:  profile?.phone  || "",
    parent: profile?.parent || "",
    goals:  profile?.goals  || "",
    school: profile?.school || "",
  });

  // Pending coaching IDs (requested but not yet approved)
  const pendingIds  = profile?.pendingCoachingIds || [];
  const enrolledIds = profile?.coachingIds || (profile?.coachingId ? [profile.coachingId] : []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile(profile.uid, {
        name:   form.name.trim(),
        phone:  form.phone.trim(),
        parent: form.parent.trim(),
        goals:  form.goals.trim(),
        school: form.school.trim(),
      });
      await refreshProfile();
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLeave = async (coachingId, coachingName) => {
    if (!window.confirm(`Leave ${coachingName}? You'll need to re-apply to rejoin.`)) return;
    setLeaving(coachingId);
    try {
      await leaveCoaching(coachingId, profile.uid);
      await refreshProfile();
      setCoachings(prev => prev.filter(c => c.id !== coachingId));
      if (activeCoachingId === coachingId) {
        const remaining = coachings.filter(c => c.id !== coachingId);
        setActiveCoachingId(remaining[0]?.id || null);
      }
      toast.success(`Left ${coachingName}.`);
    } catch {
      toast.error("Failed to leave coaching.");
    } finally {
      setLeaving("");
    }
  };

  const initials = (profile?.name || "S").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const fields = [
    { key: "name",   label: "Full Name",      placeholder: "Your full name",        icon: "👤" },
    { key: "phone",  label: "Phone Number",   placeholder: "9876543210",            icon: "📱" },
    { key: "parent", label: "Parent's Name",  placeholder: "Parent / Guardian",     icon: "👨‍👩‍👧" },
    { key: "school", label: "School / Board", placeholder: "e.g. CBSE / State",     icon: "🏫" },
    { key: "goals",  label: "Academic Goals", placeholder: "e.g. IIT-JEE 2026...", icon: "🎯" },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>👤 My Profile</h2>
        <p>Your personal information and coaching enrolments</p>
      </div>

      <div style={{ maxWidth: 600 }}>
        {/* ── Avatar card ──────────────────────────────────── */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 800, color: "#fff", flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{profile?.name}</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>{profile?.email}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="badge badge-approved">Student</span>
              <span className="badge badge-approved" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                {enrolledIds.length > 0 ? `${enrolledIds.length} coaching${enrolledIds.length > 1 ? "s" : ""}` : "Independent"}
              </span>
            </div>
          </div>
          {!editing && (
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>✏️ Edit</button>
          )}
        </div>

        {/* ── Personal details ──────────────────────────────── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
            📋 Personal Details
          </div>
          {fields.map(f => (
            <div key={f.key} style={{ padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>
                {f.icon} {f.label}
              </div>
              {editing ? (
                f.key === "goals" ? (
                  <textarea
                    value={form[f.key]} onChange={set(f.key)}
                    placeholder={f.placeholder} rows={2}
                    style={{ width: "100%", resize: "vertical", fontFamily: "inherit", fontSize: 13, padding: "8px 10px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
                  />
                ) : (
                  <input
                    value={form[f.key]} onChange={set(f.key)}
                    placeholder={f.placeholder}
                    style={{ width: "100%", fontSize: 13 }}
                  />
                )
              ) : (
                <div style={{ fontSize: 14, fontWeight: 500, color: profile?.[f.key] ? "var(--text)" : "var(--text3)" }}>
                  {profile?.[f.key] || "— (tap Edit to add)"}
                </div>
              )}
            </div>
          ))}

          {/* Read-only email */}
          <div style={{ padding: "11px 0" }}>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>📧 Email</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text2)" }}>{profile?.email}</div>
          </div>

          {editing && (
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" /> : "Save Changes"}
              </button>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          )}
        </div>

        {/* ── My Coachings ─────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
            🏫 My Coachings
          </div>

          {/* Enrolled */}
          {coachings.length === 0 && pendingIds.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text3)", fontSize: 13 }}>
              You're not enrolled in any coaching yet. Search below to join one.
            </div>
          )}

          {coachings.map(c => (
            <div key={c.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 0", borderBottom: "1px solid var(--border)", gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                  📍 {c.city} {c.subject ? `· 📚 ${c.subject}` : ""}
                </div>
                <span className="badge badge-approved" style={{ fontSize: 10, marginTop: 4, display: "inline-block" }}>
                  ✅ Enrolled
                </span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, color: "var(--red)", border: "1px solid var(--red)", flexShrink: 0 }}
                onClick={() => handleLeave(c.id, c.name)}
                disabled={leaving === c.id}
              >
                {leaving === c.id ? <span className="spinner" /> : "Leave"}
              </button>
            </div>
          ))}

          {/* Pending requests */}
          {pendingIds.filter(id => !enrolledIds.includes(id)).length > 0 && (
            <div style={{ marginTop: coachings.length > 0 ? 12 : 0 }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Pending Requests
              </div>
              {pendingIds.filter(id => !enrolledIds.includes(id)).map(id => (
                <PendingCoachingRow key={id} coachingId={id} />
              ))}
            </div>
          )}
        </div>

        {/* ── Join a New Coaching ──────────────────────────── */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
            ➕ Join a New Coaching
          </div>
          <p style={{ fontSize: 12, color: "var(--text3)", margin: "10px 0 14px" }}>
            Search by name, city, or subject. You can enroll in multiple coachings at once.
          </p>
          <JoinCoachingPanel
            profile={profile}
            onRequestSent={async () => {
              await refreshProfile();
              await reloadCoachings();
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Helper: show name of a pending coaching ───────────────────
function PendingCoachingRow({ coachingId }) {
  const [name, setName] = useState("Loading...");
  useEffect(() => {
    getCoaching(coachingId).then(c => setName(c?.name || coachingId)).catch(() => setName(coachingId));
  }, [coachingId]);
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: "1px solid var(--border)", gap: 12,
    }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: 13 }}>{name}</div>
      </div>
      <span className="badge badge-pending" style={{ fontSize: 10 }}>⏳ Pending</span>
    </div>
  );
}

