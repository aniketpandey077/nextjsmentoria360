"use client";

import { Suspense } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import DashboardAuthGate from "@/src/components/shared/DashboardAuthGate";
import Sidebar from "@/src/components/shared/Sidebar";
import ErrorBoundary from "@/src/components/shared/ErrorBoundary";

function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <span className="spinner" />
    </div>
  );
}

export default function SuperAdminLayout({ children }) {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const active = pathname.split("/")[2] || "dashboard";

  return (
    <DashboardAuthGate requiredRole="superadmin">
      <Sidebar
        role="superadmin"
        active={active}
        setActive={(page) => router.push(`/superadmin/${page}`)}
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
    </DashboardAuthGate>
  );
}
