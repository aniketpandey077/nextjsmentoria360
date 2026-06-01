"use client";
// src/components/shared/OnboardingTour.jsx
// ============================================================
// First-time user onboarding tour — shown once after login.
// Stored in localStorage: m360_onboarded_<uid>
// Skippable. Role-specific slides.
// ============================================================

import React, { useState, useEffect } from "react";

const STEPS = {
  admin: [
    {
      icon: "🏫",
      title: "Welcome, Admin!",
      desc: "You manage your coaching institute here. Let's walk you through the key sections.",
      hint: "",
    },
    {
      icon: "👥",
      title: "Students",
      desc: "View all enrolled students. Approve join requests from the Requests section.",
      hint: "Sidebar → Students",
    },
    {
      icon: "📦",
      title: "Batches",
      desc: "Group students into batches by schedule or level (e.g. Morning Batch, IIT-JEE 2026).",
      hint: "Sidebar → Batches",
    },
    {
      icon: "Other",
      title: "Fees",
      desc: "Add fee records for one or all students at once, track paid/due amounts, and generate receipts.",
      hint: "Sidebar → Fees",
    },
    {
      icon: "🧪",
      title: "Tests",
      desc: "Create MCQ and Theory tests. Students can attempt them and you see results in real time.",
      hint: "Sidebar → Tests",
    },
    {
      icon: "UPI",
      title: "Payment Methods",
      desc: "Add your UPI, bank account, or QR code so students know how to pay fees.",
      hint: "Sidebar → Payments",
    },
    {
      icon: "🎉",
      title: "You're all set!",
      desc: "Explore the sidebar to discover Attendance, Homework, Announcements, Materials, and more.",
      hint: "",
    },
  ],
  tutor: [
    {
      icon: "👨‍🏫",
      title: "Welcome, Tutor!",
      desc: "Set up your tutor profile so students can discover you on Mentoria360.",
      hint: "",
    },
    {
      icon: "✍️",
      title: "Your Profile",
      desc: "Fill in your subjects, who you teach (e.g. IIT-JEE, Class 10), bio, and hourly rate.",
      hint: "Dashboard → My Profile",
    },
    {
      icon: "UPI",
      title: "Payment Methods",
      desc: "Add payment details so interested students know how to pay you.",
      hint: "Dashboard → 💳 Payment Methods",
    },
    {
      icon: "⭐",
      title: "Reviews",
      desc: "Students who contact you can leave reviews. Build your reputation!",
      hint: "Dashboard → Reviews",
    },
    {
      icon: "🚀",
      title: "You're live!",
      desc: "Once your profile is saved, you'll appear in the Explore → Tutors section for students to find you.",
      hint: "",
    },
  ],
  student: [
    {
      icon: "🎓",
      title: "Welcome, Student!",
      desc: "Here's a quick tour of what you can do on Mentoria360.",
      hint: "",
    },
    {
      icon: "🏠",
      title: "Dashboard",
      desc: "See your upcoming classes, attendance summary, pending fees and recent announcements at a glance.",
      hint: "Sidebar → Home",
    },
    {
      icon: "Other",
      title: "Fees",
      desc: "View your fee records, check what's due, and see payment instructions from your coaching.",
      hint: "Sidebar → Fees",
    },
    {
      icon: "🧪",
      title: "Tests",
      desc: "Attempt MCQ and Theory tests set by your coaching. Your scores appear here after submission.",
      hint: "Sidebar → Tests",
    },
    {
      icon: "👤",
      title: "Profile",
      desc: "Join a new coaching, switch between coachings, or update your personal info.",
      hint: "Sidebar → Profile",
    },
    {
      icon: "🎉",
      title: "All done!",
      desc: "Explore the sidebar for Attendance, Materials, Homework, Workshops, and more!",
      hint: "",
    },
  ],
};

export default function OnboardingTour({ role, uid, onDone }) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const steps = STEPS[role] || STEPS.student;
  const cur   = steps[step];
  const isLast = step === steps.length - 1;

  const close = () => {
    if (uid) localStorage.setItem(`m360_onboarded_${uid}`, "1");
    setExiting(true);
    setTimeout(() => onDone(), 350);
  };

  const next = () => {
    if (isLast) { close(); return; }
    setStep(s => s + 1);
  };
  const back = () => setStep(s => Math.max(0, s - 1));

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft" && step > 0) back();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(4,2,20,0.82)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
      opacity: exiting ? 0 : 1,
      transition: "opacity 0.35s ease",
    }}>
      <div style={{
        width: "100%", maxWidth: 440,
        background: "rgba(10,8,28,0.98)",
        border: "1px solid rgba(139,130,255,0.35)",
        borderRadius: 24,
        boxShadow: "0 0 80px rgba(108,50,255,0.25), 0 0 0 1px rgba(139,130,255,0.1)",
        padding: "36px 36px 28px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative glow */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 180, height: 180, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(108,50,255,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Skip button */}
        <button
          onClick={close}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none",
            color: "var(--text3)", fontSize: 11, cursor: "pointer",
            padding: "4px 8px", borderRadius: 6,
            letterSpacing: "0.04em",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text2)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}
        >
          Skip Tour ✕
        </button>

        {/* Slide content */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            fontSize: 54, marginBottom: 16,
            filter: "drop-shadow(0 0 16px rgba(108,50,255,0.5))",
          }}>
            {cur.icon}
          </div>
          <h2 style={{
            fontSize: 22, fontWeight: 800,
            color: "#e8e0ff", marginBottom: 12, lineHeight: 1.25,
          }}>
            {cur.title}
          </h2>
          <p style={{
            fontSize: 14, color: "#9080c8", lineHeight: 1.65,
            marginBottom: cur.hint ? 14 : 0,
          }}>
            {cur.desc}
          </p>
          {cur.hint && (
            <span style={{
              display: "inline-block",
              fontSize: 11, padding: "4px 14px", borderRadius: 20,
              background: "rgba(108,99,255,0.15)",
              border: "1px solid rgba(139,130,255,0.3)",
              color: "#b4a8ff", fontWeight: 600,
              letterSpacing: "0.04em",
            }}>
              {cur.hint}
            </span>
          )}
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
          {steps.map((_, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              style={{
                width: i === step ? 22 : 7,
                height: 7, borderRadius: 4,
                background: i === step ? "var(--accent)" : "rgba(139,130,255,0.25)",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && (
            <button
              onClick={back}
              style={{
                flex: 1, padding: "12px",
                border: "1px solid rgba(139,130,255,0.3)",
                borderRadius: 12, background: "rgba(139,130,255,0.08)",
                color: "#c4b5fd", fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(139,130,255,0.16)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(139,130,255,0.08)"}
            >
              ← Back
            </button>
          )}
          <button
            onClick={next}
            style={{
              flex: 2, padding: "12px",
              border: "none", borderRadius: 12,
              background: isLast
                ? "var(--success)"
                : "var(--accent)",
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: isLast ? "0 4px 20px rgba(34,197,94,0.4)" : "0 4px 20px rgba(108,50,255,0.4)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            {isLast ? "🚀 Let's Go!" : `Next → (${step + 1}/${steps.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

