"use client";
// src/components/student/StudentFees.jsx
// ============================================================
// Student views their fee records and can pay dues online
// using Razorpay (or UPI/bank details if keys not yet set).
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useStudentCoaching } from "../../contexts/StudentCoachingContext";
import {
  getStudentFees, getCoaching, markFeePaid, recordPartialPayment,
} from "../../services/firestoreService";
import { formatCurrency, computeFeeStats } from "../../utils/helpers";
import FeeReceipt from "../shared/FeeReceipt";
import toast from "react-hot-toast";

// ── Razorpay Key (set in .env as REACT_APP_RAZORPAY_KEY) ─────
const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY || "";

// ── Load Razorpay SDK dynamically ────────────────────────────
function loadRazorpaySDK() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src  = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Payment Modal (shown when Razorpay key not set) ──────────
function ManualPayModal({ fee, coaching, profile, onClose, onPaid }) {
  const [amount, setAmount] = useState(fee.due || 0);
  const [method, setMethod] = useState("upi");
  const [paying, setPaying] = useState(false);
  const [done,   setDone]   = useState(false);

  const upiId = coaching?.upiId || coaching?.phone ? `${(coaching.phone || "").replace(/\D/g,"")}@upi` : null;

  const handleMarkPaid = async () => {
    if (!amount || amount <= 0) { toast.error("Enter a valid amount."); return; }
    setPaying(true);
    try {
      const cid = fee.coachingId || profile.coachingId;
      if (amount >= fee.due) {
        await markFeePaid(cid, fee.id, {
          studentId:   profile.uid,
          studentName: profile.name,
          amount:      fee.amount,
          month:       fee.month,
        });
      } else {
        await recordPartialPayment(cid, fee.id, (fee.paid || 0) + Number(amount), fee.amount);
      }
      setDone(true);
      toast.success("Payment recorded! Admin will confirm shortly.");
      setTimeout(() => { onPaid(); onClose(); }, 1500);
    } catch { toast.error("Failed to record payment."); }
    finally { setPaying(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div className="card" style={{ width: "100%", maxWidth: 440, padding: 28, borderRadius: "var(--radius-lg)" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <h3 style={{ marginTop: 12 }}>Payment Recorded!</h3>
            <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 6 }}>
              Admin will confirm your payment shortly.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18 }}>Pay Fees</h3>
                <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                  {fee.month} — Due: <strong style={{ color: "var(--amber)" }}>{formatCurrency(fee.due)}</strong>
                </p>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 20 }}>×</button>
            </div>

            {/* Payment method tabs */}
            <div className="tab-bar" style={{ marginBottom: 16 }}>
              {[
                { key: "upi",        label: "UPI" },
                { key: "bank",       label: "Bank Transfer" },
                { key: "cash",       label: " Cash" },
              ].map(m => (
                <button key={m.key} className={`tab${method === m.key ? " active" : ""}`} onClick={() => setMethod(m.key)}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* UPI */}
            {method === "upi" && (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{
                  width: 120, height: 120, margin: "0 auto 12px",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, color: "var(--text-secondary)",
                }}>
                  UPI
                </div>
                {upiId ? (
                  <>
                    <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>Send payment to UPI ID:</p>
                    <div style={{
                      background: "var(--bg3)", border: "1px solid var(--border)",
                      borderRadius: 8, padding: "10px 16px", fontFamily: "monospace",
                      fontSize: 15, fontWeight: 700, color: "var(--accent2)", marginBottom: 12,
                    }}>
                      {upiId}
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
                    Contact your institute admin for the UPI ID.
                  </p>
                )}
                <p style={{ fontSize: 12, color: "var(--text3)" }}>
                  After paying, click "I've Paid" below so admin can verify.
                </p>
              </div>
            )}

            {/* Bank Transfer */}
            {method === "bank" && (
              <div style={{ padding: "8px 0" }}>
                <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12, textAlign: "center" }}>
                  Transfer to the institute's bank account:
                </p>
                {coaching?.bankAccount ? (
                  <div style={{ background: "var(--bg3)", borderRadius: 10, padding: 16, fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ color: "var(--text3)" }}>Account Name</span>
                      <span style={{ fontWeight: 600 }}>{coaching.bankAccount.name || coaching.name}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ color: "var(--text3)" }}>Account No.</span>
                      <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{coaching.bankAccount.number || "—"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                      <span style={{ color: "var(--text3)" }}>IFSC Code</span>
                      <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{coaching.bankAccount.ifsc || "—"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-warning" style={{ fontSize: 12 }}>
                    Bank details not configured. Contact your institute admin.
                  </div>
                )}
              </div>
            )}

            {/* Cash */}
            {method === "cash" && (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <p style={{ fontSize: 13, color: "var(--text2)" }}>
                  Pay <strong>{formatCurrency(fee.due)}</strong> in cash at the institute office.
                </p>
                <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 8 }}>
                  After paying, click "I've Paid" so it gets recorded.
                </p>
              </div>
            )}

            {/* Amount + submit */}
            <div style={{ marginTop: 16 }}>
              <div className="form-group">
                <label className="form-label">Amount Paying (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  min={1} max={fee.due}
                  style={{ fontSize: 18, fontWeight: 700, textAlign: "center" }}
                />
              </div>
              {amount < fee.due && amount > 0 && (
                <p style={{ fontSize: 11, color: "var(--amber)", marginBottom: 10 }}>
                  Partial payment — remaining {formatCurrency(fee.due - amount)} will still be due.
                </p>
              )}
              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleMarkPaid}
                disabled={paying || !amount || amount <= 0}
              >
                {paying ? <span className="spinner" /> : `✓ I've Paid ${formatCurrency(amount)}`}
              </button>
              <button className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Razorpay Payment ─────────────────────────────────────────
