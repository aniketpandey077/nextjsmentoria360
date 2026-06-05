"use client";
// src/components/public/LandingPage.jsx — v3 with full template showcase

import React, { useState, useCallback, useEffect, useRef } from "react";
import { searchCoachings, getAllTutors } from "../../services/firestoreService";
import Image from "next/image";

/* ─── Static data ───────────────────────────────────────────── */
const PROOF_NAMES = [
  "Apex IIT Academy", "Catalyst Science", "Bright Minds Delhi",
  "Scholars Hub Mumbai", "Vidya Mandir Pune", "Excel Coaching Jaipur",
];

const FEATURES = [
  { icon: "👥", title: "Student Management", desc: "Enroll students, approve join requests, and keep profiles organized.", color: "#cca43b" },
  { icon: "💰", title: "Fee Tracking", desc: "Track payments, dues, and receipts. See who has paid and who needs a reminder.", color: "#22c55e" },
  { icon: "📅", title: "Classes & Attendance", desc: "Schedule classes, mark attendance, and monitor participation across batches.", color: "#b38f2e" },
  { icon: "📝", title: "Tests & Homework", desc: "Create tests, assign homework, and track student performance over time.", color: "#ef4444" },
  { icon: "📢", title: "Announcements", desc: "Send important updates to all students or specific batches instantly.", color: "#f4f6f0" },
  { icon: "🏆", title: "Workshops", desc: "Organize special events, seminars, and workshops for your students.", color: "#06b6d4" },
];

/* ── All template screens ──────────────────────────────────── */
const TEMPLATES = [
  {
    id: "admin-dashboard",
    label: "Admin Dashboard",
    emoji: "📊",
    role: "Admin",
    roleColor: "#cca43b",
    path: "/admin/dashboard",
    image: "/admin-dashboard.png",
    title: "Your institute at a glance",
    desc: "See students, revenue, pending dues, join requests, and fee status — all on one screen.",
    tags: ["Dashboard", "Stats", "Overview"],
  },
  {
    id: "students",
    label: "Students",
    emoji: "👥",
    role: "Admin",
    roleColor: "#cca43b",
    path: "/admin/students",
    image: "/preview-students.png",
    title: "Manage every student",
    desc: "Search, filter, view profiles, and manage approval status for all your enrolled students.",
    tags: ["Student List", "Profiles", "Search"],
  },
  {
    id: "fees",
    label: "Fee Tracking",
    emoji: "💰",
    role: "Admin",
    roleColor: "#22c55e",
    path: "/admin/fees",
    image: "/preview-fees.png",
    title: "Never miss a payment",
    desc: "Track every rupee — who paid, how much, what's pending. Record payments with one click.",
    tags: ["Fees", "Payments", "Dues"],
  },
  {
    id: "attendance",
    label: "Attendance",
    emoji: "✅",
    role: "Admin",
    roleColor: "#b38f2e",
    path: "/admin/attendance",
    image: "/preview-attendance.png",
    title: "Mark attendance in seconds",
    desc: "Select Present, Absent, or Late for each student. Track patterns across classes and batches.",
    tags: ["Attendance", "Classes", "Reports"],
  },
  {
    id: "student-dash",
    label: "Student Portal",
    emoji: "🎓",
    role: "Student",
    roleColor: "#f4f6f0",
    path: "/student/dashboard",
    image: "/student-dashboard.png",
    title: "Students love their portal",
    desc: "A clean personal dashboard with classes, fees, announcements, and institute contact — all in one.",
    tags: ["Student View", "Dashboard", "Personal"],
  },
  {
    id: "tests",
    label: "Tests & Scores",
    emoji: "📝",
    role: "Student",
    roleColor: "#ef4444",
    path: "/student/tests",
    image: "/preview-tests.png",
    title: "Track every test score",
    desc: "Students see all their test results, marks, percentages and progress at a glance.",
    tags: ["Tests", "Scores", "Performance"],
  },
];

