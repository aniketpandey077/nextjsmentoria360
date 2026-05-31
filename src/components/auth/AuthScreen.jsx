"use client";
// src/components/auth/AuthScreen.jsx
// ============================================================
// Login + Registration screen.
// Supports: Email/Password, Google OAuth, Phone OTP.
// Students: sign up → search coaching → request to join.
// Admins: sign up → create coaching institute.
// ============================================================

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  createCoaching,
  updateUserProfile,
  createJoinRequest,
  searchCoachings,
  invalidateCoachingsCache,
} from "../../services/firestoreService";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../services/firebase";
import toast from "react-hot-toast";

// ── Google Icon SVG ─────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// ── Divider ─────────────────────────────────────────────────
const OrDivider = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    <span style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>or</span>
    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
  </div>
);

// ── New Social User Setup Modal ─────────────────────────────
function SocialProfileSetup({ firebaseUser, preSelectedCoaching, onComplete, onCancel }) {
  const { createSocialProfile, loginWithGoogle } = useAuth();
  const [role,    setRole]    = useState("student");
  const [name,    setName]    = useState(firebaseUser?.displayName || "");
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState(1);
  const [coachingResults,   setCoachingResults]   = useState([]);
  const [selectedCoaching,  setSelectedCoaching]  = useState(preSelectedCoaching || null);
  const [searchQ,    setSearchQ]    = useState("");
  const [searching,  setSearching]  = useState(false);
  const [form,    setForm]    = useState({ coachingName: "", city: "", subject: "", phone: "" });
  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSearch = async (val) => {
    setSearchQ(val);
    if (!val.trim()) { setCoachingResults([]); return; }
    setSearching(true);
    try { setCoachingResults(await searchCoachings(val)); }
    catch { setCoachingResults([]); }
    finally { setSearching(false); }
  };

  const handleComplete = async (skip = false) => {
    if (!name.trim()) { toast.error("Please enter your name."); return; }
    setLoading(true);
    try {
      if (role === "admin") {
        if (!form.coachingName || !form.city) { toast.error("Coaching name and city are required."); setLoading(false); return; }
        await createSocialProfile(firebaseUser, name, "admin", { coachingId: null });
        const coachingId = await createCoaching({
          name: form.coachingName, city: form.city,
          subject: form.subject, phone: form.phone,
          whatsapp: form.phone, adminId: firebaseUser.uid,
        });
        await updateUserProfile(firebaseUser.uid, { coachingId });
        invalidateCoachingsCache(); // new institute should appear in search immediately
        toast.success("Institute registered! Welcome.");
        onComplete();
      } else {
        if (step === 1) { setStep(2); setLoading(false); return; }
        if (skip || !selectedCoaching) {
          // Student skips coaching — register as independent
          await createSocialProfile(firebaseUser, name, "student", {
            coachingId: null, coachingIds: [], status: "independent",
          });
          toast.success("Account created! You can join a coaching anytime from your profile.");
          onComplete();
          return;
        }
        await createSocialProfile(firebaseUser, name, "student", {
          requestedCoachingId: selectedCoaching.id, coachingId: null, coachingIds: [], status: "pending",
        });
        await createJoinRequest(selectedCoaching.id, {
          studentId: firebaseUser.uid, studentName: name, studentEmail: firebaseUser.email || "",
        });
        toast.success("Join request sent! Awaiting approval.");
        onComplete();
      }
    } catch (e) {
      toast.error(e.message || "Setup failed.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div className="card" style={{ width: "100%", maxWidth: 460, padding: 32, borderRadius: "var(--radius-lg)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>👋</div>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 22, marginBottom: 6 }}>Complete Your Profile</h2>
          <p style={{ fontSize: 13, color: "var(--text2)" }}>Just a few details to get you started</p>
        </div>

        {/* Name */}
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
        </div>

        {/* Role selection (step 1) */}
        {step === 1 && (
          <div className="tab-bar" style={{ marginBottom: 16 }}>
            <button className={`tab${role === "student" ? " active" : ""}`} onClick={() => setRole("student")}>Student</button>
            <button className={`tab${role === "admin"   ? " active" : ""}`} onClick={() => setRole("admin")}>Coaching Admin</button>
          </div>
        )}

        {/* Admin extra fields */}
        {role === "admin" && step === 1 && (
          <>
            <div className="form-group">
              <label className="form-label">Institute Name</label>
              <input value={form.coachingName} onChange={setF("coachingName")} placeholder="e.g. Brilliant Minds Institute" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input value={form.city} onChange={setF("city")} placeholder="Delhi" />
              </div>
              <div className="form-group">
                <label className="form-label">Subject Focus</label>
                <input value={form.subject} onChange={setF("subject")} placeholder="IIT-JEE" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone / WhatsApp</label>
              <input value={form.phone} onChange={setF("phone")} placeholder="9876543210" />
            </div>
          </>
        )}

        {/* Student step 2 - search coaching */}
        {role === "student" && step === 2 && (
          <>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>Select your coaching institute:</p>
            {selectedCoaching && (
              <div className="alert alert-info" style={{ fontSize: 12, marginBottom: 12 }}>
                Selected: <strong>{selectedCoaching.name}</strong>
                <button onClick={() => setSelectedCoaching(null)} style={{ marginLeft: 8, background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12 }}>Change</button>
              </div>
            )}
            {!selectedCoaching && (
              <>
                <div className="search-wrap" style={{ marginBottom: 10 }}>
                  <span className="search-icon">🔍</span>
                  <input placeholder="Search institute..." value={searchQ} onChange={e => handleSearch(e.target.value)} />
                </div>
                <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  {searching && <div style={{ textAlign: "center", padding: 16 }}><span className="spinner" /></div>}
                  {!searching && coachingResults.map(c => (
                    <div key={c.id} onClick={() => setSelectedCoaching(c)} style={{
                      padding: "10px 12px", background: "var(--bg3)", border: "1px solid var(--border)",
                      borderRadius: 8, cursor: "pointer", fontSize: 13,
                    }}>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>📍 {c.city} · {c.subject}</div>
                    </div>
                  ))}
                  {!searching && !searchQ && <div style={{ textAlign: "center", padding: 16, color: "var(--text3)", fontSize: 11 }}>Type to search...</div>}
                </div>
              </>
            )}
            <button className="btn btn-secondary btn-sm" onClick={() => setStep(1)} style={{ marginBottom: 12 }}>← Back</button>
          </>
        )}

        <button className="btn btn-primary btn-full" onClick={() => handleComplete(false)} disabled={loading} style={{ marginTop: 8 }}>
          {loading ? <span className="spinner" /> : role === "admin" ? "Create Institute →" : step === 1 ? "Next: Select Coaching →" : selectedCoaching ? "Send Join Request →" : "Skip for Now →"}
        </button>
        {role === "student" && step === 2 && selectedCoaching && (
          <button
            className="btn btn-secondary btn-full"
            onClick={() => handleComplete(true)}
            disabled={loading}
            style={{ marginTop: 8, fontSize: 12 }}
          >
            Skip — I'll join a coaching later
          </button>
        )}
        <button
          className="btn btn-secondary btn-full"
          onClick={onCancel}
          disabled={loading}
          style={{ marginTop: 8, fontSize: 13, background: "transparent", color: "var(--text3)", border: "none" }}
        >
          Cancel & Go Back
        </button>
      </div>
    </div>
  );
}

