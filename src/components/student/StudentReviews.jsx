"use client";
// src/components/student/StudentReviews.jsx
// ============================================================
// Student can write reviews for their enrolled coachings.
// Shows submitted reviews and allows new submissions.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  addCoachingReview,
  getCoachingReviews,
  getStudentCoachings,
} from "../../services/firestoreService";
import toast from "react-hot-toast";

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating" style={{ gap: 4 }}>
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          className={`star ${i <= (hover || value) ? "filled" : "empty"}`}
          style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer", padding: "0 2px" }}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
        >
          ★
        </button>
      ))}
      <span style={{ fontSize: 12, color: "var(--text3)", marginLeft: 8 }}>
        {value === 0 ? "Select rating" : `${value} / 5`}
      </span>
    </div>
  );
}

export default function StudentReviews() {
  const { profile } = useAuth();
  const [coachings, setCoachings]     = useState([]);
  const [selected,  setSelected]      = useState(null);
  const [reviews,   setReviews]       = useState([]);
  const [loading,   setLoading]       = useState(true);
  const [reviewsLoading, setRL]       = useState(false);
  const [rating,    setRating]        = useState(0);
  const [text,      setText]          = useState("");
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const coached = await getStudentCoachings(profile);
        setCoachings(coached);
        if (coached.length > 0) setSelected(coached[0]);
      } catch {} finally { setLoading(false); }
    })();
  }, [profile]);

  useEffect(() => {
    if (!selected) return;
    setRL(true);
    getCoachingReviews(selected.id)
      .then(r => setReviews(r))
      .catch(() => {})
      .finally(() => setRL(false));
  }, [selected]);

  const alreadyReviewed = reviews.some(r => r.studentId === profile?.uid);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Please select a rating."); return; }
    if (!text.trim()) { toast.error("Please write a review."); return; }
    setSubmitting(true);
    try {
      await addCoachingReview(selected.id, {
        studentId:   profile.uid,
        studentName: profile.name || "Student",
        rating,
        text: text.trim(),
      });
      toast.success("Review submitted! Thank you.");
      setRating(0); setText("");
      const updated = await getCoachingReviews(selected.id);
      setReviews(updated);
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60 }}><span className="spinner" style={{ width: 30, height: 30 }} /></div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>⭐ Write a Review</h2>
        <p>Share your experience and help other students choose the right institute</p>
      </div>

      {coachings.length === 0 ? (
        <div className="card empty-state">
          <div className="emoji">🏫</div>
          <p>You need to be enrolled in a coaching to write a review</p>
        </div>
      ) : (
        <>
          {/* Coaching selector */}
          {coachings.length > 1 && (
            <div className="tab-bar" style={{ marginBottom: 20 }}>
              {coachings.map(c => (
                <button key={c.id} className={`tab${selected?.id === c.id ? " active" : ""}`} onClick={() => setSelected(c)}>
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="form-grid-2" style={{ gap: 20 }}>
              {/* Write review */}
              <div>
                <div className="card">
                  <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 16, marginBottom: 16 }}>
                    Review: {selected.name}
                  </h3>

                  {alreadyReviewed ? (
                    <div className="alert alert-success">
                      ✅ You have already submitted a review for this institute. Thank you!
                    </div>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">Your Rating</label>
                        <StarPicker value={rating} onChange={setRating} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Your Review</label>
                        <textarea
                          value={text}
                          onChange={e => setText(e.target.value)}
                          placeholder="Share your experience — quality of teaching, facilities, faculty..."
                          rows={5}
                          style={{ resize: "vertical" }}
                        />
                        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{text.length}/500 characters</div>
                      </div>

                      <button
                        className="btn btn-primary btn-full"
                        onClick={handleSubmit}
                        disabled={submitting || rating === 0 || !text.trim()}
                      >
                        {submitting ? <span className="spinner" /> : "Submit Review →"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Existing reviews */}
              <div>
                <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 16, marginBottom: 12 }}>
                  All Reviews ({reviews.length})
                </h3>
                {reviewsLoading ? (
                  <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>
                ) : reviews.length === 0 ? (
                  <div className="card" style={{ textAlign: "center", padding: "30px 20px" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>⭐</div>
                    <p style={{ color: "var(--text2)", fontSize: 13 }}>No reviews yet. Be the first!</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: 500, overflowY: "auto" }}>
                    {reviews.map(r => (
                      <div key={r.id} className="review-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                              {r.studentName?.[0] || "S"}
                            </div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>{r.studentName}</div>
                              {r.studentId === profile?.uid && (
                                <span style={{ fontSize: 10, color: "var(--accent2)" }}>Your review</span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "flex" }}>
                            {[1,2,3,4,5].map(i => (
                              <span key={i} style={{ fontSize: 13, color: i <= r.rating ? "#f59e0b" : "var(--border2)" }}>★</span>
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
            </div>
          )}
        </>
      )}
    </div>
  );
}