/* Value props */
const VALUE_PROPS = [
  { icon: "🚀", title: "Live in 10 minutes", desc: "Register, set up batches, invite students — most institutes are fully live in under 10 minutes." },
  { icon: "🆓", title: "Free to start", desc: "No credit card, no setup fee. Start managing your institute for free and upgrade when you're ready." },
  { icon: "📱", title: "Works on all devices", desc: "Full mobile experience for admins, tutors and students. Optimized for phones and tablets." },
  { icon: "🔒", title: "Secure & reliable", desc: "Built on Firebase with real-time data sync. Your institute's data is safe and always available." },
];

/* ─── Main LandingPage ──────────────────────────────────────── */
export default function LandingPage({ onShowAuth, preSelectCoaching }) {
  const [view, setView] = useState("home");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [searching, setSearching] = useState(false);
  const [exploreMode, setExploreMode] = useState("coaching");
  const [activeTemplate, setActiveTemplate] = useState(0);
  const exploreLoaded = useRef(false);
  const scrollRef = useRef(null);

  const loadExploreData = useCallback(() => {
    if (exploreLoaded.current) return;
    exploreLoaded.current = true;
    searchCoachings("").then((r) => setFeatured(r.slice(0, 12))).catch(() => {});
    getAllTutors().then((r) => setTutors(r)).catch(() => {});
  }, []);

  const handleSearch = useCallback(async (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try { setResults(await searchCoachings(q)); }
    catch { setResults([]); }
    finally { setSearching(false); }
  }, []);

  const openExplore = () => {
    loadExploreData();
    setView("explore");
    setQuery("");
    setResults([]);
  };

  const tutorList = query.trim()
    ? tutors.filter((t) => [t.name, t.subject, t.city, t.teachesWhom].some((f) => (f || "").toLowerCase().includes(query.toLowerCase())))
    : tutors;

  /* ── Explore view ──────────────────────────────────────────── */
  if (view === "explore") {
    const list = exploreMode === "coaching" ? (query ? results : featured) : tutorList;
    return (
      <div className="lp-page lp-explore-wrap fade-in">
        <header className="lp-explore-header">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setView("home")}>Back</button>
          <span className="lp-logo"><span className="lp-logo-mark">M</span>Mentoria360</span>
          <div className="tab-bar" style={{ margin: 0, flex: "0 0 auto" }}>
            <button type="button" className={`tab${exploreMode === "coaching" ? " active" : ""}`} style={{ flex: "0 0 auto", padding: "6px 12px" }} onClick={() => { setExploreMode("coaching"); setQuery(""); setResults([]); }}>Coachings</button>
            <button type="button" className={`tab${exploreMode === "tutor" ? " active" : ""}`} style={{ flex: "0 0 auto", padding: "6px 12px" }} onClick={() => { setExploreMode("tutor"); setQuery(""); setResults([]); }}>Tutors</button>
          </div>
          <div className="search-wrap" style={{ flex: 1, maxWidth: 360, minWidth: 140 }}>
            <span className="search-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg></span>
            <input value={query} onChange={(e) => handleSearch(e.target.value)} placeholder={exploreMode === "tutor" ? "Search tutors..." : "Search institutes..."} />
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onShowAuth("login")}>Sign In</button>
        </header>
        <div className="lp-container" style={{ paddingTop: 32, paddingBottom: 16 }}>
          <h2>{exploreMode === "tutor" ? query ? `Tutors for "${query}"` : "Discover tutors" : query ? `Results for "${query}"` : "Discover coaching institutes"}</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: "0.875rem" }}>
            {exploreMode === "tutor" ? `${tutorList.length} tutor${tutorList.length !== 1 ? "s" : ""}` : `${list.length} institute${list.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="lp-explore-grid">
          {exploreMode === "coaching" && searching && (<p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--text-secondary)" }}>Searching...</p>)}
          {exploreMode === "coaching" && !searching && list.length === 0 && (<div className="empty-state" style={{ gridColumn: "1/-1" }}><p>{query ? "No institutes found" : "No institutes yet"}</p><button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onShowAuth("register-admin")}>Register your coaching</button></div>)}
          {exploreMode === "coaching" && !searching && list.map((c) => (<CoachingCard key={c.id} coaching={c} onJoin={() => { if (preSelectCoaching) preSelectCoaching(c); else onShowAuth("register"); }} />))}
          {exploreMode === "tutor" && tutorList.length === 0 && (<div className="empty-state" style={{ gridColumn: "1/-1" }}><p>{query ? "No tutors found" : "No tutors yet"}</p><button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onShowAuth("register-tutor")}>Register as tutor</button></div>)}
          {exploreMode === "tutor" && tutorList.map((t) => (<TutorCard key={t.id} tutor={t} onContact={() => onShowAuth("login")} />))}
        </div>
      </div>
    );
  }

  const tpl = TEMPLATES[activeTemplate];

  /* ── Home page ─────────────────────────────────────────────── */
  return (
    <div className="lp-page fade-in">

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <a href="#" className="lp-logo">
            <span className="lp-logo-mark">M</span>
            Mentoria360
          </a>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" className="btn btn-secondary btn-sm hide-mobile" onClick={openExplore}>Browse Institutes</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onShowAuth("login")}>Sign In</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onShowAuth("register")}>Get Started Free</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero-new">
        <div className="lp-hero-glow" aria-hidden />
        <div className="lp-container">
          <div className="lp-hero-badge">
            <span className="lp-badge-dot" />
            The all-in-one platform for coaching institutes
          </div>
          <h1 className="lp-hero-heading">
            Run your coaching institute<br />
            <span className="lp-hero-gradient">smarter, not harder</span>
          </h1>
          <p className="lp-hero-sub">
            Students, fees, attendance, tests, and announcements — manage your entire institute
            from a single professional dashboard built for coaching centers across India.
          </p>
          <div className="lp-hero-actions">
            <button type="button" className="btn btn-primary lp-cta-btn" onClick={() => onShowAuth("register")}>
              Start for Free →
            </button>
            <button type="button" className="btn btn-secondary lp-cta-btn" onClick={openExplore}>
              Browse Institutes
            </button>
          </div>
          <div className="lp-proof-strip">
            {PROOF_NAMES.map((name) => (
              <span key={name} className="lp-proof-pill">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value Props ── */}
      <section className="lp-value-section">
        <div className="lp-container">
          <div className="lp-value-grid">
            {VALUE_PROPS.map((v) => (
              <div key={v.title} className="lp-value-item">
                <div className="lp-value-icon">{v.icon}</div>
                <div>
                  <div className="lp-value-title">{v.title}</div>
                  <div className="lp-value-desc">{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEMPLATE SHOWCASE ── */}
      <section className="lp-section lp-templates-section" id="preview">
        <div className="lp-container">
          <p className="lp-eyebrow">Every screen, before you sign up</p>
          <h2 className="lp-section-heading">
            See the whole app — <span className="lp-text-accent">nothing hidden</span>
          </h2>
          <p className="lp-section-sub">
            Browse through every major screen. What you see here is exactly what admins and students use every day.
          </p>

          {/* Tab strip — scrollable */}
          <div className="tpl-tab-strip" ref={scrollRef}>
            {TEMPLATES.map((t, i) => (
              <button
                key={t.id}
                type="button"
                className={`tpl-tab ${activeTemplate === i ? "tpl-tab-active" : ""}`}
                onClick={() => setActiveTemplate(i)}
                style={activeTemplate === i ? { "--tpl-color": t.roleColor } : {}}
              >
                <span className="tpl-tab-emoji">{t.emoji}</span>
                <span className="tpl-tab-label">{t.label}</span>
                <span
                  className="tpl-tab-role"
                  style={{ color: t.roleColor, background: `${t.roleColor}18` }}
                >
                  {t.role}
                </span>
              </button>
            ))}
          </div>

          {/* Main preview area */}
          <div className="tpl-preview-layout">
            {/* Left: info panel */}
            <div className="tpl-info-panel">
              <div
                className="tpl-role-chip"
                style={{ color: tpl.roleColor, background: `${tpl.roleColor}18`, borderColor: `${tpl.roleColor}30` }}
              >
                {tpl.emoji} {tpl.role} View
              </div>
              <h3 className="tpl-info-title">{tpl.title}</h3>
              <p className="tpl-info-desc">{tpl.desc}</p>
              <div className="tpl-tags">
                {tpl.tags.map(tag => (
                  <span key={tag} className="tpl-tag">{tag}</span>
                ))}
              </div>
              <div className="tpl-path-row">
                <span className="tpl-path-icon">🔗</span>
                <code className="tpl-path">mentoria360.com{tpl.path}</code>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: 24, width: "100%" }}
                onClick={() => onShowAuth("register")}
              >
                Get Access Free →
              </button>
              {/* Prev/Next navigation */}
              <div className="tpl-nav-arrows">
                <button
                  type="button"
                  className="tpl-arrow-btn"
                  disabled={activeTemplate === 0}
                  onClick={() => setActiveTemplate(i => Math.max(0, i - 1))}
                >
                  ← Prev
                </button>
                <span className="tpl-counter">{activeTemplate + 1} / {TEMPLATES.length}</span>
                <button
                  type="button"
                  className="tpl-arrow-btn"
                  disabled={activeTemplate === TEMPLATES.length - 1}
                  onClick={() => setActiveTemplate(i => Math.min(TEMPLATES.length - 1, i + 1))}
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Right: screenshot */}
            <div className="tpl-screen-panel">
              <div className="lp-screenshot-frame" key={tpl.id} style={{ animation: "fadeIn 0.2s ease-out" }}>
                <div className="lp-screenshot-chrome">
                  <div className="dp-dots"><span /><span /><span /></div>
                  <div className="dp-url-bar">mentoria360.com{tpl.path}</div>
                </div>
                <div className="lp-screenshot-img-wrap">
                  <Image
                    src={tpl.image}
                    alt={tpl.label}
                    width={1200}
                    height={750}
                    style={{ width: "100%", height: "auto", display: "block" }}
                    priority={activeTemplate === 0}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnail dots */}
          <div className="tpl-dots">
            {TEMPLATES.map((t, i) => (
              <button
                key={t.id}
                type="button"
                className={`tpl-dot ${activeTemplate === i ? "tpl-dot-active" : ""}`}
                onClick={() => setActiveTemplate(i)}
                style={activeTemplate === i ? { background: t.roleColor } : {}}
                title={t.label}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Who is it for ── */}
      <section className="lp-section lp-roles-section" id="who">
        <div className="lp-container">
          <p className="lp-eyebrow">Who uses Mentoria360?</p>
          <h2 className="lp-section-heading">Built for everyone in your institute</h2>
          <div className="lp-roles-grid">
            <div className="lp-role-card lp-role-admin">
              <div className="lp-role-icon">🏫</div>
              <h3>Coaching Admin</h3>
              <p>Manage students, approve requests, track fees, schedule classes, and get a bird's-eye view of your institute.</p>
              <ul className="lp-role-list">
                <li>✓ Student join request approval</li>
                <li>✓ Fee & payment tracking</li>
                <li>✓ Batch & class management</li>
                <li>✓ Announcements & materials</li>
              </ul>
              <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onShowAuth("register-admin")}>
                Register your institute →
              </button>
            </div>
            <div className="lp-role-card lp-role-student">
              <div className="lp-role-icon">🎓</div>
              <h3>Student</h3>
              <p>Find your coaching, track your classes, view fee history, download materials, and stay updated with announcements.</p>
              <ul className="lp-role-list">
                <li>✓ Find & join coachings</li>
                <li>✓ View class schedule</li>
                <li>✓ Fee history & receipts</li>
                <li>✓ Tests & homework tracking</li>
              </ul>
              <button type="button" className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => onShowAuth("register")}>
                Join as student →
              </button>
            </div>
            <div className="lp-role-card lp-role-tutor">
              <div className="lp-role-icon">👨‍🏫</div>
              <h3>Tutor</h3>
              <p>List yourself as a tutor, set your subjects and rates, and let students find and contact you directly.</p>
              <ul className="lp-role-list">
                <li>✓ Public tutor profile</li>
                <li>✓ Subject & city listing</li>
                <li>✓ Student enquiries</li>
                <li>✓ Hourly rate display</li>
              </ul>
              <button type="button" className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => onShowAuth("register-tutor")}>
                List as tutor →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="lp-section" id="features">
        <div className="lp-container">
          <p className="lp-eyebrow">Features</p>
          <h2 className="lp-section-heading">Everything you need, nothing you don't</h2>
          <p className="lp-section-sub">Core tools for daily operations — no clutter, no distractions.</p>
          <div className="lp-features-new">
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-feature-card-new">
                <div className="lp-feat-icon" style={{ background: `${f.color}22`, color: f.color }}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-section" id="how-it-works">
        <div className="lp-container">
          <p className="lp-eyebrow">Setup in minutes</p>
          <h2 className="lp-section-heading">Get started in 3 simple steps</h2>
          <div className="lp-steps">
            {[
              { step: "01", title: "Register your institute", desc: "Create your free account and set up your coaching profile with subjects, location, and details." },
              { step: "02", title: "Invite or approve students", desc: "Share your institute link or browse the Explore page. Approve student join requests in one click." },
              { step: "03", title: "Manage everything from one place", desc: "Track fees, schedule classes, mark attendance, assign homework — all from your dashboard." },
            ].map((s) => (
              <div key={s.step} className="lp-step">
                <div className="lp-step-num">{s.step}</div>
                <div>
                  <h3 className="lp-step-title">{s.title}</h3>
                  <p className="lp-step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button type="button" className="btn btn-secondary" onClick={openExplore}>Browse existing institutes →</button>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta-section-new">
        <div className="lp-cta-glow" aria-hidden />
        <div className="lp-container" style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "2rem", marginBottom: 12 }}>Ready to simplify your institute?</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
            Start for free today — no credit card required. Most admins are live in under 10 minutes.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary lp-cta-btn" onClick={() => onShowAuth("register")}>Get Started Free →</button>
            <button type="button" className="btn btn-secondary lp-cta-btn" onClick={() => onShowAuth("login")}>Sign In</button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-container" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <div className="lp-logo"><span className="lp-logo-mark">M</span>Mentoria360</div>
          <div style={{ display: "flex", gap: 24, fontSize: "0.8125rem" }}>
            <button type="button" style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8125rem" }} onClick={() => onShowAuth("register-admin")}>For Institutes</button>
            <button type="button" style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8125rem" }} onClick={() => onShowAuth("register")}>For Students</button>
            <button type="button" style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8125rem" }} onClick={openExplore}>Browse</button>
          </div>
          <span style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>© {new Date().getFullYear()} Mentoria360.</span>
        </div>
      </footer>
    </div>
  );
}

/* ── Explore cards ───────────────────────────────────────────── */
function CoachingCard({ coaching: c, onJoin }) {
  const initials = (c.name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const subjects = c.subject ? c.subject.split(/[,/]/).slice(0, 3) : [];
  return (
    <div className="lp-list-card">
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div className="avatar" style={{ width: 40, height: 40 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{c.name}</div>
          {c.city && <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 4 }}>{c.city}{c.state ? `, ${c.state}` : ""}</div>}
        </div>
      </div>
      {subjects.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{subjects.map((s, i) => <span key={i} className="chip">{s.trim()}</span>)}</div>}
      <button type="button" className="btn btn-secondary btn-full" onClick={onJoin}>Join this coaching</button>
    </div>
  );
}

function TutorCard({ tutor: t, onContact }) {
  const initials = (t.name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const subjects = t.subject ? t.subject.split(",").map((x) => x.trim()).slice(0, 3) : [];
  return (
    <div className="lp-list-card">
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div className="avatar" style={{ width: 40, height: 40 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{t.name}</div>
          {t.city && <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 4 }}>{t.city}</div>}
        </div>
      </div>
      {subjects.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{subjects.map((s, i) => <span key={i} className="chip">{s}</span>)}</div>}
      {t.hourlyRate > 0 && <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>₹{t.hourlyRate}/hr</div>}
      <button type="button" className="btn btn-secondary btn-full" onClick={onContact}>Contact tutor</button>
    </div>
  );
}
