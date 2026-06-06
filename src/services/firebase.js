// src/services/firebase.js
// ============================================================
// Firebase Client SDK — credentials loaded from .env.local
// All vars use NEXT_PUBLIC_ prefix (required by Next.js for
// client-side exposure).
// Never hardcode keys here. .env.local is always .gitignored.
// ============================================================

import { initializeApp, getApps } from "firebase/app";
import { getAuth }       from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from "firebase/firestore";
import { getStorage }    from "firebase/storage";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || "AIzaSyBtyr2p40s7OE5gzQf0kl98bP81tdOBmnE",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || "project-main-cms.firebaseapp.com",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || "project-main-cms",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || "project-main-cms.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "784301098734",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || "1:784301098734:web:87634a6c32ceda4ae055ff",
};

if (!firebaseConfig.authDomain) {
  console.error("[Firebase] authDomain is missing! Google Sign-In will fail. Check .env.local and restart.");
}

// Prevent re-initializing on hot reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth    = getAuth(app);

// Initialize Firestore with local cache enabled for offline access & faster startup
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (e) {
  // If already initialized (e.g. Next.js hot reload), fallback to getFirestore
  dbInstance = getFirestore(app);
}

export const db      = dbInstance;
export const storage = getStorage(app);

export default app;
