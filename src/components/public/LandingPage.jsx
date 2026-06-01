"use client";
// src/components/public/LandingPage.jsx — Professional SaaS landing

import React, { useState, useCallback } from "react";
import { searchCoachings, getAllTutors } from "../../services/firestoreService";

const FEATURES = [
  {
    title: "Student Management",
    desc: "Enroll students, approve join requests, and keep profiles organized in one dashboard.",
  },
  {
    title: "Fee Tracking",
    desc: "Track payments, dues, and receipts. See who has paid and who needs a reminder.",
  },
  {
    title: "Classes & Attendance",
    desc: "Schedule classes, mark attendance, and monitor participation across batches.",
  },
];

const PROOF_NAMES = ["Apex IIT Academy", "Catalyst Science", "Bright Minds Delhi", "Scholars Hub Mumbai"];

function FeatureIcon() {
  return (
    <svg className="lp-feature-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <path d="M5 8h6M8 5v6" />
    </svg>
  );
}

export default function LandingPage({ onShowAuth, preSelectCoaching }) {
  const [view, setView] = useState("home");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [searching, setSearching] = useState(false);
  const [exploreMode, setExploreMode] = useState("coaching");
  const exploreLoaded = React.useRef(false);

  const loadExploreData = useCallback(() => {
    if (exploreLoaded.current) return;
    exploreLoaded.current = true;
    searchCoachings("").then((r) => setFeatured(r.slice(0, 12))).catch(() => {});
    getAllTutors().then((r) => setTutors(r)).catch(() => {});
  }, []);

  const handleSearch = useCallback(async (q) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      setResults(await searchCoachings(q));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const openExplore = () => {
    loadExploreData();
    setView("explore");
    setQuery("");
    setResults([]);
  };

  const tutorList = query.trim()
    ? tutors.filter((t) =>
        [t.name, t.subject, t.city, t.teachesWhom].some((f) =>
          (f || "").toLowerCase().includes(query.toLowerCase())
        )
      )
    : tutors;

  if (view === "explore") {
    const list = exploreMode === "coaching" ? (query ? results : featured) : tutorList;
    return (
      <div className="lp-page lp-explore-wrap fade-in">
        <header className="lp-explore-header">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setView("home")}>
            Back
          </button>
          <span className="lp-logo">
            <span className="lp-logo-mark">M</span>
            Mentoria360
          </span>
          <div className="tab-bar" style={{ margin: 0, flex: "0 0 auto" }}>
            <button
              type="button"
              className={`tab${exploreMode === "coaching" ? " active" : ""}`}
              style={{ flex: "0 0 auto", padding: "6px 12px" }}
              onClick={() => {
                setExploreMode("coaching");
                setQuery("");
                setResults([]);
              }}
            >
              Coachings
            </button>
            <button
              type="button"
              className={`tab${exploreMode === "tutor" ? " active" : ""}`}
              style={{ flex: "0 0 auto", padding: "6px 12px" }}
              onClick={() => {
                setExploreMode("tutor");
                setQuery("");
                setResults([]);
              }}
            >
              Tutors
            </button>
          </div>
          <div className="search-wrap" style={{ flex: 1, maxWidth: 360, minWidth: 140 }}>
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={exploreMode === "tutor" ? "Search tutors..." : "Search institutes..."}
            />
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onShowAuth("login")}>
            Sign In
          </button>
        </header>

        <div className="lp-container" style={{ paddingTop: 32, paddingBottom: 16 }}>
          <h2>
            {exploreMode === "tutor"
              ? query
                ? `Tutors for "${query}"`
                : "Discover tutors"
              : query
                ? `Results for "${query}"`
                : "Discover coaching institutes"}
          </h2>
          <p style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: "0.875rem" }}>
            {exploreMode === "tutor"
              ? `${tutorList.length} tutor${tutorList.length !== 1 ? "s" : ""}`
              : `${list.length} institute${list.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="lp-explore-grid">
          {exploreMode === "coaching" && searching && (
            <p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--text-secondary)" }}>Searching...</p>
          )}
          {exploreMode === "coaching" && !searching && list.length === 0 && (
            <div className="empty-state" style={{ gridColumn: "1/-1" }}>
              <p>{query ? "No institutes found" : "No institutes yet"}</p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => onShowAuth("register-admin")}
              >
                Register your coaching
              </button>
            </div>
          )}
          {exploreMode === "coaching" &&
            !searching &&
            list.map((c) => (
              <CoachingCard
                key={c.id}
                coaching={c}
                onJoin={() => {
                  if (preSelectCoaching) preSelectCoaching(c);
                  else onShowAuth("register");
                }}
              />
            ))}
          {exploreMode === "tutor" && tutorList.length === 0 && (
            <div className="empty-state" style={{ gridColumn: "1/-1" }}>
              <p>{query ? "No tutors found" : "No tutors yet"}</p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => onShowAuth("register-tutor")}
              >
                Register as tutor
              </button>
            </div>
          )}
          {exploreMode === "tutor" &&
            tutorList.map((t) => (
              <TutorCard key={t.id} tutor={t} onContact={() => onShowAuth("login")} />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="lp-page fade-in">
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <a href="#" className="lp-logo">
            <span className="lp-logo-mark">M</span>
            Mentoria360
          </a>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onShowAuth("login")}>
              Sign In
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onShowAuth("register")}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-container">
          <h1>Manage your coaching institute in one place</h1>
          <p className="lp-hero-sub">
            Students, fees, attendance, tests, and announcements — run your institute from a single
            professional dashboard built for coaching centers across India.
          </p>
          <div className="lp-hero-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => onShowAuth("register")}>
              Get Started Free
            </button>
            <a href="#how-it-works" className="lp-link">
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <p className="lp-section-sub" style={{ marginBottom: 16 }}>
            Trusted by coaching institutes across India
          </p>
          <div className="lp-proof-names">
            {PROOF_NAMES.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="features">
        <div className="lp-container">
          <h2 className="lp-section-title">Everything you need to run your institute</h2>
          <p className="lp-section-sub">Core tools for daily operations — no clutter, no distractions.</p>
          <div className="lp-features">
            {FEATURES.map((f) => (
              <article key={f.title} className="lp-feature-card">
                <FeatureIcon />
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="how-it-works">
        <div className="lp-container">
          <h2 className="lp-section-title">How it works</h2>
          <p className="lp-section-sub">
            Register your institute, set up batches, and invite students — most admins are live in under ten minutes.
          </p>
          <button type="button" className="btn btn-secondary" onClick={openExplore}>
            Browse institutes
          </button>
        </div>
      </section>

      <section className="lp-cta-section">
        <div className="lp-container">
          <h2>Ready to simplify your institute?</h2>
          <p>Start for free today — no credit card required.</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={() => onShowAuth("register")}>
            Start for free today
          </button>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span>Mentoria360</span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

function CoachingCard({ coaching: c, onJoin }) {
  const initials = (c.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const subjects = c.subject ? c.subject.split(/[,/]/).slice(0, 3) : [];

  return (
    <div className="lp-list-card">
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div className="avatar" style={{ width: 40, height: 40 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{c.name}</div>
          {c.city && (
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 4 }}>
              {c.city}
              {c.state ? `, ${c.state}` : ""}
            </div>
          )}
        </div>
      </div>
      {subjects.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {subjects.map((s, i) => (
            <span key={i} className="chip">
              {s.trim()}
            </span>
          ))}
        </div>
      )}
      <button type="button" className="btn btn-secondary btn-full" onClick={onJoin}>
        Join this coaching
      </button>
    </div>
  );
}

function TutorCard({ tutor: t, onContact }) {
  const initials = (t.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const subjects = t.subject ? t.subject.split(",").map((x) => x.trim()).slice(0, 3) : [];

  return (
    <div className="lp-list-card">
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div className="avatar" style={{ width: 40, height: 40 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{t.name}</div>
          {t.city && (
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 4 }}>
              {t.city}
            </div>
          )}
        </div>
      </div>
      {subjects.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {subjects.map((s, i) => (
            <span key={i} className="chip">
              {s}
            </span>
          ))}
        </div>
      )}
      {t.hourlyRate > 0 && (
        <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
          ₹{t.hourlyRate}/hr
        </div>
      )}
      <button type="button" className="btn btn-secondary btn-full" onClick={onContact}>
        Contact tutor
      </button>
    </div>
  );
}
