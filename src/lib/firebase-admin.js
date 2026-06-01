// Firebase Admin SDK — server-side only. Lazy-init so `next build` works without env at compile time.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "[firebase-admin] Missing FIREBASE_ADMIN_* env vars in .env.local"
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let _auth = null;
let _db = null;

export function getAdminAuth() {
  if (!_auth) _auth = getAuth(getAdminApp());
  return _auth;
}

export function getAdminDb() {
  if (!_db) _db = getFirestore(getAdminApp());
  return _db;
}