async function startRazorpayPayment({ fee, coaching, profile, onSuccess }) {
  const loaded = await loadRazorpaySDK();
  if (!loaded) {
    toast.error("Failed to load Razorpay. Check your internet connection.");
    return;
  }

  const options = {
    key:         RAZORPAY_KEY,
    amount:      (fee.due || 0) * 100,  // paise
    currency:    "INR",
    name:        coaching?.name || "Mentorria360 Fee",
    description: `${fee.month} Fee Payment`,
    image:       "",
    prefill: {
      name:    profile.name  || "",
      email:   profile.email || "",
      contact: profile.phone || "",
    },
    notes: {
      studentId:  profile.uid,
      feeId:      fee.id,
      coachingId: activeCoachingId,
      month:      fee.month,
    },
    theme: { color: "#6366f1" },
    modal: { confirm_close: true },
    handler: async (response) => {
      try {
        await markFeePaid(activeCoachingId, fee.id, {
          studentId:   profile.uid,
          studentName: profile.name,
          amount:      fee.amount,
          month:       fee.month,
          paymentId:   response.razorpay_payment_id,
        });
        toast.success(`Payment successful! ID: ${response.razorpay_payment_id}`);
        onSuccess();
      } catch {
        toast.error("Payment done but failed to update records. Contact admin.");
      }
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", (response) => {
    toast.error(`Payment failed: ${response.error.description}`);
  });
  rzp.open();
}

