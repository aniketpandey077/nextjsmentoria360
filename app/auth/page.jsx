"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import AuthScreen from "@/src/components/auth/AuthScreen";

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span className="spinner" />
    </div>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuth();

  const tab = searchParams.get("tab");
  const initialTab =
    tab === "register" || tab === "register-admin" || tab === "register-tutor"
      ? "register"
      : "login";
  const initialRegRole =
    tab === "register-admin" ? "admin" :
    tab === "register-tutor" ? "tutor" :
    "student";

  useEffect(() => {
    if (loading || !user || !profile?.role) return;
    const routes = {
      admin:      "/admin/dashboard",
      student:    "/student/dashboard",
      tutor:      "/tutor/dashboard",
      superadmin: "/superadmin/dashboard",
    };
    const dest = routes[profile.role.toLowerCase().trim()];
    if (dest) router.replace(dest);
  }, [user, profile, loading, router]);

  if (loading) return <LoadingScreen />;

  if (user && profile?.role) return <LoadingScreen />;

  if (user && !profile) {
    return (
      <AuthScreen
        forceProfileSetupUser={user}
        onGoHome={() => router.push("/")}
      />
    );
  }

  return (
    <AuthScreen
      initialTab={initialTab}
      initialRegRole={initialRegRole}
      onGoHome={() => router.push("/")}
    />
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthPageContent />
    </Suspense>
  );
}
