"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { StudentCoachingProvider } from "@/src/contexts/StudentCoachingContext";
import DashboardAuthGate from "@/src/components/shared/DashboardAuthGate";
import Sidebar from "@/src/components/shared/Sidebar";
import OnboardingTour from "@/src/components/shared/OnboardingTour";
import ErrorBoundary from "@/src/components/shared/ErrorBoundary";
import StudentCoachingBar from "@/src/components/student/StudentCoachingBar";

function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <span className="spinner" />
    </div>
  );
}

function StudentLayoutInner({ children }) {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const active = pathname.split("/")[2] || "dashboard";
  const [showTour, setShowTour] = useState(false);

  return (
    <>
      <Sidebar
        role="student"
        active={active}
        setActive={(page) => router.push(`/student/${page}`)}
        profile={profile}
        onLogout={logout}
      />
      <div className="main-content">
        <StudentCoachingBar />
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </div>
      {showTour && (
        <OnboardingTour role="student" uid={profile?.uid} onDone={() => setShowTour(false)} />
      )}
    </>
  );
}

export default function StudentLayout({ children }) {
  return (
    <DashboardAuthGate requiredRole="student">
      <StudentCoachingProvider>
        <StudentLayoutInner>{children}</StudentLayoutInner>
      </StudentCoachingProvider>
    </DashboardAuthGate>
  );
}
