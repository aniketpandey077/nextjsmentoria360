"use client";
// app/page.jsx — Public landing page (/)

import { useState, useEffect } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter } from "next/navigation";
import LandingPage from "@/src/components/public/LandingPage";
import AuthScreen from "@/src/components/auth/AuthScreen";

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "var(--bg-primary)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: "var(--accent)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden>
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm-2 11.5v3.5L12 19l2-1v-3.5L12 16l-2-1.5z" />
          </svg>
        </div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)" }}>Mentoria360</h1>
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

  useEffect(() => {
    if (!loading && user && profile?.role) {
      const role = profile.role.toLowerCase().trim();
      const routes = {
        admin: "/admin/dashboard",
        student: "/student/dashboard",
        tutor: "/tutor/dashboard",
        superadmin: "/superadmin/dashboard",
      };
      if (routes[role]) router.replace(routes[role]);
    }
  }, [user, profile, loading, router]);

  if (loading || (profile?.role && user)) return <LoadingScreen />;

  if (user && !profile) {
    return (
      <AuthScreen
        forceProfileSetupUser={user}
        preSelectedCoaching={preSelectCoaching}
        onGoHome={() => {
          setAuthView(null);
          setPreSelectCoaching(null);
        }}
      />
    );
  }

  return (
    <>
      {authView && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflowY: "auto",
            padding: 16,
          }}
        >
          <AuthScreen
            initialTab={
              authView === "register" || authView === "register-admin" || authView === "register-tutor"
                ? "register"
                : "login"
            }
            initialRegRole={
              authView === "register-admin" ? "admin" : authView === "register-tutor" ? "tutor" : "student"
            }
            preSelectedCoaching={preSelectCoaching}
            onGoHome={() => {
              setAuthView(null);
              setPreSelectCoaching(null);
            }}
          />
        </div>
      )}

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
