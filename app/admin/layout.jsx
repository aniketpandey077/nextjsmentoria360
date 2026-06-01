"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import DashboardAuthGate from "@/src/components/shared/DashboardAuthGate";
import Sidebar from "@/src/components/shared/Sidebar";
import OnboardingTour from "@/src/components/shared/OnboardingTour";
import ErrorBoundary from "@/src/components/shared/ErrorBoundary";
import AdminCoachingGate from "@/src/components/admin/AdminCoachingGate";

function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <span className="spinner" />
    </div>
  );
}

export default function AdminLayout({ children }) {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const active = pathname.split("/")[2] || "dashboard";
  const [showTour, setShowTour] = useState(false);

  return (
    <DashboardAuthGate requiredRole="admin">
      <Sidebar
        role="admin"
        active={active}
        setActive={(page) => router.push(`/admin/${page}`)}
        profile={profile}
        onLogout={logout}
      />
      <div className="main-content">
        <AdminCoachingGate>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </AdminCoachingGate>
      </div>

      {profile?.whatsapp && (
        <a
          href={`https://wa.me/${profile.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-fab"
          aria-label="Contact on WhatsApp"
        >
          💬
        </a>
      )}

      {showTour && (
        <OnboardingTour role="admin" uid={profile?.uid} onDone={() => setShowTour(false)} />
      )}
    </DashboardAuthGate>
  );
}