// ── Main Component ────────────────────────────────────────────
export default function StudentFees() {
  const { profile } = useAuth();
  const { activeCoachingId } = useStudentCoaching();
  const [fees,     setFees]    = useState([]);
  const [loading,  setLoading] = useState(true);
  const [receipt,  setReceipt] = useState(null);
  const [coaching, setCoaching] = useState(null);
  const [payFee,   setPayFee]  = useState(null);
  const [paying,   setPaying]  = useState(null);

  const load = () => {
    if (!activeCoachingId) { setLoading(false); return; }
    Promise.all([
      getStudentFees(activeCoachingId, profile.uid),
      getCoaching(activeCoachingId),
    ]).then(([f, c]) => { setFees(f); setCoaching(c); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [activeCoachingId]);

  const stats = computeFeeStats(fees);

  const handlePayOnline = async (fee) => {
    if (RAZORPAY_KEY) {
      // Use Razorpay
      setPaying(fee.id);
      await startRazorpayPayment({
        fee, coaching, profile,
        onSuccess: () => { setPaying(null); load(); },
      });
      setPaying(null);
    } else {
      // Show manual payment modal
      setPayFee(fee);
    }
  };

  const pendingFees = fees.filter(f => f.due > 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>My Fees</h2>
        <p>Payment history and online payment</p>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <span className="stat-label">Total Billed</span>
          <span className="stat-value" style={{ fontSize: 22 }}>{formatCurrency(stats.total)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Paid</span>
          <span className="stat-value" style={{ fontSize: 22, color: "var(--green)" }}>{formatCurrency(stats.paid)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Outstanding</span>
          <span className="stat-value" style={{ fontSize: 22, color: stats.due > 0 ? "var(--amber)" : "var(--green)" }}>
            {formatCurrency(stats.due)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Records</span>
          <span className="stat-value" style={{ fontSize: 22 }}>{fees.length}</span>
        </div>
      </div>

      {/* ── Pay Now banner (if there are pending dues) ─────── */}
      {!loading && pendingFees.length > 0 && (
        <div style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 8, padding: "16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, marginBottom: 20, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 3 }}>
              You have outstanding dues
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>
              {pendingFees.length} unpaid record{pendingFees.length > 1 ? "s" : ""} — total due:{" "}
              <strong style={{ color: "var(--amber)" }}>{formatCurrency(stats.due)}</strong>
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handlePayOnline(pendingFees[0])}
            disabled={paying === pendingFees[0]?.id}
            style={{ whiteSpace: "nowrap" }}
          >
            {paying === pendingFees[0]?.id ? <span className="spinner" /> : "Pay Now"}
          </button>
        </div>
      )}

      {/* Fee table */}
      <div className="card">
        {loading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

        {!loading && fees.length === 0 && (
          <div className="empty-state">
            <p>No fee records yet</p>
            <span style={{ fontSize: 12, color: "var(--text3)" }}>Your institute admin will add fee records here</span>
          </div>
        )}

        {!loading && fees.length > 0 && (
          <div className="table-wrap">
          <table className="table-mobile-cards">
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {fees.map(f => (
                <tr key={f.id}>
                  <td data-label="Month" style={{ fontWeight: 600 }}>{f.month} {f.year}</td>
                  <td data-label="Amount">{formatCurrency(f.amount)}</td>
                  <td data-label="Paid" style={{ color: "var(--green)", fontWeight: 600 }}>{formatCurrency(f.paid)}</td>
                  <td data-label="Due" style={{ color: f.due > 0 ? "var(--amber)" : "var(--text3)", fontWeight: f.due > 0 ? 700 : 400 }}>
                    {formatCurrency(f.due)}
                  </td>
                  <td data-label="Status">
                    <span className={`badge badge-${
                      f.status === "paid"    ? "approved" :
                      f.status === "partial" ? "pending"  : "rejected"
                    }`}>{f.status}</span>
                  </td>
                  <td data-label="Action" className="td-actions">
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {f.due > 0 && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handlePayOnline(f)}
                          disabled={paying === f.id}
                          style={{ fontSize: 11, fontWeight: 700 }}
                        >
                          {paying === f.id ? <span className="spinner" /> : "Pay"}
                        </button>
                      )}
                      {f.paid > 0 && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setReceipt(f)}
                          style={{ fontSize: 12 }}
                        >
                          🧾
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Payment history (paid records) */}
      {!loading && fees.filter(f => f.status === "paid").length > 0 && (
        <div style={{ marginTop: 20, padding: "16px 20px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>✅</span>
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--green)" }}>
              {fees.filter(f => f.status === "paid").length} payment{fees.filter(f => f.status === "paid").length > 1 ? "s" : ""} completed
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)" }}>
            Total paid: <strong style={{ color: "var(--green)" }}>{formatCurrency(stats.paid)}</strong>
          </div>
        </div>
      )}

      {/* Manual payment modal */}
      {payFee && (
        <ManualPayModal
          fee={payFee}
          coaching={coaching}
          profile={profile}
          onClose={() => setPayFee(null)}
          onPaid={load}
        />
      )}

      {/* Fee receipt */}
      {receipt && (
        <FeeReceipt
          fee={receipt}
          coachingName={coaching?.name}
          coachingCity={coaching?.city}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  );
}

