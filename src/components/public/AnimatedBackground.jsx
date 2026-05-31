"use client";
// src/components/public/AnimatedBackground.jsx
// ============================================================
// Premium Aurora Flow background — replaces the old star-field.
// Deep drifting gradient orbs on an obsidian canvas, with a
// subtle geometric grid and mouse-driven parallax.
// No stars, no space look — think Vercel / Linear / Stripe.
// ============================================================

import { useEffect, useRef } from "react";

// ── Aurora orb definitions ────────────────────────────────────
const ORBS = [
  // x, y are in [0-1] normalised. r is fraction of screen diagonal.
  { x: 0.15, y: 0.25, r: 0.50, rgb: "79,142,247",  vx:  0.000055, vy:  0.000035, phase: 0.0, depth: 0.8 },
  { x: 0.82, y: 0.18, r: 0.45, rgb: "167,139,250", vx: -0.000045, vy:  0.000060, phase: 1.3, depth: 0.6 },
  { x: 0.50, y: 0.75, r: 0.55, rgb: "79,142,247",  vx:  0.000038, vy: -0.000048, phase: 2.5, depth: 1.0 },
  { x: 0.10, y: 0.80, r: 0.40, rgb: "130,100,255", vx:  0.000062, vy: -0.000032, phase: 0.7, depth: 0.7 },
  { x: 0.88, y: 0.62, r: 0.38, rgb: "56,200,220",  vx: -0.000072, vy:  0.000025, phase: 3.1, depth: 0.5 },
  { x: 0.42, y: 0.40, r: 0.30, rgb: "245,200,66",  vx:  0.000028, vy:  0.000055, phase: 1.8, depth: 0.4 },
];

const GRID_STEP = 88;

