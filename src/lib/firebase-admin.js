// src/lib/firebase-admin.js
// ============================================================
// Firebase Admin SDK — server-side only.
// Used in API Route Handlers for token verification,
// Firestore admin reads, and custom claims.
//
// NEVER import this file in client components or pages.
// Only use inside: app/api/**/route.js  or  server actions.
// ============================================================

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth }      from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  // Prevent re-initializing on hot reload in dev
  if (getApps().length > 0) return getApps()[0];

  const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "[firebase-admin] Missing FIREBASE_ADMIN_* env vars. " +
      "Add them to .env.local — see .env.local for instructions."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export const adminAuth = getAuth(getAdminApp());
export const adminDb   = getFirestore(getAdminApp());
