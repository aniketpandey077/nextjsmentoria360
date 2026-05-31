// app/layout.jsx — Root layout (Server Component)
// Metadata export requires this to be a Server Component.
// AuthProvider is wrapped inside a separate ClientProviders component.

import ClientProviders from "@/src/components/shared/ClientProviders";
import "@/src/styles/globals.css";

export const metadata = {
  title: "Mentoria360 — Smart Coaching Management",
  description: "Manage students, fees, attendance, tests, homework and more — all in one platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
