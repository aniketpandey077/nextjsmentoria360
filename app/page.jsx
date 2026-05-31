"use client";
// app/page.jsx — Public landing page (/)
// Shows AnimatedBackground + PageFlipIntro + LandingPage.
// Auth screen floats on top when triggered.

import { useState, Suspense, lazy } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import LandingPage        from "@/src/components/public/LandingPage";
import AnimatedBackground from "@/src/components/public/AnimatedBackground";
import PageFlipIntro      from "@/src/components/public/PageFlipIntro";
import AuthScreen         from "@/src/components/auth/AuthScreen";

// Full-screen loading while auth resolves
function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36,
          background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
          borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm-2 11.5v3.5L12 19l2-1v-3.5L12 16l-2-1.5z"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, color: "var(--accent2)" }}>Mentoria360</h1>
      </div>
      <span className="spinner" />
    </div>
  );
}

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [authView, setAuthView] = useState(null);
  const [preSelectCoaching, setPreSelectCoaching] = useState(null);

  // If already logged in with a known role, redirect to their dashboard
  useEffect(() => {
    if (!loading && user && profile?.role) {
      const role = profile.role.toLowerCase().trim();
      const routes = {
        admin:      "/admin/dashboard",
        student:    "/student/dashboard",
        tutor:      "/tutor/dashboard",
        superadmin: "/superadmin/dashboard",
      };
      if (routes[role]) router.replace(routes[role]);
    }
  }, [user, profile, loading, router]);

  if (loading) return <LoadingScreen />;

  // Authenticated user with profile → handled by useEffect redirect above
  // Authenticated user without profile → show profile setup
  if (user && !profile) {
    return (
      <AuthScreen
        forceProfileSetupUser={user}
        preSelectedCoaching={preSelectCoaching}
        onGoHome={() => { setAuthView(null); setPreSelectCoaching(null); }}
      />
    );
  }

  // Public view
  return (
    <>
      {/* Persistent animated canvas */}
      <AnimatedBackground />

      {/* Premium page-flip intro */}
      <PageFlipIntro />

      {/* Auth modal overlay */}
      {authView && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(4,2,14,0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflowY: "auto",
        }}>
          <AuthScreen
            initialTab={authView === "register" || authView === "register-admin" || authView === "register-tutor" ? "register" : "login"}
            initialRegRole={
              authView === "register-admin" ? "admin" :
              authView === "register-tutor" ? "tutor" :
              "student"
            }
            preSelectedCoaching={preSelectCoaching}
            onGoHome={() => { setAuthView(null); setPreSelectCoaching(null); }}
          />
        </div>
      )}

      {/* Landing page — hidden when auth is open */}
      {!authView && (
        <LandingPage
          onShowAuth={(view) => setAuthView(view)}
          preSelectCoaching={(coaching) => {
            setPreSelectCoaching(coaching);
            setAuthView("register");
          }}
        />
      )}
    </>
  );
}

