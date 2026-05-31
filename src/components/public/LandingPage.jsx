"use client";
// src/components/public/LandingPage.jsx
// ============================================================
// Premium Mentoria360 Landing Page
// Ultra-modern dark theme · Three.js · Vanilla Tilt · GSAPane
// Props: onShowAuth(view), preSelectCoaching(coaching)
// ============================================================

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import VanillaTilt from "vanilla-tilt";
import { searchCoachings, getAllTutors } from "../../services/firestoreService";

// ── Session flag ─────────────────────────────────────────────
let _portalDone =
  typeof sessionStorage !== "undefined" &&
  sessionStorage.getItem("m360_intro_done") === "1";

// Three.js and VanillaTilt are bundled via npm — no CDN loading needed.

// ── Data ──────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "⚡",
    title: "Real-Time Attendance Tracking",
    desc: "Mark attendance digitally in seconds from any device. Automated WhatsApp & email alerts sent to students and parents instantly. Full reports, batch-wise summaries, and defaulter lists — all at your fingertips.",
  },
  {
    icon: "💰",
    title: "Complete Fee Management",
    desc: "Generate fee challans, track who has paid and who hasn't, send automated reminders, and issue professional PDF receipts in one click. Supports multiple payment modes and Razorpay online payments.",
  },
  {
    icon: "📚",
    title: "Batch & Class Management",
    desc: "Create unlimited batches with custom subject groups, timings, and assigned tutors. Schedule classes, manage timetables, and detect scheduling conflicts automatically — no spreadsheets needed.",
  },
  {
    icon: "📝",
    title: "Tests & Homework Engine",
    desc: "Create tests with MCQ, theory, fill-in-the-blank, and true/false questions. Share digital homework to specific batches. Auto-grade objective tests and view per-student score analytics.",
  },
  {
    icon: "📊",
    title: "Deep Performance Analytics",
    desc: "A live dashboard showing every student's attendance %, fee status, test scores, and homework completion rate. Spot underperformers early. Compare batch-wise trends and make data-driven decisions.",
  },
  {
    icon: "📣",
    title: "Announcements & Study Materials",
    desc: "Broadcast notices, holiday lists, or urgent updates to specific batches or all students instantly. Share PDFs, notes, and reference material that students can view from their phone anytime.",
  },
  {
    icon: "🔍",
    title: "Student Discovery & Enrollment",
    desc: "Students browse Mentoria360's Explore page to find your institute by name, city, or subject. They send a join request — you approve with one tap. No forms, no phone calls, no paperwork.",
  },
  {
    icon: "👨‍🏫",
    title: "Tutor Profiles & Public Discovery",
    desc: "Tutors create rich public profiles listing their subjects, experience, hourly rate, teaching level (school/college/competitive), and bio. Students discover and connect with the right tutor in minutes.",
  },
  {
    icon: "🔔",
    title: "Multi-Channel Notifications",
    desc: "Never let an important update go unnoticed. Fee due reminders, class cancellations, test schedules — sent via WhatsApp, email, and in-app notifications so everyone stays in the loop.",
  },
];

const STATS = [
  { value: 500,   suffix: "+", label: "Institutes Onboarded", icon: "🏫" },
  { value: 12000, suffix: "+", label: "Active Students",      icon: "🎓" },
  { value: 98,    suffix: "%", label: "Satisfaction Rate",    icon: "⭐" },
  { value: 1500,  suffix: "+", label: "Daily Sessions",       icon: "📅" },
];

const HOW = [
  {
    step: "01",
    title: "Register Free in 5 Minutes",
    desc: "Sign up as a Coaching Admin or as a Tutor. Add your institute name, city, subjects, and you're live. No tech skills, no setup fee.",
  },
  {
    step: "02",
    title: "Set Up Your Batches",
    desc: "Create your batches (e.g. 'Class 10 Maths', 'JEE Dropper'), assign fee amounts, set timetables, and add teaching staff — all from your dashboard.",
  },
  {
    step: "03",
    title: "Students Discover & Join You",
    desc: "Your institute goes live on the Mentoria360 Explore page. Students search by city or subject, find you, and send a join request. You approve instantly.",
  },
  {
    step: "04",
    title: "Run Everything Digitally",
    desc: "Mark attendance, collect fees online, share notes, set tests, post announcements — every operation your institute needs runs from one clean dashboard.",
  },
  {
    step: "05",
    title: "Grow With Insights",
    desc: "Your analytics dashboard shows attendance trends, revenue reports, and student performance. Spot dropout risks early and take action to keep students on track.",
  },
];

const TESTIMONIALS = [
  {
    quote: "Mentoria360 transformed how we run our 800-student institute. Fee collection used to take 2 days every month — now it's automated. Parents get receipts instantly. Attendance alerts go out automatically. It's a complete system.",
    name: "Rajesh Sharma",
    role: "Director, Apex IIT Academy",
    av: "RS",
  },
  {
    quote: "As a private tutor, getting discovered was always hard. After creating my Mentoria360 profile, I got my first inquiry within 3 days. The platform helps both sides — tutors grow their client base, students find the right teacher easily.",
    name: "Priya Menon",
    role: "Independent Math Tutor, Pune",
    av: "PM",
  },
  {
    quote: "The test module is what sold me. I can set MCQ tests for my batches in minutes, auto-grade them, and see which student struggled on which question. No more manual checking. My students love the instant results too.",
    name: "Amit Verma",
    role: "Founder, Catalyst Science Coaching",
    av: "AV",
  },
];

