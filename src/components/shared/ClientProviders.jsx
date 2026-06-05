"use client";
// src/components/shared/ClientProviders.jsx
// Wraps the app with all client-side providers.
// Kept separate from app/layout.jsx so that layout can be a
// Server Component (required for metadata export in Next.js).

import { useEffect } from "react";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

const TOASTER_CONFIG = {
  position: "top-right",
  toastOptions: {
    style: {
      background: "var(--bg2)",
      color: "var(--text)",
      border: "1px solid var(--border)",
      fontFamily: "DM Sans, sans-serif",
      fontSize: 13,
    },
    success: { iconTheme: { primary: "var(--green)", secondary: "var(--bg2)" } },
    error:   { iconTheme: { primary: "var(--red)",   secondary: "var(--bg2)" } },
  },
};

export default function ClientProviders({ children }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register the service worker after page loads to prevent blocking critical initial rendering resources
      const registerServiceWorker = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] Service Worker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.error("[PWA] Service Worker registration failed:", error);
          });
      };

      if (document.readyState === "complete") {
        registerServiceWorker();
      } else {
        window.addEventListener("load", registerServiceWorker);
        return () => window.removeEventListener("load", registerServiceWorker);
      }
    }
  }, []);

  return (
    <AuthProvider>
      <Toaster {...TOASTER_CONFIG} />
      {children}
    </AuthProvider>
  );
}
