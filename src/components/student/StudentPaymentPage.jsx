"use client";
// src/components/student/StudentPaymentPage.jsx
// ============================================================
// Student views payment details for all their enrolled coachings.
// Prominently shows: "Write your name when doing payment"
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getPaymentMethods,
  getStudentCoachings,
} from "../../services/firestoreService";
import toast from "react-hot-toast";

const METHOD_ICONS = { upi: "💳", qr: "📷", bank: "🏦", paytm: "📱", other: "💰" };
const METHOD_LABELS = { upi: "UPI", qr: "QR Code", bank: "Bank Account", paytm: "Paytm", other: "Other" };

export default function StudentPaymentPage() {
  const { profile } = useAuth();
  const [coachings, setCoachings]       = useState([]);
  const [methodsMap, setMethodsMap]     = useState({});
  const [loading, setLoading]           = useState(true);
  const [selectedCoaching, setSelected] = useState(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const coached = await getStudentCoachings(profile);
        setCoachings(coached);
        if (coached.length > 0) setSelected(coached[0]);
      } catch {
        toast.error("Failed to load coachings.");
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  useEffect(() => {
    if (!selectedCoaching) return;
    (async () => {
      if (methodsMap[selectedCoaching.id]) return;
      try {
        const methods = await getPaymentMethods("coaching", selectedCoaching.id);
        setMethodsMap(m => ({ ...m, [selectedCoaching.id]: methods }));
      } catch {}
    })();
  }, [selectedCoaching]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  if (coachings.length === 0) return (
    <div className="fade-in">
      <div className="page-header">
        <h2>💳 Fee Payments</h2>
        <p>View payment details for your enrolled institutes</p>
      </div>
      <div className="card empty-state">
        <div className="emoji">🏫</div>
        <p>You are not enrolled in any coaching yet</p>
      </div>
    </div>
  );

  const currentMethods = selectedCoaching ? (methodsMap[selectedCoaching.id] || []) : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>💳 Fee Payment Details</h2>
        <p>Payment methods for your enrolled institutes</p>
      </div>

      {/* ── IMPORTANT NOTE ───────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
        border: "1px solid rgba(245,158,11,0.4)",
        borderRadius: "var(--radius)",
        padding: "16px 20px",
        marginBottom: 24,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--amber)", marginBottom: 4 }}>
            Important — Write Your Name When Paying!
          </div>
          <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6 }}>
            When making any payment via UPI, QR, or bank transfer, <strong style={{ color: "var(--text)" }}>always write your full name</strong> in the payment description / remarks field.
            This helps the institute confirm your payment quickly.
          </div>
        </div>
      </div>

      {/* Coaching selector (tabs if multiple) */}
      {coachings.length > 1 && (
        <div className="tab-bar" style={{ marginBottom: 20 }}>
          {coachings.map(c => (
            <button
              key={c.id}
              className={`tab${selectedCoaching?.id === c.id ? " active" : ""}`}
              onClick={() => setSelected(c)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Payment methods for selected coaching */}
      {selectedCoaching && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, color: "#fff",
            }}>
              {selectedCoaching.name?.[0] || "?"}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{selectedCoaching.name}</div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>{selectedCoaching.city}</div>
            </div>
          </div>

          {currentMethods.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
              <p style={{ color: "var(--text2)" }}>No payment methods added by this institute yet</p>
              <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>Contact your institute admin for payment details</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {currentMethods.map(m => (
                <div key={m.id} className="card" style={{ borderTop: "3px solid var(--accent)" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontSize: 24 }}>{METHOD_ICONS[m.type] || "💰"}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase" }}>
                        {METHOD_LABELS[m.type] || m.type}
                      </div>
                    </div>
                  </div>

                  {/* UPI */}
                  {m.upiId && (
                    <div style={{
                      background: "var(--bg3)", borderRadius: 8, padding: "10px 14px",
                      marginBottom: 10,
                    }}>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>UPI ID</div>
                      <div style={{ fontFamily: "monospace", fontSize: 14, color: "var(--accent2)", fontWeight: 600 }}>
                        {m.upiId}
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(m.upiId); toast.success("UPI ID copied!"); }}
                        style={{ marginTop: 8, background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: "var(--text2)" }}
                      >
                        📋 Copy
                      </button>
                    </div>
                  )}

                  {/* QR Code */}
                  {m.qrBase64 && (
                    <div style={{ textAlign: "center", marginBottom: 10 }}>
                      <img
                        src={m.qrBase64}
                        alt="Payment QR"
                        style={{ width: "100%", maxWidth: 200, borderRadius: 10, border: "1px solid var(--border)", background: "#fff", padding: 8 }}
                      />
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>Scan to pay</div>
                    </div>
                  )}

                  {/* Bank Details */}
                  {m.accountNo && (
                    <div style={{ background: "var(--bg3)", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                      {[
                        ["Account Holder", m.accountHolder],
                        ["Bank Name", m.bankName],
                        ["Account No.", m.accountNo],
                        ["IFSC", m.ifsc],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid var(--border)" }}>
                          <span style={{ color: "var(--text3)" }}>{label}</span>
                          <span style={{ fontWeight: 500 }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {m.note && (
                    <div style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic", padding: "6px 8px", background: "var(--bg4)", borderRadius: 6 }}>
                      {m.note}
                    </div>
                  )}

                  {/* Reminder */}
                  <div style={{
                    marginTop: 12,
                    padding: "8px 12px",
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: 6,
                    fontSize: 11,
                    color: "var(--amber)",
                    fontWeight: 500,
                  }}>
                    ✍️ Write your name when doing payment
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

