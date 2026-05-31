"use client";
// src/components/student/StudentTests.jsx
// ============================================================
// Student attempts tests with timer.
// Supports: MCQ (auto-scored) + Theory (free-text, manually graded).
// ============================================================

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useStudentCoaching } from "../../contexts/StudentCoachingContext";
import { getTests, submitTestAttempt, getStudentAttempts } from "../../services/firestoreService";
import toast from "react-hot-toast";

export default function StudentTests() {
  const { profile } = useAuth();
  const { activeCoachingId } = useStudentCoaching();
  const [tests,      setTests]      = useState([]);
  const [attempts,   setAttempts]   = useState({});
  const [loading,    setLoading]    = useState(true);
  const [active,     setActive]     = useState(null);
  const [mcqAnswers, setMcqAnswers] = useState({}); // { [qi]: optionIndex }
  const [theoryAnswers, setTheoryAnswers] = useState({}); // { [qi]: "text" }
  const [timeLeft,   setTimeLeft]   = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  const load = async () => {
    try {
      const list = await getTests(activeCoachingId);
      const myAttempts = await getStudentAttempts(activeCoachingId, profile.uid);
      const attMap = {};
      myAttempts.forEach(a => { attMap[a.testId] = a; });
      setTests(list);
      setAttempts(attMap);
    } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => {
    if (!activeCoachingId) { setLoading(false); return; }
    load();
  }, [activeCoachingId]);

  const startTest = (test) => {
    setActive(test);
    setMcqAnswers({});
    setTheoryAnswers({});
    setTimeLeft(test.duration * 60);
  };

  useEffect(() => {
    if (!active) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [active]);

  // Count answered questions (MCQ answered OR theory has text)
  const countAnswered = () => {
    if (!active) return 0;
    let count = 0;
    active.questions.forEach((q, i) => {
      if (q.type === "theory") {
        if (theoryAnswers[i]?.trim()) count++;
      } else {
        if (mcqAnswers[i] !== undefined) count++;
      }
    });
    return count;
  };

  const handleSubmit = async (auto = false) => {
    if (!active) return;
    const answered = countAnswered();
    if (!auto && answered < active.questions.length) {
      if (!window.confirm(`You've answered ${answered}/${active.questions.length} questions. Submit anyway?`)) return;
    }
    setSubmitting(true);
    try {
      // Auto-score only MCQ questions; theory = 0 score (manually graded)
      let correct = 0;
      let totalMCQ = 0;
      active.questions.forEach((q, i) => {
        if (q.type !== "theory") {
          totalMCQ++;
          if (mcqAnswers[i] === q.correct) correct++;
        }
      });
      const score = totalMCQ > 0 ? Math.round((correct / totalMCQ) * 100) : 0;
      const hasTheory = active.questions.some(q => q.type === "theory");

      await submitTestAttempt(activeCoachingId, {
        testId:       active.id,
        testTitle:    active.title,
        studentId:    profile.uid,
        studentName:  profile.name,
        answers:      mcqAnswers,
        theoryAnswers,
        correct,
        totalMCQ,
        total:        active.questions.length,
        score,
        hasTheory,
      });

      setAttempts(prev => ({ ...prev, [active.id]: { score, correct, totalMCQ, total: active.questions.length, hasTheory } }));
      if (hasTheory) {
        toast.success("Test submitted! MCQ score: " + score + "% · Theory answers sent for review.");
      } else {
        toast.success(`Test submitted! Score: ${score}%`);
      }
      setActive(null);
    } catch { toast.error("Submission failed. Please try again."); }
    finally { setSubmitting(false); }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Active test view ────────────────────────────────────
  if (active) {
    const isExpiring = timeLeft < 60;
    const answered = countAnswered();

    return (
      <div className="fade-in">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{active.title}</h2>
            <div style={{ fontSize: 12, color: "var(--text3)" }}>{active.subject} · {active.questions.length} questions</div>
          </div>
          <div style={{
            fontSize: 22, fontWeight: 800, padding: "8px 20px", borderRadius: 10,
            background: isExpiring ? "var(--red)" : "var(--bg2)",
            color:      isExpiring ? "#fff"       : "var(--text)",
            border: "1px solid var(--border)", fontFamily: "monospace",
          }}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress */}
        <div style={{ height: 4, background: "var(--bg3)", borderRadius: 10, marginBottom: 24, overflow: "hidden" }}>
          <div style={{
            height: "100%", background: "var(--accent)", borderRadius: 10,
            width: `${(answered / active.questions.length) * 100}%`,
            transition: "width 0.3s"
          }} />
        </div>

        {/* Questions */}
        {active.questions.map((q, qi) => (
          <div key={qi} className="card" style={{
            marginBottom: 16,
            borderLeft: `3px solid ${
              q.type === "theory"
                ? (theoryAnswers[qi]?.trim() ? "var(--purple, #8b5cf6)" : "var(--border)")
                : (mcqAnswers[qi] !== undefined ? "var(--green)" : "var(--border)")
            }`,
          }}>
            {/* Question header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text3)" }}>Q{qi + 1}.</span>
              <span style={{
                fontSize: 10, padding: "1px 7px", borderRadius: 20, fontWeight: 600,
                background: q.type === "theory" ? "rgba(168,85,247,0.12)" : "rgba(59,130,246,0.1)",
                color: q.type === "theory" ? "#c084fc" : "#60a5fa",
              }}>
                {q.type === "theory" ? "📝 Theory" : "🔘 MCQ"}
              </span>
            </div>

            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, lineHeight: 1.5 }}>
              {q.question}
            </div>

            {/* MCQ options */}
            {q.type !== "theory" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    onClick={() => setMcqAnswers(a => ({ ...a, [qi]: oi }))}
                    style={{
                      padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                      border: `1px solid ${mcqAnswers[qi] === oi ? "var(--accent)" : "var(--border)"}`,
                      background: mcqAnswers[qi] === oi ? "var(--accent-bg)" : "var(--bg3)",
                      transition: "all 0.15s", fontSize: 13,
                      display: "flex", alignItems: "center", gap: 10,
                    }}
                  >
                    <span style={{
                      width: 24, height: 24, borderRadius: "50%",
                      border: `2px solid ${mcqAnswers[qi] === oi ? "var(--accent)" : "var(--border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      background: mcqAnswers[qi] === oi ? "var(--accent)" : "transparent",
                      color: mcqAnswers[qi] === oi ? "#fff" : "var(--text3)", fontSize: 11, fontWeight: 700,
                    }}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span style={{ flex: 1 }}>{opt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Theory text answer */}
            {q.type === "theory" && (
              <div>
                <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>
                  Write your answer below. It will be reviewed by your admin/teacher.
                </p>
                <textarea
                  placeholder="Type your answer here..."
                  value={theoryAnswers[qi] || ""}
                  onChange={e => setTheoryAnswers(a => ({ ...a, [qi]: e.target.value }))}
                  rows={5}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    fontSize: 13, lineHeight: 1.6,
                    resize: "vertical", minHeight: 100,
                    border: theoryAnswers[qi]?.trim() ? "1px solid rgba(168,85,247,0.5)" : "1px solid var(--border)",
                  }}
                />
              </div>
            )}
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleSubmit(false)} disabled={submitting}>
            {submitting ? <span className="spinner" /> : `Submit Test (${answered}/${active.questions.length} answered)`}
          </button>
          <button className="btn btn-secondary" onClick={() => { clearInterval(timerRef.current); setActive(null); }}>
            Exit
          </button>
        </div>
      </div>
    );
  }

  // ── Test list ────────────────────────────────────────────
  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>🧪 Tests &amp; Quizzes</h2>
        <p>Attempt tests and view your scores</p>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

      {!loading && tests.length === 0 && (
        <div className="empty-state">
          <div className="emoji">🧪</div>
          <p>No tests available yet</p>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>Your institute admin will create tests here</span>
        </div>
      )}

      {tests.map(t => {
        const attempted = attempts[t.id];
        const expired = t.dueDate && t.dueDate < new Date().toISOString().slice(0, 10);
        const scoreColor = attempted?.score >= 70 ? "var(--green)" : attempted?.score >= 40 ? "var(--amber)" : "var(--red)";
        const mcqCount    = t.questions?.filter(q => q.type !== "theory").length ?? t.questions?.length ?? 0;
        const theoryCount = t.questions?.filter(q => q.type === "theory").length ?? 0;

        return (
          <div key={t.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600, background: "var(--accent-bg)", color: "var(--accent)" }}>
                    {t.subject?.toUpperCase()}
                  </span>
                  {mcqCount > 0 && (
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "rgba(59,130,246,0.1)", color: "#60a5fa", fontWeight: 600 }}>
                      {mcqCount} MCQ
                    </span>
                  )}
                  {theoryCount > 0 && (
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "rgba(168,85,247,0.1)", color: "#c084fc", fontWeight: 600 }}>
                      {theoryCount} Theory
                    </span>
                  )}
                  {expired && !attempted && <span style={{ fontSize: 10, color: "var(--red)", fontWeight: 600 }}>EXPIRED</span>}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>
                  {t.questions?.length} question{t.questions?.length !== 1 ? "s" : ""} · {t.duration} mins
                  {t.dueDate && ` · Due ${t.dueDate}`}
                </div>
                {attempted && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor }}>{attempted.score}%</span>
                    <span style={{ fontSize: 12, color: "var(--text3)" }}>
                      {attempted.correct}/{attempted.totalMCQ || attempted.total} MCQ correct
                    </span>
                    {attempted.hasTheory && (
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(168,85,247,0.12)", color: "#c084fc" }}>
                        Theory under review
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ flexShrink: 0 }}>
                {attempted ? (
                  <span className={`badge badge-${attempted.score >= 70 ? "approved" : attempted.score >= 40 ? "pending" : "rejected"}`}>
                    {attempted.score >= 70 ? "Passed" : attempted.score >= 40 ? "Average" : "Failed"}
                  </span>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => startTest(t)}
                    disabled={expired}
                  >
                    {expired ? "Expired" : "Start Test →"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

