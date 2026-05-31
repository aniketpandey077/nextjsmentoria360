"use client";
// src/components/admin/AdminPaymentMethods.jsx
// ============================================================
// Admin / Tutor manages their payment methods.
// Supports: UPI ID, QR Code image, Bank Account, Paytm, etc.
// Students see a note: "Write your name when doing payment"
// ============================================================

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  addPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
} from "../../services/firestoreService";
import toast from "react-hot-toast";

const METHOD_TYPES = [
  { value: "upi",     label: "UPI ID",      icon: "💳" },
  { value: "qr",      label: "QR Code",     icon: "📷" },
  { value: "bank",    label: "Bank Account", icon: "🏦" },
  { value: "paytm",   label: "Paytm",       icon: "📱" },
  { value: "other",   label: "Other",        icon: "💰" },
];

export default function AdminPaymentMethods({ entityType = "coaching" }) {
  const { profile } = useAuth();
  const [methods, setMethods]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [form, setForm] = useState({
    type: "upi", label: "", upiId: "", bankName: "", accountNo: "", ifsc: "", accountHolder: "", note: "",
  });
  const [qrFile, setQrFile]     = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const fileRef = useRef(null);

  // entityId = coachingId for admin, uid for tutor
  const entityId = entityType === "tutor" ? profile?.uid : profile?.coachingId;

  const load = async (eid) => {
    const id = eid || entityId;
    if (!id) return;
    setLoading(true);
    try {
      setMethods(await getPaymentMethods(entityType, id));
    } catch {
      toast.error("Failed to load payment methods.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (entityId) load(entityId); }, [entityId]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const resetForm = () => {
    setForm({ type: "upi", label: "", upiId: "", bankName: "", accountNo: "", ifsc: "", accountHolder: "", note: "" });
    setQrFile(null);
    setQrPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleQrFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setQrFile(file);
    const reader = new FileReader();
    reader.onload = ev => setQrPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!entityId) { toast.error("Profile not ready. Please wait a moment."); return; }
    if (!form.label.trim()) { toast.error("Please enter a label."); return; }
    setSaving(true);
    try {
      const data = {
        type:  form.type,
        label: form.label.trim(),
        note:  form.note.trim(),
      };

      if (form.type === "upi" || form.type === "paytm") {
        if (!form.upiId.trim()) { toast.error("Enter UPI ID."); setSaving(false); return; }
        data.upiId = form.upiId.trim();
      } else if (form.type === "bank") {
        data.bankName       = form.bankName.trim();
        data.accountNo      = form.accountNo.trim();
        data.ifsc           = form.ifsc.trim();
        data.accountHolder  = form.accountHolder.trim();
      } else if (form.type === "qr") {
        if (!qrPreview) { toast.error("Upload a QR code image."); setSaving(false); return; }
        data.qrBase64 = qrPreview;
      }

      await addPaymentMethod(entityType, entityId, data);
      // ✅ Reload list FIRST before closing modal
      await load(entityId);
      setSaved(true);
      toast.success("Payment method saved!");
      setTimeout(() => {
        setSaved(false);
        setShowAdd(false);
        resetForm();
      }, 700);
    } catch (err) {
      console.error("Payment save error:", err);
      toast.error("Failed to save. Please try again.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this payment method?")) return;
    try {
      await deletePaymentMethod(entityType, entityId, id);
      toast.success("Removed.");
      await load();
    } catch { toast.error("Failed to remove."); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>💳 Payment Methods</h2>
        <p>Add how students can pay their fees — they will see a note to write their name</p>
      </div>

      {/* Info banner */}
      <div className="alert alert-info" style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 18 }}>ℹ️</span>
        <div>
          <strong>Student Note:</strong> When students view payment details, they will see:<br />
          <em style={{ color: "var(--text)" }}>"Write your name in the payment description/remarks so we can confirm your payment."</em>
        </div>
      </div>

      {/* Add button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add Payment Method
        </button>
      </div>

      {/* Add form modal */}
      {showAdd && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 500,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div className="card" style={{ width: "100%", maxWidth: 480, padding: 28, borderRadius: "var(--radius-lg)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 18 }}>Add Payment Method</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>

            {/* Type selector */}
            <div className="form-group">
              <label className="form-label">Type</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {METHOD_TYPES.map(m => (
                  <button key={m.value}
                    className={`btn btn-sm ${form.type === m.value ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setForm(f => ({ ...f, type: m.value }))}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Label (e.g. "Main UPI")</label>
              <input value={form.label} onChange={set("label")} placeholder="Label this method" />
            </div>

            {/* UPI / Paytm */}
            {(form.type === "upi" || form.type === "paytm") && (
              <div className="form-group">
                <label className="form-label">UPI ID</label>
                <input value={form.upiId} onChange={set("upiId")} placeholder="yourid@upi" />
              </div>
            )}

            {/* QR Code */}
            {form.type === "qr" && (
              <div className="form-group">
                <label className="form-label">QR Code Image</label>
                <input type="file" accept="image/*" ref={fileRef} onChange={handleQrFile} style={{ padding: 8 }} />
                {qrPreview && (
                  <img src={qrPreview} alt="QR Preview" style={{ width: "100%", maxWidth: 200, marginTop: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
                )}
              </div>
            )}

            {/* Bank */}
            {form.type === "bank" && (
              <>
                <div className="form-group">
                  <label className="form-label">Account Holder Name</label>
                  <input value={form.accountHolder} onChange={set("accountHolder")} placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input value={form.bankName} onChange={set("bankName")} placeholder="e.g. SBI" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Account Number</label>
                    <input value={form.accountNo} onChange={set("accountNo")} placeholder="1234567890" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Code</label>
                    <input value={form.ifsc} onChange={set("ifsc")} placeholder="SBIN0001234" />
                  </div>
                </div>
              </>
            )}

            {/* Note */}
            <div className="form-group">
              <label className="form-label">Extra Note (optional)</label>
              <input value={form.note} onChange={set("note")} placeholder="e.g. Only for monthly fee payments" />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1, background: saved ? "var(--green)" : undefined }} onClick={handleAdd} disabled={saving || saved}>
                {saving ? <span className="spinner" /> : saved ? "✓ Saved!" : "Save Method →"}
              </button>
              <button className="btn btn-secondary" onClick={() => { setShowAdd(false); resetForm(); }} disabled={saving}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Methods list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" style={{ width: 30, height: 30 }} /></div>
      ) : methods.length === 0 ? (
        <div className="card empty-state">
          <div className="emoji">💳</div>
          <p>No payment methods added yet</p>
          <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>Add UPI, QR code, or bank details for your students</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {methods.map(m => (
            <div key={m.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>
                    {METHOD_TYPES.find(t => t.value === m.type)?.icon || "💰"}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase" }}>
                      {METHOD_TYPES.find(t => t.value === m.type)?.label || m.type}
                    </div>
                  </div>
                </div>

                {m.upiId && (
                  <div style={{ fontSize: 13, color: "var(--accent2)", fontFamily: "monospace", marginBottom: 4 }}>
                    📲 {m.upiId}
                  </div>
                )}
                {m.accountNo && (
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 2 }}>
                    🏦 {m.bankName} · A/C: {m.accountNo} · IFSC: {m.ifsc}
                  </div>
                )}
                {m.accountHolder && (
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>Name: {m.accountHolder}</div>
                )}
                {m.qrBase64 && (
                  <img src={m.qrBase64} alt="QR" style={{ width: 120, height: 120, marginTop: 8, borderRadius: 8, border: "1px solid var(--border)", objectFit: "contain", background: "#fff" }} />
                )}
                {m.note && (
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6, fontStyle: "italic" }}>
                    Note: {m.note}
                  </div>
                )}
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

