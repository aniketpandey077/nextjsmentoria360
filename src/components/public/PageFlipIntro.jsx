"use client";
// src/components/public/PageFlipIntro.jsx
// ============================================================
// Cinematic brand reveal intro for Mentoria360.
// Shows full "MENTORIA360" letter-by-letter with SVG ring draw.
// Tagline: "Where Students & Teachers Grow Together"
// Runs only once per session (sessionStorage).
// ============================================================

import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "m360_intro_done";

// Full brand name split (M + entoria360 = MENTORIA360)
const BRAND_LETTERS = "MENTORIA360".split("");

function dispatch() {
  window.dispatchEvent(new CustomEvent("m360PortalDone"));
}

export default function PageFlipIntro() {
  const alreadyDone = useRef(
    typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(SESSION_KEY) === "1"
  );

  const [phase,       setPhase]       = useState("ring");   // ring|letters|tagline|glow|exit
  const [letterCount, setLetterCount] = useState(0);
  const [visible,     setVisible]     = useState(true);
  const timers = useRef([]);

  const finish = () => {
    timers.current.forEach(clearTimeout);
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    setPhase("exit");
    setTimeout(() => { setVisible(false); dispatch(); }, 600);
  };

  useEffect(() => {
    if (alreadyDone.current) { dispatch(); return; }

    const add = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.current.push(id);
    };

    // Phase: ring starts immediately, text at 180ms (was 350ms)
    add(() => setPhase("letters"), 180);

    // Letters appear one by one — stagger 35ms each (was 65ms)
    BRAND_LETTERS.forEach((_, i) => {
      add(() => setLetterCount(i + 1), 180 + i * 35);
    });

    // Tagline after all letters — tighter delays
    const allLettersDone = 180 + BRAND_LETTERS.length * 35;
    add(() => setPhase("tagline"), allLettersDone + 50);  // was +80
    add(() => setPhase("glow"),    allLettersDone + 150); // was +250
    add(() => finish(),            allLettersDone + 350); // was +600

    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line
  }, []);

  if (!visible || alreadyDone.current) return null;

  const isExit    = phase === "exit";
  const showText  = ["letters","tagline","glow","exit"].includes(phase);
  const showTag   = ["tagline","glow","exit"].includes(phase);
  const showGlow  = phase === "glow" || isExit;

  const RADIUS = 56;
  const CIRC   = 2 * Math.PI * RADIUS;

  return (
    <>
      <style>{`
        @keyframes pfi-bgIn {
          from { opacity:0 } to { opacity:1 }
        }
        @keyframes pfi-ringDraw {
          from { stroke-dashoffset:${CIRC}; opacity:0.2 }
          to   { stroke-dashoffset:0;       opacity:1   }
        }
        @keyframes pfi-logoIn {
          from { opacity:0; transform:scale(0.3) rotateY(-20deg) }
          60%  { opacity:1; transform:scale(1.08) rotateY(4deg) }
          to   { opacity:1; transform:scale(1) rotateY(0deg) }
        }
        @keyframes pfi-letterIn {
          from { opacity:0; transform:translateY(18px) scale(0.85) }
          to   { opacity:1; transform:translateY(0) scale(1) }
        }
        @keyframes pfi-tagIn {
          from { opacity:0; transform:translateY(16px) }
          to   { opacity:0.7; transform:translateY(0) }
        }
        @keyframes pfi-dotIn {
          from { opacity:0; transform:scale(0) }
          to   { opacity:1; transform:scale(1) }
        }
        @keyframes pfi-exit {
          0%   { opacity:1; transform:scale(1) }
          35%  { opacity:0.8; transform:scale(1.3) }
          100% { opacity:0; transform:scale(2.4) }
        }
        @keyframes pfi-glowPulse {
          0%   { filter:drop-shadow(0 0 0px rgba(79,142,247,0)) }
          50%  { filter:drop-shadow(0 0 30px rgba(79,142,247,0.8)) drop-shadow(0 0 60px rgba(167,139,250,0.4)) }
          100% { filter:drop-shadow(0 0 14px rgba(79,142,247,0.5)) }
        }
        @keyframes pfi-scanline {
          from { top:-3px }
          to   { top:100% }
        }
        @keyframes pfi-progress {
          from { width:0% }
          to   { width:100% }
        }
        @keyframes pfi-gridIn {
          0%   { opacity:0 }
          25%  { opacity:0.35 }
          100% { opacity:0.06 }
        }
        @keyframes pfi-cornerIn {
          from { opacity:0; transform: scale(0.5) }
          to   { opacity:1; transform: scale(1) }
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={finish}
        style={{
          position:       "fixed",
          inset:          0,
          zIndex:         500,
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          background:     "#03060E",
          cursor:         "pointer",
          overflow:       "hidden",
          animation:      isExit
            ? "pfi-exit 600ms cubic-bezier(0.4,0,0.2,1) forwards"
            : "pfi-bgIn 200ms ease forwards",
        }}
      >
        {/* Grid flash */}
        <div style={{
          position:        "absolute",
          inset:           0,
          backgroundImage: "linear-gradient(rgba(79,142,247,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(79,142,247,0.07) 1px, transparent 1px)",
          backgroundSize:  "80px 80px",
          animation:       "pfi-gridIn 1.4s ease forwards",
          pointerEvents:   "none",
        }} />

        {/* Vignette */}
        <div style={{
          position:     "absolute",
          inset:        0,
          background:   "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 35%, rgba(0,0,0,0.8) 100%)",
          pointerEvents:"none",
        }} />

        {/* Scanline */}
        <div style={{
          position:      "absolute",
          left:          0,
          right:         0,
          height:        2,
          background:    "linear-gradient(90deg, transparent, rgba(79,142,247,0.5), rgba(167,139,250,0.7), rgba(79,142,247,0.5), transparent)",
          boxShadow:     "0 0 12px rgba(79,142,247,0.6)",
          animation:     "pfi-scanline 0.85s cubic-bezier(0.4,0,0.2,1) 0.08s both",
          pointerEvents: "none",
        }} />

        {/* Skip — large, bright, impossible to miss */}
        <button
          onClick={e => { e.stopPropagation(); finish(); }}
          style={{
            position:       "absolute",
            top:            20,
            right:          24,
            padding:        "10px 24px",
            border:         "1px solid rgba(79,142,247,0.7)",
            borderRadius:   24,
            background:     "rgba(79,142,247,0.18)",
            color:          "#93BBFF",
            fontFamily:     "'DM Sans', sans-serif",
            fontSize:       13,
            fontWeight:     700,
            letterSpacing:  "0.06em",
            textTransform:  "uppercase",
            cursor:         "pointer",
            backdropFilter: "blur(8px)",
            zIndex:         10,
            transition:     "all 0.2s",
            boxShadow:      "0 0 16px rgba(79,142,247,0.3)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background  = "rgba(79,142,247,0.32)";
            e.currentTarget.style.boxShadow   = "0 0 28px rgba(79,142,247,0.55)";
            e.currentTarget.style.borderColor = "rgba(79,142,247,0.9)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = "rgba(79,142,247,0.18)";
            e.currentTarget.style.boxShadow   = "0 0 16px rgba(79,142,247,0.3)";
            e.currentTarget.style.borderColor = "rgba(79,142,247,0.7)";
          }}
        >
          Skip ✕
        </button>

        {/* ── Main logo assembly ── */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:0 }}>

          {/* SVG ring (decorative logo mark) */}
          <div style={{ position:"relative", width: RADIUS*2+20, height: RADIUS*2+20, marginBottom: 32 }}>
            <svg viewBox={`0 0 ${RADIUS*2+20} ${RADIUS*2+20}`} style={{ position:"absolute", inset:0, animation: showGlow ? "pfi-glowPulse 0.7s ease forwards" : "none" }}>
              {/* Background faint circle */}
              <circle cx={RADIUS+10} cy={RADIUS+10} r={RADIUS} fill="none" stroke="rgba(79,142,247,0.1)" strokeWidth="1" />
              {/* Animated draw ring */}
              <circle
                cx={RADIUS+10} cy={RADIUS+10} r={RADIUS}
                fill="none"
                stroke="url(#pfi-grad)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC}
                style={{
                  transformOrigin: "center",
                  transform:       "rotate(-90deg)",
                  animation:       "pfi-ringDraw 0.6s cubic-bezier(0.4,0,0.2,1) forwards",
                  filter:          "drop-shadow(0 0 6px rgba(79,142,247,0.65))",
                }}
              />
              {/* Accent dots at cardinal points */}
              {[0,90,180,270].map((deg, i) => {
                const rad = (deg - 90) * Math.PI / 180;
                const cx = RADIUS+10 + Math.cos(rad) * RADIUS;
                const cy = RADIUS+10 + Math.sin(rad) * RADIUS;
                return (
                  <circle key={i} cx={cx} cy={cy} r={3}
                    fill={i%2===0 ? "#4F8EF7" : "#A78BFA"}
                    style={{ opacity:0, animation:`pfi-dotIn 0.3s ease ${0.5+i*0.07}s forwards`, filter:`drop-shadow(0 0 4px ${i%2===0?"#4F8EF7":"#A78BFA"})` }}
                  />
                );
              })}
              <defs>
                <linearGradient id="pfi-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#4F8EF7" />
                  <stop offset="50%"  stopColor="#A78BFA" />
                  <stop offset="100%" stopColor="#4F8EF7" />
                </linearGradient>
              </defs>
            </svg>

            {/* Logo mark inside ring */}
            {showText && (
              <div style={{
                position:       "absolute",
                inset:          0,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontFamily:     "'Cormorant Garamond', Georgia, serif",
                fontSize:       46,
                fontWeight:     700,
                background:     "linear-gradient(135deg, #E8EDF5 20%, #A78BFA 60%, #4F8EF7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
                backgroundClip:      "text",
                animation:      "pfi-logoIn 0.4s cubic-bezier(0.34,1.4,0.64,1) forwards",
                letterSpacing:  "-1px",
              }}>
                M
              </div>
            )}
          </div>

          {/* Full MENTORIA 360 word — letter by letter */}
          <div style={{ display:"flex", alignItems:"baseline", marginBottom: 20 }}>
            {BRAND_LETTERS.map((ch, i) => {
              // Styling: "MENTORIA" = elegant white, "360" = electric blue
              const isNum = i >= 8;
              return (
                <span
                  key={i}
                  style={{
                    fontFamily:         "'Cormorant Garamond', Georgia, serif",
                    fontSize:           isNum ? 40 : 38,
                    fontWeight:         isNum ? 600 : 400,
                    letterSpacing:      isNum ? "0.04em" : "-0.5px",
                    color:              isNum ? "#4F8EF7" : "#E8EDF5",
                    display:            "inline-block",
                    opacity:            0,
                    textShadow:         isNum ? "0 0 20px rgba(79,142,247,0.6)" : "none",
                    transition:         "none",
                    animation:          i < letterCount
                      ? `pfi-letterIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards`
                      : "none",
                    // Slightly space the "3" from "A" visually
                    marginLeft:         i === 8 ? "4px" : "0",
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>

          {/* Divider */}
          {showTag && (
            <div style={{
              width:        180,
              height:       1,
              background:   "linear-gradient(90deg, transparent, rgba(79,142,247,0.5), rgba(167,139,250,0.5), transparent)",
              marginBottom: 14,
              opacity:      0,
              animation:    "pfi-tagIn 0.45s ease forwards",
            }} />
          )}

          {/* Tagline */}
          {showTag && (
            <div style={{
              fontFamily:   "'DM Sans', sans-serif",
              fontSize:     12,
              fontWeight:   500,
              letterSpacing:"0.18em",
              textTransform:"uppercase",
              color:        "#445566",
              opacity:      0,
              animation:    "pfi-tagIn 0.45s ease 0.07s forwards",
            }}>
              Where Students &amp; Teachers Grow Together
            </div>
          )}
        </div>

        {/* Progress bar at bottom */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:"rgba(79,142,247,0.1)" }}>
          <div style={{
            height:     "100%",
            background: "linear-gradient(90deg, #4F8EF7, #A78BFA, #4F8EF7)",
            boxShadow:  "0 0 10px rgba(79,142,247,0.5)",
            animation:  `pfi-progress ${180 + BRAND_LETTERS.length * 35 + 350}ms linear forwards`,
          }} />
        </div>

        {/* Corner brackets */}
        {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h],i) => (
          <div key={i} style={{
            position:     "absolute",
            [v]:          22, [h]: 22,
            width:        22, height: 22,
            borderTop:    v==="top"    ? "1px solid rgba(79,142,247,0.4)" : "none",
            borderBottom: v==="bottom" ? "1px solid rgba(79,142,247,0.4)" : "none",
            borderLeft:   h==="left"   ? "1px solid rgba(79,142,247,0.4)" : "none",
            borderRight:  h==="right"  ? "1px solid rgba(79,142,247,0.4)" : "none",
            opacity:      0,
            animation:    `pfi-cornerIn 0.35s ease ${0.45+i*0.06}s forwards`,
          }} />
        ))}
      </div>
    </>
  );
}

