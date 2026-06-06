"use client";
// src/contexts/AuthContext.jsx
// ============================================================
// Provides authentication state and methods to the entire app.
// Supports: Email/Password, Google OAuth, Phone OTP.
// Adds session cookie management for Next.js middleware auth guard.
// ============================================================

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "../services/firebase";
import { createUserProfile, getUserProfile } from "../services/firestoreService";

const AuthContext = createContext(null);

// ── Cookie helpers ────────────────────────────────────────────
// Sets session + role cookies so Next.js middleware can guard routes
// without a page flash. Token is valid for 1 hour (Firebase default).
async function setSessionCookies(firebaseUser, role) {
  try {
    const token = await firebaseUser.getIdToken();
    const maxAge = 60 * 60; // 1 hour in seconds
    document.cookie = `m360_session=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
    document.cookie = `m360_role=${role}; path=/; max-age=${maxAge}; SameSite=Strict`;
  } catch (err) {
    console.error("[Auth] Failed to set session cookies:", err);
  }
}

function clearSessionCookies() {
  document.cookie = "m360_session=; path=/; max-age=0; SameSite=Strict";
  document.cookie = "m360_role=; path=/; max-age=0; SameSite=Strict";
}

// ── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("m360_user");
      try {
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [profile, setProfile] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("m360_profile");
      try {
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [profileError, setProfileError] = useState(false);
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      const savedProfile = localStorage.getItem("m360_profile");
      return !savedProfile;
    }
    return true;
  });

  useEffect(() => {
    // Handle Google redirect result (mobile fallback)
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        const firebaseUser = result.user;
        setUser(firebaseUser);
        if (typeof window !== "undefined") {
          localStorage.setItem("m360_user", JSON.stringify({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email
          }));
        }
        try {
          setProfileError(false);
          let p = await getUserProfile(firebaseUser.uid);
          if (p) {
            setProfile(p);
            if (typeof window !== "undefined") {
              localStorage.setItem("m360_profile", JSON.stringify(p));
            }
            await setSessionCookies(firebaseUser, p.role);
          } else {
            setProfile(null);
            if (typeof window !== "undefined") {
              localStorage.removeItem("m360_profile");
            }
          }
        } catch {
          setProfileError(true);
          setProfile(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("m360_profile");
          }
        }
      }
    }).catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          if (typeof window !== "undefined") {
            localStorage.setItem("m360_user", JSON.stringify({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email
            }));
          }
          try {
            setProfileError(false);
            const p = await getUserProfile(firebaseUser.uid);
            setProfile(p);
            if (p) {
              if (typeof window !== "undefined") {
                localStorage.setItem("m360_profile", JSON.stringify(p));
              }
              // Refresh session cookie on each auth state change (handles page refresh)
              if (p?.role) await setSessionCookies(firebaseUser, p.role);
            } else {
              if (typeof window !== "undefined") {
                localStorage.removeItem("m360_profile");
              }
            }
          } catch (profileErr) {
            console.error("Failed to load user profile:", profileErr);
            setProfileError(true);
            setProfile(null);
            if (typeof window !== "undefined") {
              localStorage.removeItem("m360_profile");
            }
          }
        } else {
          setUser(null);
          setProfile(null);
          setProfileError(false);
          if (typeof window !== "undefined") {
            localStorage.removeItem("m360_user");
            localStorage.removeItem("m360_profile");
          }
          clearSessionCookies();
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setUser(null);
        setProfile(null);
        setProfileError(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem("m360_user");
          localStorage.removeItem("m360_profile");
        }
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // ── Email / Password Register ──────────────────────────────
  async function register(email, password, name, role, extra = {}) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    const profileData = {
      uid:    cred.user.uid,
      email,
      name,
      role,
      status: role === "student" ? "pending" : "active",
      coachingIds: [],
      ...extra,
    };

    await createUserProfile(cred.user.uid, profileData);
    setProfile(profileData);
    if (typeof window !== "undefined") {
      localStorage.setItem("m360_profile", JSON.stringify(profileData));
      localStorage.setItem("m360_user", JSON.stringify({ uid: cred.user.uid, displayName: name, email }));
    }
    await setSessionCookies(cred.user, role);
    return cred.user;
  }

  // ── Email / Password Login ─────────────────────────────────
  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const p = await getUserProfile(cred.user.uid);
    setProfile(p);
    if (typeof window !== "undefined") {
      if (p) localStorage.setItem("m360_profile", JSON.stringify(p));
      localStorage.setItem("m360_user", JSON.stringify({ uid: cred.user.uid, displayName: cred.user.displayName || "", email: cred.user.email }));
    }
    if (p?.role) await setSessionCookies(cred.user, p.role);
    return cred.user;
  }

  // ── Google OAuth ───────────────────────────────────────────
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    provider.addScope("email");
    provider.addScope("profile");

    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      let p = await getUserProfile(firebaseUser.uid);
      if (!p) {
        setUser(firebaseUser);
        setProfile(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("m360_profile");
          localStorage.setItem("m360_user", JSON.stringify({ uid: firebaseUser.uid, displayName: firebaseUser.displayName, email: firebaseUser.email }));
        }
        return { user: firebaseUser, isNew: true };
      }
      setProfile(p);
      if (typeof window !== "undefined") {
        localStorage.setItem("m360_profile", JSON.stringify(p));
        localStorage.setItem("m360_user", JSON.stringify({ uid: firebaseUser.uid, displayName: firebaseUser.displayName, email: firebaseUser.email }));
      }
      await setSessionCookies(firebaseUser, p.role);
      return { user: firebaseUser, isNew: false };
    } catch (err) {
      if (
        err.code === "auth/popup-blocked" ||
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        // Popup was blocked or cancelled, try redirect as fallback
        try {
          await signInWithRedirect(auth, provider);
          return { redirecting: true };
        } catch (redirectErr) {
          throw redirectErr;
        }
      }
      throw err;
    }
  }

  // ── Create profile for new social/phone users ──────────────
  async function createSocialProfile(firebaseUser, name, role, extra = {}) {
    const profileData = {
      uid:         firebaseUser.uid,
      email:       firebaseUser.email || "",
      phone:       firebaseUser.phoneNumber || "",
      name:        name || firebaseUser.displayName || "User",
      role,
      status:      role === "student" ? "pending" : "active",
      coachingIds: [],
      ...extra,
    };
    await createUserProfile(firebaseUser.uid, profileData);
    setProfile(profileData);
    if (typeof window !== "undefined") {
      localStorage.setItem("m360_profile", JSON.stringify(profileData));
      localStorage.setItem("m360_user", JSON.stringify({ uid: firebaseUser.uid, displayName: name || firebaseUser.displayName || "User", email: firebaseUser.email || "" }));
    }
    await setSessionCookies(firebaseUser, role);
    return profileData;
  }

  // ── Phone Auth — Step 1: Send OTP ─────────────────────────
  async function sendPhoneOTP(phoneNumber, recaptchaContainerId) {
    if (window._recaptchaVerifier) {
      try { window._recaptchaVerifier.clear(); } catch {}
    }
    const appVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: "invisible",
      callback: () => {},
    });
    window._recaptchaVerifier = appVerifier;
    const phone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
    const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
    window._phoneConfirmation = confirmationResult;
    return confirmationResult;
  }

  // ── Phone Auth — Step 2: Verify OTP ───────────────────────
  async function verifyPhoneOTP(confirmationResult, otp) {
    const result = await confirmationResult.confirm(otp);
    const firebaseUser = result.user;
    let p = await getUserProfile(firebaseUser.uid);
    if (!p) {
      setUser(firebaseUser);
      setProfile(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("m360_profile");
        localStorage.setItem("m360_user", JSON.stringify({ uid: firebaseUser.uid, displayName: firebaseUser.displayName, email: firebaseUser.email }));
      }
      return { user: firebaseUser, isNew: true };
    }
    setProfile(p);
    if (typeof window !== "undefined") {
      localStorage.setItem("m360_profile", JSON.stringify(p));
      localStorage.setItem("m360_user", JSON.stringify({ uid: firebaseUser.uid, displayName: firebaseUser.displayName, email: firebaseUser.email }));
    }
    await setSessionCookies(firebaseUser, p.role);
    return { user: firebaseUser, isNew: false };
  }

  // ── Sign Out ───────────────────────────────────────────────
  async function logout() {
    await signOut(auth);
    clearSessionCookies();
    setUser(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("m360_profile");
      localStorage.removeItem("m360_user");
    }
  }

  // ── Refresh Profile ────────────────────────────────────────
  async function refreshProfile() {
    if (user) {
      try {
        setProfileError(false);
        const p = await getUserProfile(user.uid);
        setProfile(p);
        if (typeof window !== "undefined" && p) {
          localStorage.setItem("m360_profile", JSON.stringify(p));
        }
        if (p?.role) await setSessionCookies(user, p.role);
        return p;
      } catch (err) {
        setProfileError(true);
        setProfile(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("m360_profile");
        }
        throw err;
      }
    }
  }

  const value = {
    user,
    profile,
    profileError,
    loading,
    register,
    login,
    loginWithGoogle,
    sendPhoneOTP,
    verifyPhoneOTP,
    createSocialProfile,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
