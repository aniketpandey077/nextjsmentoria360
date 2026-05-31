"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import DashboardAuthGate from "@/src/components/shared/DashboardAuthGate";
import Sidebar from "@/src/components/shared/Sidebar";
import OnboardingTour from "@/src/components/shared/OnboardingTour";
import ErrorBoundary from "@/src/components/shared/ErrorBoundary";

function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <span className="spinner" />
    </div>
  );
}

export default function TutorLayout({ children }) {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const active = pathname.split("/")[2] || "dashboard";
  const [showTour, setShowTour] = useState(false);

  return (
    <DashboardAuthGate requiredRole="tutor">
      <Sidebar
        role="tutor"
        active={active}
        setActive={(page) => router.push(`/tutor/${page}`)}
        profile={profile}
        onLogout={logout}
      />
      <div className="main-content">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </div>
      {showTour && (
        <OnboardingTour role="tutor" uid={profile?.uid} onDone={() => setShowTour(false)} />
      )}
    </DashboardAuthGate>
  );
}
