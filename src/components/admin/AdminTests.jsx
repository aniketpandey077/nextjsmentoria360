"use client";
// src/components/admin/AdminTests.jsx
// ============================================================
// Admin creates tests with two question types:
//   • MCQ  — 4 options, select correct answer
//   • Theory — free-text question; admin sets a model answer;
//              students write their own answer (manually graded)
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { createTest, getTests, deleteTest, getTestAttempts } from "../../services/firestoreService";
import Modal from "../shared/Modal";
import toast from "react-hot-toast";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science", "General"];

const emptyMCQ    = () => ({ type: "mcq",    question: "", options: ["", "", "", ""], correct: 0 });
const emptyTheory = () => ({ type: "theory", question: "", modelAnswer: "" });

export default function AdminTests() {
  const { profile } = useAuth();
  const [tests,    setTests]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [viewTest, setViewTest] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [form,     setForm]     = useState({
    title: "", subject: "Mathematics", duration: 30, dueDate: "",
    questions: [emptyMCQ()],
  });

  const load = async () => {
    try { setTests(await getTests(profile.coachingId)); }
    catch { toast.error("Failed to load tests."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const addMCQ    = () => setForm(f => ({ ...f, questions: [...f.questions, emptyMCQ()] }));
  const addTheory = () => setForm(f => ({ ...f, questions: [...f.questions, emptyTheory()] }));
  const removeQ   = (i) => setForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }));

  const setQ = (i, key, val) => setForm(f => ({
    ...f,
    questions: f.questions.map((q, idx) => idx === i ? { ...q, [key]: val } : q)
  }));
  const setOpt = (qi, oi, val) => setForm(f => ({
    ...f,
    questions: f.questions.map((q, idx) =>
      idx === qi ? { ...q, options: q.options.map((o, i) => i === oi ? val : o) } : q
    )
  }));

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Test title required."); return; }
    for (const q of form.questions) {
      if (!q.question.trim()) { toast.error("All question texts must be filled."); return; }
      if (q.type === "mcq" && q.options.some(o => !o.trim())) {
        toast.error("Fill all 4 options for each MCQ question."); return;
      }
    }
    try {
      await createTest(profile.coachingId, {
        ...form,
        duration: Number(form.duration),
        authorName: profile.name,
      });
      toast.success("Test created!");
      setShowAdd(false);
      setForm({ title: "", subject: "Mathematics", duration: 30, dueDate: "", questions: [emptyMCQ()] });
      load();
    } catch { toast.error("Failed to create test."); }
  };

  const viewAttempts = async (test) => {
    setViewTest(test);
    try {
      const list = await getTestAttempts(profile.coachingId, test.id);
      setAttempts(list);
    } catch { setAttempts([]); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this test?")) return;
    try {
      await deleteTest(profile.coachingId, id);
      setTests(prev => prev.filter(t => t.id !== id));
      toast.success("Deleted.");
    } catch { toast.error("Delete failed."); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>🧪 Tests &amp; Quizzes</h2>
        <p>Create MCQ and Theory tests, track student performance</p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Create Test</button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

      {!loading && tests.length === 0 && (
        <div className="empty-state">
          <div className="emoji">🧪</div>
          <p>No tests created yet</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowAdd(true)}>
            Create First Test
          </button>
        </div>
      )}

      {tests.map(t => {
        const attemptCount = t.attemptCount || 0;
        const expired = t.dueDate && t.dueDate < new Date().toISOString().slice(0, 10);
        const mcqCount    = t.questions?.filter(q => q.type !== "theory").length || t.questions?.length || 0;
        const theoryCount = t.questions?.filter(q => q.type === "theory").length || 0;

        return (
          <div key={t.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600, background: "var(--accent-bg)", color: "var(--accent)" }}>
                    {t.subject?.toUpperCase()}
                  </span>
                  {mcqCount > 0 && (
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(59,130,246,0.1)", color: "#60a5fa", fontWeight: 600 }}>
                      {mcqCount} MCQ
                    </span>
                  )}
                  {theoryCount > 0 && (
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(168,85,247,0.1)", color: "#c084fc", fontWeight: 600 }}>
                      {theoryCount} Theory
                    </span>
                  )}
                  {expired && <span style={{ fontSize: 10, color: "var(--red)", fontWeight: 600 }}>EXPIRED</span>}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>
                  {t.questions?.length} questions · {t.duration} mins
                  {t.dueDate && ` · Due ${t.dueDate}`}
                  {" · "}<span style={{ color: "var(--accent2)" }}>{attemptCount} attempts</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => viewAttempts(t)}>Results</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>Delete</button>
              </div>
            </div>
          </div>
        );
      })}

      {/* ── View Results Modal ──────────────────────────── */}
      {viewTest && (
        <Modal isOpen={!!viewTest} onClose={() => setViewTest(null)} title={`Results: ${viewTest.title}`}>
          {attempts.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}><p>No attempts yet</p></div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13, color: "var(--text2)" }}>
                <span>{attempts.length} student{attempts.length !== 1 ? "s" : ""} attempted</span>
                <span>Avg: {Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length)}%</span>
              </div>
              {attempts.sort((a, b) => (b.score || 0) - (a.score || 0)).map((a, i) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ color: "var(--text3)", fontWeight: 600, minWidth: 20 }}>#{i + 1}</span>
                    <span style={{ fontWeight: 500 }}>{a.studentName}</span>
                    {a.theoryAnswers && Object.keys(a.theoryAnswers).length > 0 && (
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: "rgba(168,85,247,0.15)", color: "#c084fc" }}>
                        has theory
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontWeight: 700, fontSize: 14,
                    color: a.score >= 70 ? "var(--green)" : a.score >= 40 ? "var(--amber)" : "var(--red)"
                  }}>
                    {a.score}%
                  </span>
                </div>
              ))}
            </>
          )}
          <button className="btn btn-secondary" style={{ marginTop: 16, width: "100%" }} onClick={() => setViewTest(null)}>Close</button>
        </Modal>
      )}

      {/* ── Create Test Modal ───────────────────────────── */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Create New Test">
        <div className="form-group">
          <label className="form-label">Test Title *</label>
          <input placeholder="e.g. Chapter 3 Mock Test" value={form.title} onChange={setField("title")} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <select value={form.subject} onChange={setField("subject")}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Duration (mins)</label>
            <input type="number" value={form.duration} onChange={setField("duration")} min={5} max={180} />
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" value={form.dueDate} onChange={setField("dueDate")} />
          </div>
        </div>

        {/* Questions section */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Questions ({form.questions.length})
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={addMCQ} style={{ fontSize: 11 }}>+ MCQ</button>
              <button className="btn btn-secondary btn-sm" onClick={addTheory} style={{ fontSize: 11, borderColor: "rgba(168,85,247,0.5)", color: "#c084fc" }}>+ Theory</button>
            </div>
          </div>

          <div style={{ maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
            {form.questions.map((q, qi) => (
              <div key={qi} style={{
                background: "var(--bg3)", borderRadius: 10, padding: 14, marginBottom: 12,
                border: `1px solid ${q.type === "theory" ? "rgba(168,85,247,0.3)" : "var(--border)"}`,
              }}>
                {/* Question header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)" }}>Q{qi + 1}</span>
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                      background: q.type === "theory" ? "rgba(168,85,247,0.15)" : "rgba(59,130,246,0.1)",
                      color: q.type === "theory" ? "#c084fc" : "#60a5fa",
                    }}>
                      {q.type === "theory" ? "📝 Theory" : "🔘 MCQ"}
                    </span>
                  </div>
                  {form.questions.length > 1 && (
                    <button onClick={() => removeQ(qi)} style={{ fontSize: 11, color: "var(--red)", background: "none", border: "none", cursor: "pointer" }}>✕ Remove</button>
                  )}
                </div>

                {/* Question text */}
                <textarea
                  placeholder="Question text..."
                  value={q.question}
                  onChange={e => setQ(qi, "question", e.target.value)}
                  style={{ width: "100%", marginBottom: 10, fontSize: 13, resize: "vertical", minHeight: 60, boxSizing: "border-box" }}
                  rows={2}
                />

                {/* MCQ options */}
                {q.type === "mcq" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.options.map((opt, oi) => (
                      <div key={oi} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="radio"
                          name={`q${qi}_correct`}
                          checked={q.correct === oi}
                          onChange={() => setQ(qi, "correct", oi)}
                          style={{ accentColor: "var(--green)", flexShrink: 0, width: 16, height: 16, cursor: "pointer" }}
                          title="Mark as correct answer"
                        />
                        <input
                          placeholder={`Option ${oi + 1}`}
                          value={opt}
                          onChange={e => setOpt(qi, oi, e.target.value)}
                          style={{ flex: 1, fontSize: 12, boxSizing: "border-box" }}
                        />
                        {q.correct === oi && (
                          <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 700, whiteSpace: "nowrap" }}>✓ Correct</span>
                        )}
                      </div>
                    ))}
                    <p style={{ fontSize: 10, color: "var(--text3)", margin: "4px 0 0" }}>
                      Click the radio button to mark the correct answer.
                    </p>
                  </div>
                )}

                {/* Theory answer */}
                {q.type === "theory" && (
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text3)", display: "block", marginBottom: 4 }}>
                      Model Answer (for your reference — shown after grading)
                    </label>
                    <textarea
                      placeholder="Write expected answer or key points..."
                      value={q.modelAnswer}
                      onChange={e => setQ(qi, "modelAnswer", e.target.value)}
                      style={{ width: "100%", fontSize: 12, resize: "vertical", minHeight: 70, boxSizing: "border-box", borderColor: "rgba(168,85,247,0.35)" }}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate}>Create Test</button>
          <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

