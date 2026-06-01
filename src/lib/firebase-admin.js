// Firebase Admin SDK — server-side only. Lazy-init for API routes.

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let _envLoaded = false;

function loadEnvFiles() {
  if (_envLoaded) return;
  _envLoaded = true;
  try {
    const { loadEnvConfig } = require("@next/env");
    loadEnvConfig(process.cwd());
  } catch {
    try {
      require("dotenv").config({ path: join(process.cwd(), ".env.local") });
    } catch {
      /* optional */
    }
  }
}

function normalizePrivateKey(key) {
  if (!key) return "";
  return key
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");
}

function loadServiceAccountFromFile() {
  const jsonPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    join(process.cwd(), "firebase-admin.json");
  if (!existsSync(jsonPath)) return null;
  const json = JSON.parse(readFileSync(jsonPath, "utf8"));
  return {
    projectId: json.project_id,
    clientEmail: json.client_email,
    privateKey: json.private_key,
  };
}

function getServiceAccount() {
  loadEnvFiles();

  const fromFile = loadServiceAccountFromFile();
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    fromFile?.projectId;
  const clientEmail =
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL || fromFile?.clientEmail;
  const privateKey = normalizePrivateKey(
    process.env.FIREBASE_ADMIN_PRIVATE_KEY || fromFile?.privateKey
  );

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [];
    if (!projectId) missing.push("FIREBASE_ADMIN_PROJECT_ID");
    if (!clientEmail) missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
    if (!privateKey) missing.push("FIREBASE_ADMIN_PRIVATE_KEY");
    throw new Error(
      `[firebase-admin] Missing ${missing.join(", ")}. ` +
        "Check .env.local (wrap PRIVATE_KEY in double quotes) and restart `npm run dev`. " +
        "Or place firebase-admin.json in the project root."
    );
  }

  return { projectId, clientEmail, privateKey };
}

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  const { projectId, clientEmail, privateKey } = getServiceAccount();
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