export default function AnimatedBackground() {
  const canvasRef  = useRef(null);
  const dotsRef    = useRef(null);     // second canvas for floating dots
  const rafRef     = useRef(null);
  const stateRef   = useRef({ W: 0, H: 0, mx: 0, my: 0, alive: true, orbs: null });

  useEffect(() => {
    const bg  = canvasRef.current;
    const dot = dotsRef.current;
    if (!bg || !dot) return;
    const bgCtx  = bg.getContext("2d");
    const dotCtx = dot.getContext("2d");
    const S = stateRef.current;

    // ── Perf / accessibility guards ─────────────────────────────────
    const prefersLess = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile    = window.matchMedia("(pointer: coarse)").matches;

    // If reduced motion is preferred: skip all animation, paint a static bg
    if (prefersLess) {
      S.W = bg.width  = dot.width  = window.innerWidth;
      S.H = bg.height = dot.height = window.innerHeight;
      bgCtx.fillStyle = "#080C14";
      bgCtx.fillRect(0, 0, S.W, S.H);
      return;
    }
    S.orbs = ORBS.map(o => ({ ...o }));
    S.alive = true;

    // ── Floating geometric dots ───────────────────────────────
    const mkDot = (W, H) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      size: Math.random() < 0.3 ? 2.5 : 1.2,
      col: Math.random() < 0.6 ? "79,142,247" : "167,139,250",
      alpha: 0.35 + Math.random() * 0.45,
      pulse: Math.random() * Math.PI * 2,
      pulseSpd: 0.008 + Math.random() * 0.015,
    });

    const resize = () => {
      S.W = bg.width  = dot.width  = window.innerWidth;
      S.H = bg.height = dot.height = window.innerHeight;
      S.mx = S.W / 2;
      S.my = S.H / 2;
      // Mobile: 20 dots instead of 70 — big CPU savings on phones
      const dotCount = isMobile ? 20 : 70;
      S.dots = Array.from({ length: dotCount }, () => mkDot(S.W, S.H));
    };
    resize();

    // ── Draw a single aurora orb ──────────────────────────────
    const drawOrb = (o, t) => {
      const { W, H, mx, my } = S;
      const diag = Math.sqrt(W * W + H * H);

      const cx = o.x * W;
      const cy = o.y * H;

      // Subtle mouse parallax — further objects move less
      const px = ((mx / W) - 0.5) * W * 0.04 * o.depth;
      const py = ((my / H) - 0.5) * H * 0.04 * o.depth;

      // Breathing radius
      const r = o.r * diag * (0.88 + Math.sin(t * 0.00045 + o.phase) * 0.12);

      const gx = cx + px, gy = cy + py;
      const grad = bgCtx.createRadialGradient(gx, gy, 0, gx, gy, r);
      grad.addColorStop(0.00, `rgba(${o.rgb}, 0.22)`);
      grad.addColorStop(0.30, `rgba(${o.rgb}, 0.11)`);
      grad.addColorStop(0.60, `rgba(${o.rgb}, 0.04)`);
      grad.addColorStop(1.00, `rgba(${o.rgb}, 0.00)`);

      bgCtx.beginPath();
      bgCtx.arc(gx, gy, r, 0, Math.PI * 2);
      bgCtx.fillStyle = grad;
      bgCtx.fill();
    };

    // ── Grid ─────────────────────────────────────────────────
    const drawGrid = () => {
      const { W, H } = S;
      bgCtx.save();
      bgCtx.strokeStyle = "rgba(79,142,247,0.045)";
      bgCtx.lineWidth   = 0.6;
      for (let x = 0; x < W; x += GRID_STEP) {
        bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, H); bgCtx.stroke();
      }
      for (let y = 0; y < H; y += GRID_STEP) {
        bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(W, y); bgCtx.stroke();
      }
      bgCtx.restore();
    };

    // ── Horizontal aurora bands ───────────────────────────────
    const drawBands = (t) => {
      const { W, H } = S;
      const bands = [
        { y: H * 0.92, amp: 18, col: "79,142,247",  opa: 0.07, freq: 1.8, ph: 0.0 },
        { y: H * 0.96, amp: 10, col: "167,139,250", opa: 0.05, freq: 2.4, ph: 1.2 },
      ];
      bands.forEach(b => {
        bgCtx.beginPath();
        bgCtx.moveTo(0, H);
        for (let x = 0; x <= W; x += 6) {
          bgCtx.lineTo(x, b.y + Math.sin((x / W) * Math.PI * 2 * b.freq + t * 0.00045 + b.ph) * b.amp);
        }
        bgCtx.lineTo(W, H);
        bgCtx.closePath();
        bgCtx.fillStyle = `rgba(${b.col},${b.opa})`;
        bgCtx.fill();
      });
    };

    // ── Floating dots ─────────────────────────────────────────
    const tickDots = () => {
      const { W, H, dots } = S;
      dotCtx.clearRect(0, 0, W, H);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        d.pulse += d.pulseSpd;
        if (d.x < 0) { d.x = 0; d.vx *= -1; }
        if (d.x > W) { d.x = W; d.vx *= -1; }
        if (d.y < 0) { d.y = 0; d.vy *= -1; }
        if (d.y > H) { d.y = H; d.vy *= -1; }
        const a = d.alpha * (0.65 + Math.sin(d.pulse) * 0.35);
        dotCtx.save();
        dotCtx.shadowColor = `rgba(${d.col},0.6)`;
        dotCtx.shadowBlur  = d.size > 2 ? 8 : 4;
        dotCtx.beginPath();
        dotCtx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        dotCtx.fillStyle = `rgba(${d.col},${a})`;
        dotCtx.fill();
        dotCtx.restore();
      });
    };

    // ── Drift orbs ────────────────────────────────────────────
    const tickOrbs = () => {
      S.orbs.forEach(o => {
        o.x += o.vx; o.y += o.vy;
        if (o.x < -0.1) { o.x = -0.1; o.vx *= -1; }
        if (o.x >  1.1) { o.x =  1.1; o.vx *= -1; }
        if (o.y < -0.1) { o.y = -0.1; o.vy *= -1; }
        if (o.y >  1.1) { o.y =  1.1; o.vy *= -1; }
      });
    };

    // ── Main loop ─────────────────────────────────────────────
    const loop = (t) => {
      if (!S.alive) return;
      const { W, H } = S;

      // Background
      bgCtx.fillStyle = "#080C14";
      bgCtx.fillRect(0, 0, W, H);

      // Aurora orbs
      tickOrbs();
      S.orbs.forEach(o => drawOrb(o, t));

      // Grid
      drawGrid();

      // Bands
      drawBands(t);

      // Dots
      tickDots();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    const onMouse = e => { S.mx = e.clientX; S.my = e.clientY; };
    const onResize = () => resize();
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (!rafRef.current && S.alive) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("mousemove", onMouse);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      S.alive = false;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const base = {
    position: "fixed", inset: 0,
    width: "100%", height: "100%",
    display: "block", pointerEvents: "none",
  };

  return (
    <>
      <canvas ref={canvasRef}  style={{ ...base, zIndex: 1 }} />
      <canvas ref={dotsRef}    style={{ ...base, zIndex: 2 }} />
    </>
  );
}