// ── Main AuthScreen ─────────────────────────────────────────
export default function AuthScreen({ initialTab = "login", initialRegRole = "student", preSelectedCoaching = null, onGoHome, forceProfileSetupUser = null }) {
  const { login, register, loginWithGoogle, sendPhoneOTP, verifyPhoneOTP, refreshProfile, logout } = useAuth();

  const [tab,     setTab]     = useState(initialTab);
  const [regRole, setRegRole] = useState(
    initialRegRole === "admin"  ? "admin"  :
    initialRegRole === "tutor" ? "tutor"  :
    "student"
  );
  const [step,    setStep]    = useState(1);
  const [loginMode, setLoginMode] = useState("email"); // "email" | "phone"

  const [form, setForm] = useState({
    email: "", password: "", name: "",
    coachingName: "", city: "", state: "", address: "", pincode: "",
    subject: "", phone: "", yearsExp: "",
  });

  // Phone auth state
  const [phoneNum,    setPhoneNum]    = useState("");
  const [otp,         setOtp]         = useState("");
  const [phoneStep,   setPhoneStep]   = useState(1);  // 1=enter phone, 2=enter OTP
  const [confirmation, setConfirmation] = useState(null);

  // Coaching search
  const [coachingResults,  setCoachingResults]  = useState([]);
  const [selectedCoaching, setSelectedCoaching] = useState(preSelectedCoaching || null);
  const [searchQ,   setSearchQ]   = useState(preSelectedCoaching ? preSelectedCoaching.name : "");
  const [searching, setSearching] = useState(false);

  // UI state
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [forgotPw,   setForgotPw]   = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetting,  setResetting]  = useState(false);

  // New social user setup
  const [newSocialUser, setNewSocialUser] = useState(forceProfileSetupUser);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const switchTab = (t) => { setTab(t); setError(""); setStep(1); setSelectedCoaching(preSelectedCoaching || null); setLoginMode("email"); setPhoneStep(1); };

  // Pre-populate search if coaching was pre-selected from landing page
  useEffect(() => {
    if (preSelectedCoaching) {
      setSelectedCoaching(preSelectedCoaching);
      setTab("register");
      setRegRole("student");
      setStep(2);
    }
  }, []);

  // ── Forgot Password ──────────────────────────────────────
  const handleForgotPassword = async () => {
    const email = resetEmail.trim() || form.email.trim();
    if (!email) { setError("Enter your email first."); return; }
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Reset email sent to ${email}!`);
      setForgotPw(false);
      setResetEmail("");
    } catch (err) {
      setError(
        err.code === "auth/user-not-found" ? "No account found with this email." :
        err.code === "auth/invalid-email"   ? "Invalid email address." :
        "Failed to send reset email."
      );
    } finally { setResetting(false); }
  };

  // ── Search Coachings ────────────────────────────────────
  const handleSearch = async (val) => {
    setSearchQ(val);
    if (!val.trim()) { setCoachingResults([]); return; }
    setSearching(true);
    try { setCoachingResults(await searchCoachings(val)); }
    catch { setCoachingResults([]); }
    finally { setSearching(false); }
  };

  // ── Email Login ─────────────────────────────────────────
  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(
        err.code === "auth/user-not-found"   ? "No account found with this email." :
        err.code === "auth/wrong-password"   ? "Incorrect password." :
        err.code === "auth/invalid-email"    ? "Invalid email address." :
        err.code === "auth/invalid-credential" ? "Invalid email or password." :
        err.code === "auth/too-many-requests" ? "Too many attempts. Try again later." :
        "Login failed. Please try again."
      );
    } finally { setLoading(false); }
  };

  // ── Google Login ────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result?.redirecting) {
        // Redirect in progress — page will navigate away and come back
        // Keep loading state; don't reset it.
        return;
      }
      if (result?.isNew) {
        setNewSocialUser(result.user);
      }
    } catch (err) {
      console.error("Google sign-in error:", err.code, err.message, err);
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        // User dismissed — silent
      } else if (err.code === "auth/unauthorized-domain") {
        setError("Domain not authorized. Add this domain in Firebase Console → Authentication → Authorized Domains.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Google sign-in not enabled. Go to Firebase Console → Authentication → Sign-in method → Enable Google.");
      } else if (err.code === "auth/internal-error") {
        setError("Firebase internal error — check that Google is enabled as a Sign-in provider in Firebase Console.");
      } else {
        setError(`Google sign-in failed [${err.code || "unknown"}]: ${err.message || "Please try again."}`);
      }
    } finally { setLoading(false); }
  };

  // ── Phone: Send OTP ─────────────────────────────────────
  const handleSendOTP = async () => {
    if (!phoneNum.trim() || phoneNum.replace(/\D/g, "").length < 10) {
      setError("Enter a valid 10-digit phone number."); return;
    }
    setError(""); setLoading(true);
    try {
      const c = await sendPhoneOTP(phoneNum, "recaptcha-container");
      setConfirmation(c);
      setPhoneStep(2);
      toast.success("OTP sent! Check your phone.");
    } catch (err) {
      setError(
        err.code === "auth/invalid-phone-number"   ? "Invalid phone number." :
        err.code === "auth/too-many-requests"       ? "Too many attempts. Try later." :
        err.code === "auth/captcha-check-failed"    ? "reCAPTCHA failed. Please retry." :
        "Failed to send OTP. Please try again."
      );
    } finally { setLoading(false); }
  };

  // ── Phone: Verify OTP ────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length < 4) { setError("Enter the OTP."); return; }
    setError(""); setLoading(true);
    try {
      const result = await verifyPhoneOTP(confirmation, otp);
      if (result.isNew) {
        setNewSocialUser(result.user);
      } else {
        toast.success("Welcome back!");
      }
    } catch (err) {
      setError(
        err.code === "auth/invalid-verification-code" ? "Incorrect OTP. Please try again." :
        err.code === "auth/code-expired"               ? "OTP expired. Please request again." :
        "Verification failed."
      );
    } finally { setLoading(false); }
  };

  // ── Email Register ───────────────────────────────────────────────────
  const handleRegister = async () => {
    setError(""); setLoading(true);
    try {
      if (regRole === "admin" || regRole === "tutor") {
        const role = regRole;
        if (role === "admin" && (!form.coachingName || !form.city)) {
          setError("Institute name and city are required."); setLoading(false); return;
        }
        const user = await register(form.email, form.password, form.name, role, { coachingId: null });
        if (role === "admin") {
          const coachingId = await createCoaching({
            name:     form.coachingName,
            city:     form.city,
            state:    form.state,
            address:  form.address,
            pincode:  form.pincode,
            subject:  form.subject,
            phone:    form.phone,
            whatsapp: form.phone,
            yearsExp: form.yearsExp ? Number(form.yearsExp) : 0,
            adminId:  user.uid,
          });
          await updateUserProfile(user.uid, { coachingId });
        } else if (role === "tutor") {
          // Save initial subject + teachesWhom to user profile
          if (form.subject || form.teachesWhom) {
            await updateUserProfile(user.uid, {
              subject:     form.subject.trim(),
              teachesWhom: form.teachesWhom?.trim() || "",
            });
          }
        }
        await refreshProfile();
        toast.success(role === "admin" ? "Institute registered! Welcome." : "Account created! Set up your tutor profile.");
      } else {
        if (step === 1) {
          if (!form.name || !form.email || !form.password) {
            setError("Please fill all fields."); setLoading(false); return;
          }
          setStep(2); setLoading(false); return;
        }
        if (!selectedCoaching) {
          // Student skips coaching — register as independent
          await register(form.email, form.password, form.name, "student", {
            coachingId: null, coachingIds: [], status: "independent",
          });
          toast.success("Account created! You can join a coaching anytime from your profile.");
        } else {
          const user = await register(form.email, form.password, form.name, "student", {
            requestedCoachingId: selectedCoaching.id, coachingId: null, coachingIds: [], status: "pending",
          });
          await createJoinRequest(selectedCoaching.id, {
            studentId: user.uid, studentName: form.name, studentEmail: form.email,
          });
          toast.success("Join request sent! Awaiting approval.");
        }
      }
    } catch (err) {
      setError(
        err.code === "auth/email-already-in-use" ? "This email is already registered." :
        err.code === "auth/weak-password"         ? "Password must be at least 6 characters." :
        err.code === "auth/invalid-email"         ? "Invalid email address." :
        err.message || "Registration failed."
      );
    } finally { setLoading(false); }
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <>
      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container" />

      {/* Social user setup overlay */}
      {newSocialUser && (
        <SocialProfileSetup
          firebaseUser={newSocialUser}
          preSelectedCoaching={preSelectedCoaching}
          onComplete={() => setNewSocialUser(null)}
          onCancel={async () => {
            await logout();
            setNewSocialUser(null);
          }}
        />
      )}

      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "transparent", padding: 20,
      }}>
        <div style={{ width: "100%", maxWidth: 500 }}>

          {/* Brand + back to home */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            {onGoHome && (
              <button
                onClick={onGoHome}
                style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 12, marginBottom: 12 }}
              >
                ← Back to Home
              </button>
            )}
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 40, fontWeight: 800, color: "var(--accent2)" }}>
              Mentoria360
              </h1>
            <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 4 }}>
              Coaching &amp; Tutor Discovery Platform
            </p>
          </div>

          {/* Card */}
          <div className="card" style={{ borderRadius: "var(--radius-lg)", padding: "32px 36px" }}>
            {/* Tabs */}
            <div className="tab-bar">
              <button className={`tab${tab === "login"    ? " active" : ""}`} onClick={() => switchTab("login")}>Sign In</button>
              <button className={`tab${tab === "register" ? " active" : ""}`} onClick={() => switchTab("register")}>Register</button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* ── SIGN IN ──────────────────────────────────── */}
            {tab === "login" && (
              <>
                {/* Google */}
                <button
                  className="btn btn-secondary btn-full"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontWeight: 500 }}
                >
                  <GoogleIcon /> Continue with Google
                </button>

                <OrDivider />

                {/* Login mode toggle */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <button
                    className={`btn btn-sm ${loginMode === "email" ? "btn-primary" : "btn-secondary"}`}
                    style={{ flex: 1 }} onClick={() => { setLoginMode("email"); setError(""); }}
                  >
                    📧 Email
                  </button>
                  <button
                    className={`btn btn-sm ${loginMode === "phone" ? "btn-primary" : "btn-secondary"}`}
                    style={{ flex: 1 }} onClick={() => { setLoginMode("phone"); setError(""); setPhoneStep(1); }}
                  >
                    📱 Phone
                  </button>
                </div>

                {/* Forgot password */}
                {forgotPw ? (
                  <>
                    <div style={{ textAlign: "center", marginBottom: 14 }}>
                      <div style={{ fontSize: 32 }}>🔑</div>
                      <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 6 }}>
                        We'll send a reset link to your email.
                      </p>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input type="email" placeholder="your@email.com" value={resetEmail || form.email} onChange={e => setResetEmail(e.target.value)} />
                    </div>
                    <button className="btn btn-primary btn-full" onClick={handleForgotPassword} disabled={resetting}>
                      {resetting ? <span className="spinner" /> : "Send Reset Email"}
                    </button>
                    <button className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={() => { setForgotPw(false); setError(""); }}>
                      ← Back to Sign In
                    </button>
                  </>
                ) : loginMode === "email" ? (
                  <form onSubmit={e => { e.preventDefault(); handleLogin(); }} autoComplete="off">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" placeholder="your@email.com" value={form.email} onChange={set("email")} autoComplete="username" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input type="password" placeholder="••••••••" value={form.password} onChange={set("password")} autoComplete="current-password" />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                      {loading ? <span className="spinner" /> : "Sign In"}
                    </button>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, cursor: "pointer", marginTop: 12, width: "100%", textAlign: "center" }}
                      onClick={() => { setForgotPw(true); setError(""); }}
                    >
                      Forgot password?
                    </button>
                  </form>
                ) : (
                  /* Phone login */
                  <>
                    {phoneStep === 1 ? (
                      <>
                        <div className="form-group">
                          <label className="form-label">Phone Number</label>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{
                              padding: "10px 12px", background: "var(--bg3)", border: "1px solid var(--border)",
                              borderRadius: 8, fontSize: 13, color: "var(--text2)", flexShrink: 0,
                            }}>
                              🇮🇳 +91
                            </span>
                            <input
                              type="tel" placeholder="9876543210" value={phoneNum}
                              onChange={e => setPhoneNum(e.target.value.replace(/\D/g, "").slice(0, 10))}
                              maxLength={10}
                              onKeyDown={e => e.key === "Enter" && handleSendOTP()}
                              style={{ flex: 1 }}
                            />
                          </div>
                        </div>
                        <button className="btn btn-primary btn-full btn-lg" onClick={handleSendOTP} disabled={loading || phoneNum.length < 10}>
                          {loading ? <span className="spinner" /> : "Send OTP →"}
                        </button>
                        <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginTop: 10 }}>
                          A 6-digit OTP will be sent via SMS
                        </p>
                      </>
                    ) : (
                      <>
                        <div style={{ textAlign: "center", marginBottom: 14 }}>
                          <div style={{ fontSize: 28 }}>💬</div>
                          <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 6 }}>
                            OTP sent to <strong>+91 {phoneNum}</strong>
                          </p>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Enter OTP</label>
                          <input
                            type="text" placeholder="6-digit OTP"
                            value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            maxLength={6} style={{ letterSpacing: "0.3em", fontSize: 20, textAlign: "center" }}
                            onKeyDown={e => e.key === "Enter" && handleVerifyOTP()}
                          />
                        </div>
                        <button className="btn btn-primary btn-full btn-lg" onClick={handleVerifyOTP} disabled={loading || otp.length < 4}>
                          {loading ? <span className="spinner" /> : "Verify OTP →"}
                        </button>
                        <button
                          className="btn btn-secondary btn-full"
                          style={{ marginTop: 8 }}
                          onClick={() => { setPhoneStep(1); setOtp(""); setError(""); }}
                        >
                          ← Change Number
                        </button>
                        <button
                          style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, cursor: "pointer", marginTop: 10, width: "100%", textAlign: "center" }}
                          onClick={handleSendOTP}
                        >
                          Resend OTP
                        </button>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── REGISTER ─────────────────────────────────── */}
            {tab === "register" && (
              <>
                {/* Google sign up */}
                <button
                  className="btn btn-secondary btn-full"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontWeight: 500 }}
                >
                  <GoogleIcon /> Sign up with Google
                </button>

                <OrDivider />

                {/* Role */}
                <div className="tab-bar">
                  <button className={`tab${regRole === "student" ? " active" : ""}`} onClick={() => { setRegRole("student"); setStep(1); setError(""); }}>Student</button>
                  <button className={`tab${regRole === "admin"   ? " active" : ""}`} onClick={() => { setRegRole("admin");   setStep(1); setError(""); }}>Coaching Admin</button>
                  <button className={`tab${regRole === "tutor"   ? " active" : ""}`} onClick={() => { setRegRole("tutor");   setStep(1); setError(""); }}>Tutor</button>
                </div>

                {/* Admin form */}
                {regRole === "admin" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input placeholder="Your name" value={form.name} onChange={set("name")} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" placeholder="admin@coaching.com" value={form.email} onChange={set("email")} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input type="password" placeholder="Min. 6 characters" value={form.password} onChange={set("password")} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Institute Details</div>
                    <div className="form-group">
                      <label className="form-label">Institute Name *</label>
                      <input placeholder="e.g. Brilliant Minds Institute" value={form.coachingName} onChange={set("coachingName")} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Full Address</label>
                      <input placeholder="Street, Area, Landmark" value={form.address} onChange={set("address")} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div className="form-group">
                        <label className="form-label">City *</label>
                        <input placeholder="Delhi" value={form.city} onChange={set("city")} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <input placeholder="Delhi" value={form.state} onChange={set("state")} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div className="form-group">
                        <label className="form-label">Pincode</label>
                        <input placeholder="110001" value={form.pincode} onChange={set("pincode")} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Years of Experience</label>
                        <input type="number" placeholder="e.g. 10" value={form.yearsExp} onChange={set("yearsExp")} min={0} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div className="form-group">
                        <label className="form-label">Subject Focus</label>
                        <input placeholder="IIT-JEE / NEET" value={form.subject} onChange={set("subject")} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">WhatsApp / Phone</label>
                        <input placeholder="9876543210" value={form.phone} onChange={set("phone")} />
                      </div>
                    </div>
                    <button className="btn btn-primary btn-full" onClick={handleRegister} disabled={loading}>
                      {loading ? <span className="spinner" /> : "Register Institute →"}
                    </button>
                  </>
                )}

                {/* Tutor form */}
                {regRole === "tutor" && (
                  <>
                    <div className="alert alert-info" style={{ fontSize: 12 }}>
                      👨‍🏫 You'll register a standard account and then complete your tutor profile from the dashboard.
                    </div>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input placeholder="Your name" value={form.name} onChange={set("name")} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" placeholder="you@email.com" value={form.email} onChange={set("email")} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input type="password" placeholder="Min. 6 characters" value={form.password} onChange={set("password")} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input placeholder="9876543210" value={form.phone} onChange={set("phone")} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input placeholder="Delhi" value={form.city} onChange={set("city")} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subjects You Teach</label>
                      <input placeholder="e.g. Mathematics, Physics" value={form.subject} onChange={set("subject")} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teaches Whom (free-text)</label>
                      <input
                        placeholder="e.g. Class 10, IIT-JEE aspirants, College students"
                        value={form.teachesWhom || ""}
                        onChange={set("teachesWhom")}
                      />
                      {/* Quick-pick chips */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {["Class 9 & 10","Class 11 & 12","College Students","IIT-JEE","NEET","UPSC","Competitive Exams","Beginners"].map(chip => (
                          <button
                            key={chip}
                            type="button"
                            className="btn btn-sm btn-secondary"
                            style={{ fontSize: 10, padding: "3px 10px" }}
                            onClick={() => {
                              const parts = (form.teachesWhom || "").split(",").map(x => x.trim()).filter(Boolean);
                              if (!parts.includes(chip)) set("teachesWhom")({ target: { value: [...parts, chip].join(", ") } });
                            }}
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button className="btn btn-primary btn-full" onClick={handleRegister} disabled={loading}>
                      {loading ? <span className="spinner" /> : "Create Tutor Account →"}
                    </button>
                  </>
                )}

                {/* Student step 1 */}
                {regRole === "student" && step === 1 && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input placeholder="Your name" value={form.name} onChange={set("name")} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" placeholder="you@email.com" value={form.email} onChange={set("email")} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input type="password" placeholder="Min. 6 characters" value={form.password} onChange={set("password")} />
                    </div>
                    <button className="btn btn-primary btn-full" onClick={handleRegister} disabled={loading}>
                      {loading ? <span className="spinner" /> : "Next: Select Coaching →"}
                    </button>
                  </>
                )}

                {/* Student step 2 — optional coaching selection */}
                {regRole === "student" && step === 2 && (
                  <>
                    <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
                      Search and select a coaching institute to join:
                    </p>

                    {/* Pre-selected from landing or search */}
                    {selectedCoaching ? (
                      <div style={{
                        padding: "12px 14px", background: "var(--accent-bg)", border: "1px solid var(--accent)",
                        borderRadius: 8, marginBottom: 12,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{selectedCoaching.name}</div>
                            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                              📍 {selectedCoaching.city} · 📚 {selectedCoaching.subject}
                            </div>
                          </div>
                          <button onClick={() => setSelectedCoaching(null)} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 16 }}>×</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="search-wrap" style={{ marginBottom: 10 }}>
                          <span className="search-icon">🔍</span>
                          <input placeholder="Search by name, city, or subject..." value={searchQ} onChange={e => handleSearch(e.target.value)} />
                        </div>
                        <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                          {searching && <div style={{ textAlign: "center", padding: 16 }}><span className="spinner" /></div>}
                          {!searching && coachingResults.map(c => (
                            <div key={c.id} onClick={() => setSelectedCoaching(c)} style={{
                              padding: "10px 14px", background: "var(--bg3)",
                              border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer",
                              transition: "all 0.15s",
                            }}>
                              <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>📍 {c.city} · 📚 {c.subject}</div>
                            </div>
                          ))}
                          {!searching && searchQ && coachingResults.length === 0 && (
                            <div style={{ textAlign: "center", padding: 16, color: "var(--text3)", fontSize: 13 }}>
                              No institutes found for "{searchQ}"
                            </div>
                          )}
                          {!searchQ && <div style={{ textAlign: "center", padding: 16, color: "var(--text3)", fontSize: 13 }}>Type to search...</div>}
                        </div>
                      </>
                    )}

                    {selectedCoaching && (
                      <div className="alert alert-info" style={{ fontSize: 12 }}>
                        Your join request will be reviewed by the admin.
                      </div>
                    )}

                    <button className="btn btn-primary btn-full" onClick={handleRegister} disabled={loading}>
                      {loading ? <span className="spinner" /> : selectedCoaching ? "Send Join Request →" : "Skip — Join Later →"}
                    </button>
                    {selectedCoaching && (
                      <button
                        className="btn btn-secondary btn-full"
                        style={{ marginTop: 8, fontSize: 12 }}
                        onClick={() => { setSelectedCoaching(null); handleRegister(); }}
                        disabled={loading}
                      >
                        Skip — I'll join a coaching later
                      </button>
                    )}
                    <button className="btn btn-secondary btn-full" style={{ marginTop: 8, fontSize: 13 }} onClick={() => { setStep(1); setError(""); }}>
                      ← Back
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