// ── CSS ───────────────────────────────────────────────────────
const CSS = `
  /* Fonts are loaded in index.html — no @import needed here */

  /* ── Reset ── */
  .lp *, .lp *::before, .lp *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lp { font-family: 'DM Sans', sans-serif; background: #080C14; color: #E8EDF5; overflow-x: hidden; min-height: 100vh; }
  .lp a { text-decoration: none; color: inherit; }
  .lp button { cursor: pointer; font-family: inherit; }
  .lp h1,.lp h2,.lp h3,.lp h4 { font-family: 'Cormorant Garamond', serif; }

  /* ── Custom cursor ── */
  .lp-cursor { position: fixed; pointer-events: none; z-index: 9999; width: 40px; height: 40px; border: 1.5px solid rgba(79,142,247,0.6); border-radius: 50%; transform: translate(-50%,-50%); transition: width .3s, height .3s, border-color .3s, background .3s; will-change: left, top; }
  .lp-cursor-dot { position: fixed; pointer-events: none; z-index: 9999; width: 6px; height: 6px; background: #A78BFA; border-radius: 50%; transform: translate(-50%,-50%); box-shadow: 0 0 10px #A78BFA, 0 0 24px rgba(167,139,250,.5); will-change: left, top; }
  .lp-cursor.lp-hover { width: 60px; height: 60px; background: rgba(79,142,247,.08); border-color: rgba(167,139,250,.8); }

  /* ── Grain overlay ── */
  .lp-grain {
    position: fixed; inset: 0; pointer-events: none; z-index: 9000; opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 200px 200px;
    animation: lp-grain-anim 0.15s steps(1) infinite;
  }
  @keyframes lp-grain-anim {
    0%   { transform: translate(0,0);   }
    10%  { transform: translate(-3%,-5%); }
    20%  { transform: translate(5%,3%);  }
    30%  { transform: translate(-3%,5%); }
    40%  { transform: translate(5%,-3%); }
    50%  { transform: translate(-5%,5%); }
    60%  { transform: translate(3%,-5%); }
    70%  { transform: translate(-5%,3%); }
    80%  { transform: translate(3%,5%);  }
    90%  { transform: translate(-3%,3%); }
    100% { transform: translate(5%,-3%); }
  }

  /* ── Reveal animation — 3D cinematic entrance ── */
  [data-reveal] {
    opacity: 0;
    transform: perspective(900px) translateY(70px) rotateX(-10deg) scale(0.94);
    transition: opacity 1s cubic-bezier(.16,1,.3,1), transform 1s cubic-bezier(.16,1,.3,1);
    will-change: opacity, transform;
  }
  [data-reveal].lp-revealed { opacity: 1; transform: perspective(900px) translateY(0) rotateX(0) scale(1); }
  [data-reveal].lp-delay-1 { transition-delay: 0.08s; }
  [data-reveal].lp-delay-2 { transition-delay: 0.16s; }
  [data-reveal].lp-delay-3 { transition-delay: 0.24s; }
  [data-reveal].lp-delay-4 { transition-delay: 0.32s; }
  [data-reveal].lp-delay-5 { transition-delay: 0.40s; }

  /* ── Nav ── */
  .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 0 48px; height: 72px; display: flex; align-items: center; justify-content: space-between; background: rgba(8,12,20,0.7); border-bottom: 1px solid rgba(79,142,247,.1); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
  .lp-logo { display: flex; align-items: center; gap: 10px; font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; letter-spacing: -.3px; }
  .lp-logo-gem { width: 36px; height: 36px; background: linear-gradient(135deg, #4F8EF7, #A78BFA); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #fff; box-shadow: 0 0 20px rgba(79,142,247,.45); }
  .lp-logo-text span { color: #4F8EF7; }
  .lp-nav-links { display: flex; gap: 36px; }
  .lp-nav-link { font-size: 14px; font-weight: 500; color: #8899B0; letter-spacing: .02em; transition: color .2s; position: relative; }
  .lp-nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: #4F8EF7; transition: width .3s; }
  .lp-nav-link:hover { color: #E8EDF5; }
  .lp-nav-link:hover::after { width: 100%; }
  .lp-nav-ctas { display: flex; align-items: center; gap: 12px; }

  /* ── Buttons ── */
  .lp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 600; letter-spacing: .02em; border: none; transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s; }
  .lp-btn:hover { transform: translateY(-2px); }
  .lp-btn-ghost { background: rgba(79,142,247,.1); color: #93BBFF; border: 1px solid rgba(79,142,247,.25); }
  .lp-btn-ghost:hover { background: rgba(79,142,247,.18); box-shadow: 0 8px 24px rgba(79,142,247,.15); }
  .lp-btn-primary { background: linear-gradient(135deg, #4F8EF7, #6A5AE0); color: #fff; box-shadow: 0 4px 20px rgba(79,142,247,.35); }
  .lp-btn-primary:hover { box-shadow: 0 8px 32px rgba(79,142,247,.55); }
  .lp-btn-gold { background: linear-gradient(135deg, #F5C842, #E8A808); color: #0D0A00; font-weight: 700; box-shadow: 0 4px 24px rgba(245,200,66,.35); }
  .lp-btn-gold:hover { box-shadow: 0 8px 36px rgba(245,200,66,.55); }
  .lp-btn-outline { background: transparent; color: #E8EDF5; border: 1px solid rgba(232,237,245,.25); }
  .lp-btn-outline:hover { background: rgba(255,255,255,.06); border-color: rgba(232,237,245,.45); }
  .lp-btn-lg { padding: 16px 32px; font-size: 16px; border-radius: 14px; }
  .lp-btn-xl { padding: 20px 44px; font-size: 18px; border-radius: 16px; font-weight: 700; }

  /* ── Hero ── */
  .lp-hero { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: space-between; padding: 120px 80px 80px; overflow: hidden; gap: 40px; }
  .lp-hero-canvas { position: absolute; top: 0; right: 0; width: 55%; height: 100%; z-index: 0; }
  .lp-hero-glow-1 { position: absolute; top: -20%; left: -10%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(79,142,247,.12) 0%, transparent 70%); pointer-events: none; z-index: 0; animation: lp-breathe 8s ease-in-out infinite; }
  .lp-hero-glow-2 { position: absolute; bottom: -20%; right: 30%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(167,139,250,.08) 0%, transparent 70%); pointer-events: none; z-index: 0; animation: lp-breathe 12s ease-in-out 3s infinite reverse; }
  @keyframes lp-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
  .lp-hero-content { position: relative; z-index: 2; max-width: 620px; }
  .lp-hero-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; background: rgba(79,142,247,.1); border: 1px solid rgba(79,142,247,.3); border-radius: 100px; font-size: 12px; color: #93BBFF; font-weight: 600; letter-spacing: .05em; margin-bottom: 28px; }
  .lp-badge-pulse { width: 7px; height: 7px; background: #4F8EF7; border-radius: 50%; box-shadow: 0 0 0 0 rgba(79,142,247,.6); animation: lp-pulse 2s infinite; }
  @keyframes lp-pulse { 0%{box-shadow:0 0 0 0 rgba(79,142,247,.6)} 70%{box-shadow:0 0 0 8px rgba(79,142,247,0)} 100%{box-shadow:0 0 0 0 rgba(79,142,247,0)} }
  .lp-hero-title { font-size: clamp(52px, 6vw, 82px); font-weight: 600; line-height: 1.08; letter-spacing: -2px; margin-bottom: 24px; }
  .lp-title-line { display: block; }
  .lp-title-gradient { background: linear-gradient(135deg, #4F8EF7 0%, #A78BFA 50%, #F5C842 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .lp-hero-sub { font-size: 18px; line-height: 1.7; color: #7A8FA8; max-width: 480px; margin-bottom: 40px; font-weight: 400; }
  .lp-hero-ctas { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 48px; }
  .lp-hero-proof { display: flex; align-items: center; gap: 14px; }
  .lp-avatars { display: flex; }
  .lp-av { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #080C14; margin-left: -8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; }
  .lp-av:first-child { margin-left: 0; }
  .lp-proof-text { font-size: 13px; color: #5A6E84; }
  .lp-proof-text strong { color: #A78BFA; }
  .lp-scroll-hint { position: absolute; bottom: 36px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 2; }
  .lp-scroll-line { width: 1px; height: 50px; background: linear-gradient(to bottom, transparent, rgba(79,142,247,.6)); animation: lp-scroll-bob 2s ease-in-out infinite; }
  @keyframes lp-scroll-bob { 0%,100%{opacity:.4;transform:scaleY(1)} 50%{opacity:1;transform:scaleY(1.2)} }
  .lp-scroll-text { font-size: 10px; color: #364555; letter-spacing: .12em; text-transform: uppercase; }

  /* ── Stats ── */
  .lp-stats { padding: 80px 80px; background: rgba(79,142,247,.03); border-top: 1px solid rgba(79,142,247,.08); border-bottom: 1px solid rgba(79,142,247,.08); }
  .lp-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; max-width: 1200px; margin: 0 auto; }
  .lp-stat {
    background: rgba(12,18,32,0.85);
    border: 1px solid rgba(79,142,247,.18);
    border-radius: 24px;
    padding: 40px 28px;
    text-align: center;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    transition: transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s ease;
    box-shadow: 0 8px 40px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.07);
  }
  .lp-stat::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(79,142,247,.1) 0%, rgba(167,139,250,.06) 50%, transparent 100%);
    opacity: 0; transition: opacity .4s;
  }
  .lp-stat::after {
    content: '';
    position: absolute;
    top: -60px; left: 50%; transform: translateX(-50%);
    width: 120px; height: 120px;
    background: radial-gradient(circle, rgba(79,142,247,.25) 0%, transparent 70%);
    pointer-events: none;
    opacity: 0; transition: opacity .4s;
  }
  .lp-stat:hover::before { opacity: 1; }
  .lp-stat:hover::after { opacity: 1; }
  .lp-stat:hover {
    transform: translateY(-10px) scale(1.02);
    border-color: rgba(79,142,247,.42);
    box-shadow: 0 32px 80px rgba(79,142,247,.22), 0 0 0 1px rgba(79,142,247,.2), inset 0 1px 0 rgba(255,255,255,.1);
  }
  .lp-stat-ico { font-size: 32px; margin-bottom: 16px; display: block; }
  .lp-stat-val {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(52px, 5vw, 72px);
    font-weight: 700;
    line-height: 1;
    margin-bottom: 10px;
    background: linear-gradient(135deg, #E8EDF5 0%, #93BBFF 45%, #A78BFA 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 20px rgba(79,142,247,.45));
  }
  .lp-stat-label { font-size: 12px; color: #4A6080; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; }

  /* ── Section common ── */
  .lp-section { padding: 120px 80px; max-width: 1400px; margin: 0 auto; }
  .lp-section-full { padding: 120px 0; }
  .lp-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: .15em; color: #4F8EF7; font-weight: 700; margin-bottom: 16px; }
  .lp-section-title { font-size: clamp(36px, 4vw, 58px); font-weight: 600; line-height: 1.1; margin-bottom: 20px; letter-spacing: -1px; }
  .lp-section-sub { font-size: 17px; color: #5A6E84; max-width: 520px; line-height: 1.7; }
  .lp-section-header { margin-bottom: 72px; }

  /* ── Features ── */
  .lp-features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 28px; }
  .lp-feat {
    background: rgba(10,16,28,0.88);
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 24px;
    padding: 40px 36px;
    position: relative;
    overflow: hidden;
    cursor: default;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    transition: transform .45s cubic-bezier(.16,1,.3,1), border-color .45s, box-shadow .45s;
    transform-style: preserve-3d;
    box-shadow: 0 4px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.06);
  }
  .lp-feat-glow {
    position: absolute;
    top: -80px; right: -80px;
    width: 220px; height: 220px;
    background: radial-gradient(circle, rgba(79,142,247,.2) 0%, transparent 70%);
    pointer-events: none;
    transition: opacity .45s, transform .45s;
    opacity: 0;
    transform: scale(0.85);
  }
  .lp-feat::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(79,142,247,.07) 0%, rgba(167,139,250,.04) 50%, transparent 100%);
    opacity: 0;
    transition: opacity .45s;
    pointer-events: none;
  }
  .lp-feat:hover::before { opacity: 1; }
  .lp-feat:hover .lp-feat-glow { opacity: 1; transform: scale(1); }
  .lp-feat:hover {
    border-color: rgba(79,142,247,.35);
    transform: translateY(-12px) scale(1.01);
    box-shadow:
      0 32px 80px rgba(0,0,0,.5),
      0 0 0 1px rgba(79,142,247,.2),
      0 0 60px rgba(79,142,247,.08),
      inset 0 1px 0 rgba(255,255,255,.1);
  }
  .lp-feat-icon {
    font-size: 40px;
    margin-bottom: 24px;
    display: block;
    transition: transform .35s cubic-bezier(.16,1,.3,1);
    filter: drop-shadow(0 4px 12px rgba(79,142,247,.3));
  }
  .lp-feat:hover .lp-feat-icon { transform: scale(1.15) translateY(-3px); }
  .lp-feat-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 23px;
    font-weight: 600;
    margin-bottom: 14px;
    color: #E8EDF5;
    letter-spacing: -.3px;
    transition: color .3s;
  }
  .lp-feat:hover .lp-feat-title { color: #93BBFF; }
  .lp-feat-desc { font-size: 14px; color: #4A6080; line-height: 1.78; }
  .lp-feat-line {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #4F8EF7, #A78BFA, transparent);
    opacity: 0;
    transition: opacity .35s;
    box-shadow: 0 0 12px rgba(79,142,247,.5);
  }
  .lp-feat:hover .lp-feat-line { opacity: 1; }

  /* ── How it works ── */
  .lp-how-bg {
    background: linear-gradient(180deg, rgba(6,10,22,1) 0%, rgba(8,12,20,1) 100%);
    padding: 140px 0;
    border-top: 1px solid rgba(79,142,247,.08);
    border-bottom: 1px solid rgba(79,142,247,.08);
    position: relative;
    overflow: hidden;
  }
  .lp-how-bg::before {
    content: '';
    position: absolute;
    top: 0; left: 50%; transform: translateX(-50%);
    width: 900px; height: 400px;
    background: radial-gradient(ellipse, rgba(79,142,247,.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .lp-how-inner { max-width: 1300px; margin: 0 auto; padding: 0 80px; position: relative; }
  .lp-how-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 20px; position: relative; }
  .lp-how-grid::before {
    content: '';
    position: absolute;
    top: 44px;
    left: calc(10% + 16px); right: calc(10% + 16px);
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(79,142,247,.5), rgba(167,139,250,.5), rgba(79,142,247,.5), transparent);
    box-shadow: 0 0 8px rgba(79,142,247,.3);
  }
  .lp-how-card {
    text-align: center;
    background: rgba(10,16,28,.8);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 20px;
    padding: 32px 20px;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    transition: transform .4s cubic-bezier(.16,1,.3,1), border-color .4s, box-shadow .4s;
    box-shadow: 0 4px 20px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.05);
  }
  .lp-how-card:hover {
    transform: translateY(-10px);
    border-color: rgba(79,142,247,.3);
    box-shadow: 0 24px 60px rgba(0,0,0,.4), 0 0 40px rgba(79,142,247,.1), inset 0 1px 0 rgba(255,255,255,.08);
  }
  .lp-how-step {
    width: 52px; height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4F8EF7, #A78BFA);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px; font-weight: 700; color: #fff;
    margin: 0 auto 20px;
    box-shadow: 0 0 28px rgba(79,142,247,.55), 0 0 60px rgba(79,142,247,.2);
    position: relative; z-index: 1;
    transition: transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s;
  }
  .lp-how-card:hover .lp-how-step {
    transform: scale(1.15);
    box-shadow: 0 0 40px rgba(79,142,247,.75), 0 0 80px rgba(79,142,247,.35);
  }
  .lp-how-title { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; margin-bottom: 10px; color: #E8EDF5; }
  .lp-how-desc { font-size: 13px; color: #445566; line-height: 1.7; }

  /* ── Testimonials ── */
  .lp-testi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 28px; }
  .lp-testi {
    background: rgba(8,14,26,0.92);
    border: 1px solid rgba(167,139,250,.15);
    border-radius: 28px;
    padding: 44px 40px;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    transition: transform .45s cubic-bezier(.16,1,.3,1), border-color .45s, box-shadow .45s;
    box-shadow: 0 8px 40px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.06);
  }
  .lp-testi::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(167,139,250,.08) 0%, transparent 55%);
    pointer-events: none;
  }
  .lp-testi::after {
    content: '“';
    position: absolute;
    top: 20px; right: 28px;
    font-family: 'Cormorant Garamond', serif;
    font-size: 120px;
    line-height: 1;
    color: rgba(167,139,250,.08);
    pointer-events: none;
    font-weight: 700;
  }
  .lp-testi:hover {
    transform: translateY(-14px) scale(1.01);
    border-color: rgba(167,139,250,.35);
    box-shadow:
      0 40px 100px rgba(0,0,0,.55),
      0 0 0 1px rgba(167,139,250,.25),
      0 0 60px rgba(167,139,250,.08),
      inset 0 1px 0 rgba(255,255,255,.08);
  }
  .lp-testi-q { display: none; }
  .lp-stars { color: #F5C842; font-size: 13px; letter-spacing: 3px; margin-bottom: 18px; text-shadow: 0 0 10px rgba(245,200,66,.4); }
  .lp-testi-quote {
    font-size: 15px;
    color: #7A8FA8;
    line-height: 1.85;
    margin-bottom: 32px;
    font-style: italic;
    position: relative; z-index: 1;
  }
  .lp-testi-author { display: flex; align-items: center; gap: 16px; }
  .lp-testi-av {
    width: 48px; height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4F8EF7, #A78BFA);
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700; color: #fff;
    flex-shrink: 0;
    box-shadow: 0 0 20px rgba(79,142,247,.4);
    border: 2px solid rgba(255,255,255,.15);
  }
  .lp-testi-name { font-size: 14px; font-weight: 700; color: #E8EDF5; margin-bottom: 3px; }
  .lp-testi-role { font-size: 12px; color: #3A5060; }

  /* ── CTA banner ── */
  .lp-cta {
    padding: 160px 80px;
    position: relative;
    overflow: hidden;
    text-align: center;
    background: linear-gradient(180deg, rgba(8,12,20,1) 0%, rgba(5,8,16,1) 100%);
  }
  .lp-cta-glow {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    width: 1100px; height: 600px;
    background: radial-gradient(ellipse, rgba(79,142,247,.2) 0%, rgba(167,139,250,.1) 40%, transparent 70%);
    pointer-events: none;
    animation: lp-breathe 9s ease-in-out infinite;
  }
  .lp-cta-border {
    position: absolute;
    inset: 60px 80px;
    border: 1px solid rgba(79,142,247,.18);
    border-radius: 40px;
    pointer-events: none;
    box-shadow: inset 0 0 80px rgba(79,142,247,.04);
  }
  .lp-cta-inner { position: relative; z-index: 1; max-width: 780px; margin: 0 auto; }
  .lp-cta-badge {
    display: inline-block;
    padding: 8px 24px;
    background: rgba(245,200,66,.12);
    border: 1px solid rgba(245,200,66,.35);
    border-radius: 100px;
    font-size: 12px; color: #F5C842;
    font-weight: 700; letter-spacing: .08em;
    margin-bottom: 32px;
    box-shadow: 0 0 20px rgba(245,200,66,.1);
  }
  .lp-cta-title {
    font-size: clamp(44px, 5.5vw, 72px);
    font-weight: 600;
    line-height: 1.08;
    margin-bottom: 24px;
    letter-spacing: -2px;
    background: linear-gradient(135deg, #E8EDF5 30%, #93BBFF 65%, #A78BFA 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .lp-cta-sub { font-size: 18px; color: #4A6080; line-height: 1.75; margin-bottom: 52px; max-width: 580px; margin-left: auto; margin-right: auto; }
  .lp-cta-actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 16px; }

  /* ── Footer ── */
  .lp-footer { background: rgba(4,6,10,1); border-top: 1px solid rgba(255,255,255,.05); padding: 80px 80px 40px; }
  .lp-footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 60px; margin-bottom: 60px; }
  .lp-footer-brand p { font-size: 14px; color: #3A4A5A; line-height: 1.7; margin-top: 16px; max-width: 260px; }
  .lp-footer-col-title { font-size: 11px; text-transform: uppercase; letter-spacing: .12em; color: #4A5A6A; font-weight: 700; margin-bottom: 20px; }
  .lp-footer-col { display: flex; flex-direction: column; gap: 12px; }
  .lp-footer-col a, .lp-footer-col button { font-size: 14px; color: #3A4A5A; background: none; border: none; text-align: left; cursor: pointer; transition: color .2s; padding: 0; }
  .lp-footer-col a:hover, .lp-footer-col button:hover { color: #E8EDF5; }
  .lp-footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 28px; border-top: 1px solid rgba(255,255,255,.04); font-size: 12px; color: #263040; }
  .lp-footer-heart { color: #A78BFA; }

  /* ── Explore view ── */
  .lp-explore-wrap { position: fixed; inset: 0; z-index: 20; display: flex; flex-direction: column; overflow-y: auto; background: rgba(4,6,14,.95); backdrop-filter: blur(4px); }
  .lp-explore-header { position: sticky; top: 0; z-index: 30; background: rgba(6,4,20,.88); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-bottom: 1px solid rgba(139,130,255,.2); padding: 14px 36px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; box-shadow: 0 4px 40px rgba(0,0,0,.5); }
  .lp-explore-back { padding: 8px 16px; border: 1px solid rgba(139,130,255,.35); border-radius: 10px; background: rgba(139,130,255,.1); color: #c4b5fd; font-size: 13px; font-weight: 600; transition: background .2s; }
  .lp-explore-back:hover { background: rgba(139,130,255,.22); }
  .lp-explore-logo { font-family:'Cormorant Garamond',serif; font-weight:700; font-size:20px; background: linear-gradient(90deg,#a78bfa,#e0d8ff); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; flex-shrink:0; }
  .lp-mode-toggle { display:flex; background:rgba(20,16,48,.7); border-radius:10px; border:1px solid rgba(139,130,255,.25); overflow:hidden; flex-shrink:0; }
  .lp-mode-btn { padding:7px 18px; border:none; font-size:12px; font-weight:700; transition:all .2s; }
  .lp-mode-btn.active { background:linear-gradient(135deg,#6c3ff5,#8b82ff); color:#fff; }
  .lp-mode-btn:not(.active) { background:transparent; color:#9080c8; }
  .lp-explore-search { flex:1; position:relative; max-width:420px; min-width:160px; }
  .lp-explore-search span { position:absolute; left:13px; top:50%; transform:translateY(-50%); font-size:14px; opacity:.55; pointer-events:none; }
  .lp-explore-search input { width:100%; padding:10px 14px 10px 38px; background:rgba(139,130,255,.1); border:1px solid rgba(139,130,255,.25); border-radius:11px; color:#e8e0ff; font-family:'DM Sans',sans-serif; font-size:13px; outline:none; transition:all .2s; }
  .lp-explore-search input:focus { border-color:rgba(167,139,250,.7); box-shadow:0 0 0 3px rgba(108,99,255,.15); }
  .lp-explore-grid { padding: 28px 36px 60px; display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:22px; max-width:1400px; margin:0 auto; width:100%; }
  .m360-ccard { transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease; }
  .m360-ccard:hover { transform:translateY(-6px) scale(1.02)!important; box-shadow:0 16px 48px rgba(108,50,255,.3),0 0 0 1px rgba(139,130,255,.45)!important; border-color:rgba(139,130,255,.5)!important; }

  @keyframes m360SlideUp { from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)} }
  @keyframes m360FadeIn  { from{opacity:0}to{opacity:1} }
  @keyframes m360Float0  { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }
  @keyframes m360Float1  { 0%,100%{transform:translateY(-4px)}50%{transform:translateY(4px)} }
  @keyframes m360Float2  { 0%,100%{transform:translateY(-2px)}50%{transform:translateY(7px)} }
  @keyframes m360Float3  { 0%,100%{transform:translateY(-6px)}50%{transform:translateY(2px)} }
  @keyframes m360CardFloat { 0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)} }
  .m360-scroll::-webkit-scrollbar{width:5px}
  .m360-scroll::-webkit-scrollbar-track{background:rgba(108,99,255,.04)}
  .m360-scroll::-webkit-scrollbar-thumb{background:rgba(108,99,255,.3);border-radius:3px}

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .lp-features-grid { grid-template-columns: repeat(2,1fr); }
    .lp-how-grid { grid-template-columns: repeat(2,1fr); }
    .lp-how-grid::before { display: none; }
    .lp-testi-grid { grid-template-columns: 1fr; max-width: 560px; margin: 0 auto; }
    .lp-stats-grid { grid-template-columns: repeat(2,1fr); }
    .lp-footer-top { grid-template-columns: 1fr 1fr; gap: 40px; }
    .lp-hero { padding: 100px 48px 80px; }
    .lp-hero-canvas { width: 50%; opacity: .7; }
    .lp-section { padding: 80px 48px; }
  }
  @media (max-width: 768px) {
    .lp-nav { padding: 0 24px; }
    .lp-nav-links { display: none; }
    .lp-hero { flex-direction: column; padding: 100px 24px 60px; text-align: center; }
    .lp-hero-canvas { position: absolute; width: 100%; opacity: .25; }
    .lp-hero-content { max-width: 100%; }
    .lp-hero-badge { margin: 0 auto 24px; }
    .lp-hero-ctas { justify-content: center; }
    .lp-hero-proof { justify-content: center; }
    .lp-section { padding: 60px 24px; }
    .lp-stats { padding: 60px 24px; }
    .lp-stats-grid { grid-template-columns: 1fr 1fr; }
    .lp-features-grid { grid-template-columns: 1fr; }
    .lp-how-grid { grid-template-columns: 1fr; }
    .lp-cta { padding: 80px 24px; }
    .lp-cta-border { inset: 40px 24px; }
    .lp-footer { padding: 60px 24px 32px; }
    .lp-footer-top { grid-template-columns: 1fr; gap: 32px; }
    .lp-footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
  }
`;

// ── Main Component ─────────────────────────────────────────────
export default function LandingPage({ onShowAuth, preSelectCoaching }) {
  // Explore state (preserved from original)
  const [view,         setView]         = useState("home");
  const [query,        setQuery]        = useState("");
  const [results,      setResults]      = useState([]);
  const [featured,     setFeatured]     = useState([]);
  const [tutors,       setTutors]       = useState([]);
  const [searching,    setSearching]    = useState(false);
  const [exploreReady, setExploreReady] = useState(false);
  const [exploreMode,  setExploreMode]  = useState("coaching");

  // Premium landing refs
  const canvasRef      = useRef(null);
  const cursorRef      = useRef(null);
  const cursorDotRef   = useRef(null);
  const rafRef         = useRef(null);
  const threeCleanup   = useRef(null);
  const exploreLoaded  = useRef(false); // track if Firestore data already fetched
  const [scriptsReady, setScriptsReady] = useState(true); // bundled — always ready
  const [countersRun,  setCountersRun]  = useState(false);
  const [cardVis, setCardVis] = useState(false);

  // ── Intro unlock ────────────────────────────────────────────
  useEffect(() => {
    if (_portalDone) { setCardVis(true); return; }
    const onDone = () => { _portalDone = true; setCardVis(true); };
    window.addEventListener("m360PortalDone", onDone);
    const t = setTimeout(() => { _portalDone = true; setCardVis(true); }, 2500);
    return () => { window.removeEventListener("m360PortalDone", onDone); clearTimeout(t); };
  }, []);

  // ── Lazy Explore data — only fetched when user opens Explore ──
  // Not on page load: saves ~200-400ms render time + Firestore reads
  // for visitors who never click Explore.
  const loadExploreData = useCallback(() => {
    if (exploreLoaded.current) return; // already fetched this session
    exploreLoaded.current = true;
    searchCoachings("").then(r => setFeatured(r.slice(0, 12))).catch(() => {});
    getAllTutors().then(r => setTutors(r)).catch(() => {});
  }, []);

  // ── Cleanup on unmount / view change ────────────────────────
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (threeCleanup.current) threeCleanup.current();
    };
  }, [view]);

  // ── Custom cursor ────────────────────────────────────────────
  useEffect(() => {
    if (view !== "home") return;
    const cursor = cursorRef.current;
    const dot    = cursorDotRef.current;
    if (!cursor || !dot || window.matchMedia("(pointer:coarse)").matches) return;
    let cx = -100, cy = -100, px = -100, py = -100;
    const onMove = e => { cx = e.clientX; cy = e.clientY; };
    const tick = () => {
      px += (cx - px) * 0.1; py += (cy - py) * 0.1;
      cursor.style.left = `${px}px`; cursor.style.top = `${py}px`;
      dot.style.left = `${cx}px`;   dot.style.top = `${cy}px`;
      requestAnimationFrame(tick);
    };
    tick();
    // hover effect
    const enter = () => cursor.classList.add("lp-hover");
    const leave = () => cursor.classList.remove("lp-hover");
    document.addEventListener("mousemove", onMove);
    document.querySelectorAll("button, a, [data-tilt]").forEach(el => {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    });
    return () => document.removeEventListener("mousemove", onMove);
  }, [view, scriptsReady]);

  // ── Three.js ─────────────────────────────────────────────────
  // Skipped on: touch/mobile devices (canvas is 25% opacity & barely visible)
  //             AND users who prefer reduced motion (accessibility + perf).
  useEffect(() => {
    if (!scriptsReady || !canvasRef.current || view !== "home") return;

    // ── Skip on mobile (touch) or prefers-reduced-motion ─────────
    const isMobile     = window.matchMedia("(pointer: coarse)").matches;
    const prefersLess  = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isMobile || prefersLess) return; // save GPU — globe is invisible on mobile anyway

    const canvas = canvasRef.current;
    const W = canvas.offsetWidth || window.innerWidth * 0.55;
    const H = canvas.offsetHeight || window.innerHeight;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    // Cap pixel ratio at 1.5 (was 2) — reduces GPU fill-rate by ~33%
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(W, H);
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.z = 5;

    // Outer wireframe icosahedron
    const geoOut = new THREE.IcosahedronGeometry(2, 4);
    const matOut = new THREE.MeshPhongMaterial({ color: 0x4F8EF7, emissive: 0x0a1a3a, wireframe: true, transparent: true, opacity: 0.18 });
    const meshOut = new THREE.Mesh(geoOut, matOut);
    scene.add(meshOut);

    // Inner solid
    const geoIn = new THREE.IcosahedronGeometry(1.55, 2);
    const matIn = new THREE.MeshPhongMaterial({ color: 0x0d1b3e, emissive: 0x060a14, transparent: true, opacity: 0.75 });
    const meshIn = new THREE.Mesh(geoIn, matIn);
    scene.add(meshIn);

    // Orbit rings
    const mkRing = (r, opa, col, rx, ry) => {
      const g = new THREE.TorusGeometry(r, 0.006, 8, 100);
      const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: opa });
      const mesh = new THREE.Mesh(g, m);
      mesh.rotation.x = rx; mesh.rotation.y = ry;
      scene.add(mesh); return mesh;
    };
    const ring1 = mkRing(2.6, 0.22, 0xA78BFA, Math.PI / 3, 0);
    const ring2 = mkRing(2.3, 0.18, 0x4F8EF7, -Math.PI / 4, Math.PI / 5);
    const ring3 = mkRing(2.0, 0.12, 0xF5C842, Math.PI / 6, Math.PI / 3);

    // Particles — reduced from 350 → 150 for better perf with no visible difference
    const cnt = 150;
    const pos = new Float32Array(cnt * 3);
    for (let i = 0; i < cnt * 3; i += 3) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3.0 + Math.random() * 1.8;
      pos[i]   = r * Math.sin(phi) * Math.cos(theta);
      pos[i+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i+2] = r * Math.cos(phi);
    }
    const geoP = new THREE.BufferGeometry();
    geoP.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const matP = new THREE.PointsMaterial({ color: 0xA78BFA, size: 0.02, transparent: true, opacity: 0.65 });
    const pts = new THREE.Points(geoP, matP);
    scene.add(pts);

    // Lights
    scene.add(new THREE.AmbientLight(0x1a3a6a, 1));
    const pl1 = new THREE.PointLight(0x4F8EF7, 3, 20); pl1.position.set(3, 4, 3); scene.add(pl1);
    const pl2 = new THREE.PointLight(0xA78BFA, 2, 15); pl2.position.set(-3, -3, -2); scene.add(pl2);
    const pl3 = new THREE.PointLight(0xF5C842, 1, 10); pl3.position.set(0, -4, 4); scene.add(pl3);

    let mx = 0, my = 0;
    const onMouse = e => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);
    const onResize = () => {
      camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    };
    window.addEventListener("resize", onResize);

    // Pause loop when tab is hidden — no point rendering off-screen
    let frameId = null;
    let t = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      rafRef.current = frameId;
      t += 0.005;
      meshOut.rotation.y = t * 0.3;
      meshOut.rotation.x = Math.sin(t * 0.2) * 0.15;
      meshIn.rotation.y  = -t * 0.2;
      ring1.rotation.z   = t * 0.14;
      ring2.rotation.z   = -t * 0.09;
      ring3.rotation.z   = t * 0.06;
      pts.rotation.y     = t * 0.04;
      scene.rotation.y  += (mx * 0.18 - scene.rotation.y) * 0.04;
      scene.rotation.x  += (my * 0.09 - scene.rotation.x) * 0.04;
      renderer.render(scene, camera);
    };
    const onVis = () => {
      if (document.hidden) { cancelAnimationFrame(frameId); frameId = null; }
      else if (!frameId)   { animate(); }
    };
    document.addEventListener("visibilitychange", onVis);
    animate();

    threeCleanup.current = () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, [scriptsReady, view]);

  // ── Vanilla Tilt ─────────────────────────────────────────────
  useEffect(() => {
    if (!scriptsReady || view !== "home") return;
    const els = document.querySelectorAll("[data-tilt]");
    VanillaTilt.init(els, { max: 12, speed: 500, glare: true, "max-glare": 0.15, scale: 1.02 });
    return () => els.forEach(el => el.vanillaTilt?.destroy());
  }, [scriptsReady, view]);

  // ── Scroll reveal ────────────────────────────────────────────
  useEffect(() => {
    if (view !== "home") return;
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("lp-revealed"); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [view]);

  // ── Scroll counters ──────────────────────────────────────────
  useEffect(() => {
    if (view !== "home") return;
    const sec = document.getElementById("lp-stats");
    if (!sec) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || countersRun) return;
      setCountersRun(true);
      document.querySelectorAll("[data-count]").forEach(el => {
        const target = +el.dataset.count;
        const suffix = el.dataset.suffix || "";
        let v = 0;
        const step = target / 70;
        const timer = setInterval(() => {
          v = Math.min(v + step, target);
          el.textContent = Math.floor(v).toLocaleString("en-IN") + suffix;
          if (v >= target) clearInterval(timer);
        }, 18);
      });
    }, { threshold: 0.3 });
    io.observe(sec);
    return () => io.disconnect();
  }, [countersRun, view]);

  // ── Magnetic buttons ─────────────────────────────────────────
  useEffect(() => {
    if (!scriptsReady || view !== "home") return;
    const btns = document.querySelectorAll("[data-magnetic]");
    const hs = [];
    btns.forEach(btn => {
      const move  = e => { const r = btn.getBoundingClientRect(); btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.28}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`; };
      const leave = () => { btn.style.transform = ""; };
      btn.addEventListener("mousemove", move);
      btn.addEventListener("mouseleave", leave);
      hs.push({ btn, move, leave });
    });
    return () => hs.forEach(({ btn, move, leave }) => { btn.removeEventListener("mousemove", move); btn.removeEventListener("mouseleave", leave); });
  }, [scriptsReady, view]);

  // ── Search ───────────────────────────────────────────────────
  const handleSearch = useCallback(async (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try { setResults(await searchCoachings(q)); }
    catch { setResults([]); }
    finally { setSearching(false); }
  }, []);

  const openExplore = () => {
    loadExploreData(); // fetch Firestore data only now (lazy — not on page load)
    setView("explore");
    setExploreReady(false);
    setTimeout(() => setExploreReady(true), 60);
  };
  const closeExplore = () => {
    setExploreReady(false);
    setTimeout(() => setView("home"), 300);
  };

  const tutorList = query.trim()
    ? tutors.filter(t => [t.name, t.subject, t.city, t.teachesWhom].some(f => (f || "").toLowerCase().includes(query.toLowerCase())))
    : tutors;

  // ─────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {/* ══════════ EXPLORE VIEW ══════════ */}
      {view === "explore" && (
        <div className="lp-explore-wrap" style={{ opacity: exploreReady ? 1 : 0, transition: "opacity .3s" }}>
          <div className="lp-explore-header">
            <button className="lp-explore-back" onClick={closeExplore}>← Back</button>
            <div className="lp-explore-logo">Mentoria<span style={{ color: "#4F8EF7" }}>360</span></div>
            <div className="lp-mode-toggle">
              <button className={`lp-mode-btn${exploreMode === "coaching" ? " active" : ""}`} onClick={() => { setExploreMode("coaching"); setQuery(""); setResults([]); }}>🏫 Coachings</button>
              <button className={`lp-mode-btn${exploreMode === "tutor"    ? " active" : ""}`} onClick={() => { setExploreMode("tutor");    setQuery(""); setResults([]); }}>👨‍🏫 Tutors</button>
            </div>
            <div className="lp-explore-search">
              <span>🔍</span>
              <input value={query} onChange={e => handleSearch(e.target.value)} placeholder={exploreMode === "tutor" ? "Search by name, subject, city..." : "Search by name, city, subject..."} />
            </div>
            <button onClick={() => onShowAuth("register-admin")} style={{ padding: "8px 14px", border: "1px solid rgba(167,139,250,.45)", borderRadius: 10, background: "rgba(108,50,255,.18)", color: "#c4b5fd", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", transition: "background .2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(108,50,255,.32)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(108,50,255,.18)"}>🏫 Register Coaching</button>
            <button onClick={() => onShowAuth("register-tutor")} style={{ padding: "8px 14px", border: "1px solid rgba(59,130,246,.45)", borderRadius: 10, background: "rgba(20,60,180,.18)", color: "#93c5fd", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", transition: "background .2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(20,60,180,.32)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(20,60,180,.18)"}>👨‍🏫 Register Tutor</button>
            <button onClick={() => onShowAuth("login")} style={{ padding: "8px 18px", border: "none", borderRadius: 10, background: "linear-gradient(135deg,#6c3ff5,#8b82ff)", color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 16px rgba(108,50,255,.4)", transition: "transform .2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>Sign In</button>
          </div>
          <div style={{ textAlign: "center", padding: "40px 40px 20px", animation: "m360FadeIn .45s ease" }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 32, background: "linear-gradient(90deg,#a78bfa,#e0d8ff,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 8 }}>
              {exploreMode === "tutor" ? (query ? `Tutors for "${query}"` : "Discover Tutors") : (query ? `Results for "${query}"` : "Discover Coaching Institutes")}
            </div>
            <div style={{ color: "#8878cc", fontSize: 14 }}>
              {exploreMode === "tutor" ? (query ? `${tutorList.length} tutor${tutorList.length !== 1 ? "s" : ""} found` : `${tutors.length} tutors registered`) : (query ? `${results.length} institute${results.length !== 1 ? "s" : ""} found` : "Browse institutes · Join as student")}
            </div>
          </div>
          <div className="lp-explore-grid">
            {exploreMode === "coaching" ? (
              <>
                {searching && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "#8878cc" }}>✨ Searching...</div>}
                {!searching && (query ? results : featured).length === 0 && (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔭</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: "#a78bfa", marginBottom: 8 }}>{query ? "No coachings found" : "No coachings yet"}</div>
                    <div style={{ color: "#5a4880", fontSize: 13, marginBottom: 24 }}>{query ? "Try a different search" : "Be the first to register!"}</div>
                    <button onClick={() => onShowAuth("register-admin")} style={{ padding: "12px 28px", border: "none", borderRadius: 12, background: "linear-gradient(135deg,#6c3ff5,#8b82ff)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 22px rgba(108,50,255,.4)" }}>Register Your Coaching →</button>
                  </div>
                )}
                {!searching && (query ? results : featured).map((c, idx) => (
                  <CoachingCard key={c.id} coaching={c} idx={idx} onJoin={() => { if (preSelectCoaching) preSelectCoaching(c); else onShowAuth("register"); }} />
                ))}
              </>
            ) : (
              <>
                {tutorList.length === 0 && (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🏫</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: "#60a5fa", marginBottom: 8 }}>{query ? "No tutors found" : "No tutors yet"}</div>
                    <div style={{ color: "#5a4880", fontSize: 13, marginBottom: 24 }}>{query ? "Try a different search" : "Be the first to join as a tutor!"}</div>
                    <button onClick={() => onShowAuth("register-tutor")} style={{ padding: "12px 28px", border: "none", borderRadius: 12, background: "linear-gradient(135deg,#1a5fbc,#3b82f6)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 22px rgba(59,130,246,.4)" }}>Register as Tutor →</button>
                  </div>
                )}
                {tutorList.map((t, idx) => <TutorCard key={t.id} tutor={t} idx={idx} onContact={() => onShowAuth("login")} />)}
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════ HOME — PREMIUM LANDING ══════════ */}
      {view === "home" && (
        <div className="lp" style={{ opacity: cardVis ? 1 : 0, transition: "opacity .8s ease", pointerEvents: cardVis ? "all" : "none", position: "relative", zIndex: 4 }}>
          {/* Grain */}
          <div className="lp-grain" aria-hidden />
          {/* Cursor */}
          <div ref={cursorRef} className="lp-cursor" />
          <div ref={cursorDotRef} className="lp-cursor-dot" />

          {/* ── Nav ── */}
          <nav className="lp-nav" data-reveal>
            <a href="#" className="lp-logo">
              <div className="lp-logo-gem">M</div>
              <span className="lp-logo-text">Mentoria<span>360</span></span>
            </a>
            <div className="lp-nav-links">
              <a href="#lp-features"      className="lp-nav-link">Features</a>
              <a href="#lp-how"           className="lp-nav-link">How It Works</a>
              <a href="#lp-testimonials"  className="lp-nav-link">Testimonials</a>
              <button onClick={openExplore} className="lp-nav-link" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 500, color: "#8899B0", letterSpacing: ".02em", transition: "color .2s" }}>Explore</button>
            </div>
            <div className="lp-nav-ctas">
              <button className="lp-btn lp-btn-ghost" onClick={() => onShowAuth("login")} data-magnetic>Sign In</button>
              <button className="lp-btn lp-btn-primary" onClick={() => onShowAuth("register")} data-magnetic>Get Started</button>
            </div>
          </nav>

          {/* ── Hero ── */}
          <section className="lp-hero">
            <canvas ref={canvasRef} className="lp-hero-canvas" />
            <div className="lp-hero-glow-1" />
            <div className="lp-hero-glow-2" />
            <div className="lp-hero-content">
              <div className="lp-hero-badge" data-reveal>
                <span className="lp-badge-pulse" />
                Trusted by 500+ Institutes Across India
              </div>
              <h1 className="lp-hero-title" data-reveal>
                <span className="lp-title-line">The Future of</span>
                <span className="lp-title-line lp-title-gradient">Coaching,</span>
                <span className="lp-title-line">Engineered.</span>
              </h1>
              <p className="lp-hero-sub" data-reveal>
                One platform where <strong style={{color:'#E8EDF5'}}>coaching institutes manage everything</strong>,
                students learn smarter, and tutors grow their careers —
                built for India's modern education ecosystem.
                <span style={{display:'block',marginTop:10,fontSize:15,color:'#4F8EF7',fontWeight:600}}>Where Students &amp; Teachers Grow Together.</span>
              </p>
              <div className="lp-hero-ctas" data-reveal>
                <button className="lp-btn lp-btn-gold lp-btn-lg" onClick={() => onShowAuth("register")} data-magnetic>
                  Start Free Today →
                </button>
                <button className="lp-btn lp-btn-outline lp-btn-lg" onClick={openExplore} data-magnetic>
                  ▶ Explore Institutes
                </button>
              </div>
              <div className="lp-hero-proof" data-reveal>
                <div className="lp-avatars">
                  {[["R","#4F8EF7"],["P","#A78BFA"],["A","#F5C842"],["S","#22C55E"]].map(([l, bg], i) => (
                    <div key={i} className="lp-av" style={{ background: bg }}>{l}</div>
                  ))}
                </div>
                <span className="lp-proof-text">
                  Join <strong>12,000+</strong> students already learning smarter
                </span>
              </div>
            </div>
            <div className="lp-scroll-hint">
              <div className="lp-scroll-line" />
              <span className="lp-scroll-text">Scroll</span>
            </div>
          </section>

          {/* ── Stats ── */}
          <section id="lp-stats" className="lp-stats">
            <div className="lp-stats-grid">
              {STATS.map((s, i) => (
                <div key={i} className="lp-stat" data-reveal data-tilt>
                  <div className="lp-stat-ico">{s.icon}</div>
                  <div className="lp-stat-val" data-count={s.value} data-suffix={s.suffix}>0{s.suffix}</div>
                  <div className="lp-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Features ── */}
          <section id="lp-features" className="lp-section">
            <div className="lp-section-header" data-reveal>
              <div className="lp-eyebrow">Platform Features</div>
              <h2 className="lp-section-title">Everything Your Institute Needs</h2>
              <p className="lp-section-sub">
                Mentoria360 covers the full lifecycle of running a coaching institute —
                from the moment a student joins to the day they graduate.
                Every feature is designed specifically for coaching institutes, not adapted from generic software.
              </p>
            </div>
            <div className="lp-features-grid">
              {FEATURES.map((f, i) => (
                <div key={i} className="lp-feat" data-reveal data-tilt style={{ "--delay": `${i * 0.08}s`, transitionDelay: `${i * 0.08}s` }}>
                  <div className="lp-feat-glow" />
                  <span className="lp-feat-icon">{f.icon}</span>
                  <h3 className="lp-feat-title">{f.title}</h3>
                  <p className="lp-feat-desc">{f.desc}</p>
                  <div className="lp-feat-line" />
                </div>
              ))}
            </div>
          </section>

          {/* ── How It Works ── */}
          <div className="lp-how-bg" id="lp-how">
            <div className="lp-how-inner">
              <div className="lp-section-header" data-reveal>
                <div className="lp-eyebrow">Process</div>
                <h2 className="lp-section-title">Up & Running in Under 10 Minutes</h2>
                <p className="lp-section-sub">No onboarding calls needed. No technical expertise required.</p>
              </div>
              <div className="lp-how-grid">
                {HOW.map((h, i) => (
                  <div key={i} className="lp-how-card" data-reveal style={{ transitionDelay: `${i * 0.1}s` }}>
                    <div className="lp-how-step">{h.step}</div>
                    <h3 className="lp-how-title">{h.title}</h3>
                    <p className="lp-how-desc">{h.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Testimonials ── */}
          <section id="lp-testimonials" className="lp-section">
            <div className="lp-section-header" data-reveal>
              <div className="lp-eyebrow">Real Stories</div>
              <h2 className="lp-section-title">Loved by Institutes &amp; Tutors Across India</h2>
              <p className="lp-section-sub">
                From solo tutors discovering their first students, to large institutes managing hundreds —
                here's what they say about Mentoria360.
              </p>
            </div>
            <div className="lp-testi-grid">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="lp-testi" data-reveal data-tilt style={{ transitionDelay: `${i * 0.1}s` }}>
                  <div className="lp-testi-q">"</div>
                  <div className="lp-stars">★★★★★</div>
                  <p className="lp-testi-quote">{t.quote}</p>
                  <div className="lp-testi-author">
                    <div className="lp-testi-av">{t.av}</div>
                    <div>
                      <div className="lp-testi-name">{t.name}</div>
                      <div className="lp-testi-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="lp-cta" data-reveal>
            <div className="lp-cta-glow" />
            <div className="lp-cta-border" />
            <div className="lp-cta-inner">
              <div className="lp-cta-badge">🚀 Free Forever for Small Institutes — No Credit Card</div>
              <h2 className="lp-cta-title">Ready to Build a Smarter<br />Coaching Experience?</h2>
              <p className="lp-cta-sub">
                Whether you run a 10-student home tuition or a 1000-student academy —
                Mentoria360 scales with you. Join 500+ institutes already running digitally.
              </p>
              <div className="lp-cta-actions">
                <button className="lp-btn lp-btn-gold lp-btn-xl" onClick={() => onShowAuth("register")} data-magnetic>Create Free Account →</button>
                <button className="lp-btn lp-btn-ghost lp-btn-lg" onClick={openExplore} data-magnetic>Explore Institutes</button>
              </div>
            </div>
          </section>

          {/* ── Footer ── */}
          <footer className="lp-footer">
            <div className="lp-footer-top">
              <div className="lp-footer-brand">
                <a href="#" className="lp-logo">
                  <div className="lp-logo-gem">M</div>
                  <span className="lp-logo-text">Mentoria<span>360</span></span>
                </a>
                <p>Where Students &amp; Teachers Grow Together.<br/>The modern platform for India's coaching ecosystem.</p>
              </div>
              <div>
                <div className="lp-footer-col-title">Product</div>
                <div className="lp-footer-col">
                  <a href="#lp-features">Features</a>
                  <a href="#lp-how">How It Works</a>
                  <button onClick={() => onShowAuth("register")}>Get Started</button>
                  <button onClick={openExplore}>Explore</button>
                </div>
              </div>
              <div>
                <div className="lp-footer-col-title">Company</div>
                <div className="lp-footer-col">
                  <a href="#">About</a>
                  <a href="#">Careers</a>
                  <a href="#">Contact</a>
                  <a href="#">Blog</a>
                </div>
              </div>
              <div>
                <div className="lp-footer-col-title">Legal</div>
                <div className="lp-footer-col">
                  <a href="#">Privacy Policy</a>
                  <a href="#">Terms of Service</a>
                  <a href="#">Cookies</a>
                </div>
              </div>
            </div>
            <div className="lp-footer-bottom">
              <span>© 2025 Mentoria360. All rights reserved.</span>
              <span>Made with <span className="lp-footer-heart">♥</span> in India</span>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}

// ── Coaching Card (preserved + enhanced) ──────────────────────
function CoachingCard({ coaching: c, idx, onJoin }) {
  const floats  = ["m360Float0","m360Float1","m360Float2","m360Float3"];
  const initials = (c.name||"?").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  const subjects = c.subject ? c.subject.split(/[,/]/).slice(0,3) : [];
  return (
    <div className="m360-ccard" style={{ background:"rgba(10,8,28,.9)", border:"1px solid rgba(139,130,255,.28)", borderRadius:20, padding:24, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", boxShadow:"0 8px 32px rgba(0,0,0,.5)", animation:`${floats[idx%4]} ${3.5+(idx%4)*.7}s ease-in-out ${(idx%6)*.35}s infinite, m360SlideUp .5s ease ${idx*.055}s both`, display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
        <div style={{ width:50, height:50, borderRadius:14, flexShrink:0, background:"linear-gradient(135deg,rgba(108,50,255,.4),rgba(59,130,246,.35))", border:"1px solid rgba(139,130,255,.35)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:17, color:"#d4c4ff", boxShadow:"0 0 18px rgba(108,50,255,.25)" }}>{initials}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:15, color:"#e8e0ff", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</div>
          {c.city && <div style={{ fontSize:12, color:"#7a6aaa" }}>📍 {c.city}{c.state ? `, ${c.state}` : ""}</div>}
        </div>
      </div>
      {subjects.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {subjects.map((s,i) => <span key={i} style={{ padding:"3px 11px", borderRadius:20, background:"rgba(139,130,255,.15)", border:"1px solid rgba(139,130,255,.28)", fontSize:11, color:"#b4a8ff", fontWeight:600 }}>{s.trim()}</span>)}
        </div>
      )}
      <div style={{ fontSize:11, color:"#5a4880", display:"flex", gap:14 }}>
        {c.yearsExp && <span>⭐ {c.yearsExp}y exp</span>}
        {c.phone    && <span style={{ color:"#4a7a60" }}>✅ Available</span>}
        {!c.yearsExp && !c.phone && <span>Open enrollment</span>}
      </div>
      <button onClick={onJoin} style={{ width:"100%", padding:"11px", border:"1px solid rgba(139,130,255,.42)", borderRadius:12, background:"rgba(139,130,255,.14)", color:"#d4c4ff", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all .2s", boxShadow:"0 2px 12px rgba(108,50,255,.12)" }} onMouseEnter={e=>{e.currentTarget.style.background="rgba(108,50,255,.32)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(139,130,255,.14)";e.currentTarget.style.color="#d4c4ff";}}>Join this Coaching →</button>
    </div>
  );
}

// ── Tutor Card (preserved + enhanced) ────────────────────────
function TutorCard({ tutor: t, idx, onContact }) {
  const floats    = ["m360Float0","m360Float1","m360Float2","m360Float3"];
  const initials  = (t.name||"?").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  const audiences = t.teachesWhom ? t.teachesWhom.split(",").map(x=>x.trim()).filter(Boolean) : [];
  const subjects  = t.subject ? t.subject.split(",").map(x=>x.trim()).slice(0,3) : [];
  return (
    <div className="m360-ccard" style={{ background:"rgba(6,14,36,.92)", border:"1px solid rgba(59,130,246,.28)", borderRadius:20, padding:24, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", boxShadow:"0 8px 32px rgba(0,0,0,.5)", animation:`${floats[idx%4]} ${3.5+(idx%4)*.7}s ease-in-out ${(idx%6)*.35}s infinite, m360SlideUp .5s ease ${idx*.055}s both`, display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        <div style={{ width:50, height:50, borderRadius:"50%", flexShrink:0, background:"linear-gradient(135deg,rgba(30,80,200,.5),rgba(59,130,246,.4))", border:"1px solid rgba(59,130,246,.4)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:17, color:"#93c5fd" }}>{initials}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:15, color:"#e0f0ff", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.name}</div>
          {t.city && <div style={{ fontSize:12, color:"#5a7aaa" }}>📍 {t.city}{t.state ? `, ${t.state}` : ""}</div>}
        </div>
      </div>
      {subjects.length > 0 && <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{subjects.map((s,i) => <span key={i} style={{ padding:"3px 10px", borderRadius:20, background:"rgba(59,130,246,.15)", border:"1px solid rgba(59,130,246,.3)", fontSize:11, color:"#93c5fd", fontWeight:600 }}>{s}</span>)}</div>}
      {audiences.length > 0 && <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{audiences.slice(0,3).map((a,i) => <span key={i} style={{ padding:"2px 9px", borderRadius:20, background:"rgba(168,85,247,.12)", border:"1px solid rgba(168,85,247,.25)", fontSize:10, color:"#c084fc", fontWeight:600 }}>{a}</span>)}{audiences.length>3 && <span style={{ fontSize:10, color:"#7060a8", padding:"2px 6px" }}>+{audiences.length-3} more</span>}</div>}
      {t.bio && <p style={{ fontSize:12, color:"#6070a0", lineHeight:1.5, margin:0, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{t.bio}</p>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, color:"#3a5080" }}>
        <span>{t.yearsExp ? `⭐ ${t.yearsExp}y exp` : "👨‍🏫 Tutor"}</span>
        {t.hourlyRate > 0 && <span style={{ color:"#22c55e", fontWeight:700, fontSize:12 }}>₹{t.hourlyRate}/hr</span>}
      </div>
      <button onClick={onContact} style={{ width:"100%", padding:"11px", border:"1px solid rgba(59,130,246,.42)", borderRadius:12, background:"rgba(30,80,200,.2)", color:"#93c5fd", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all .2s" }} onMouseEnter={e=>{e.currentTarget.style.background="rgba(59,130,246,.35)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(30,80,200,.2)";e.currentTarget.style.color="#93c5fd";}}>Contact Tutor →</button>
    </div>
  );
}

