"use client";
// src/components/admin/AdminFees.jsx
// ============================================================
// Add fee records, track payments, mark fees as paid.
// Now supports multi-select students + "Select All" for batch fee creation.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getCoachingFees, addFeeRecord, markFeePaid,
  getCoaching, getStudentProfiles,
} from "../../services/firestoreService";
import { formatCurrency, formatDate, computeFeeStats, exportToCSV } from "../../utils/helpers";
import Modal from "../shared/Modal";
import Icon from "../shared/Icon";
import FeeReceipt from "../shared/FeeReceipt";
import toast from "react-hot-toast";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS  = [2024, 2025, 2026];

export default function AdminFees() {
  const { profile } = useAuth();
  const [fees,     setFees]     = useState([]);
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [adding,   setAdding]   = useState(false);
  const [receipt,  setReceipt]  = useState(null);
  const [coaching, setCoachingInfo] = useState(null);

  // Multi-select form state
  const [selectedIds,    setSelectedIds]    = useState([]); // array of student IDs
  const [baseAmount,     setBaseAmount]     = useState("");  // shared amount field
  const [overrides,      setOverrides]      = useState({}); // { [studentId]: amount }
  const [month,          setMonth]          = useState("");
  const [year,           setYear]           = useState(String(new Date().getFullYear()));

  const load = async () => {
    const c  = await getCoaching(profile.coachingId);
    const s  = await getStudentProfiles(c?.students || []);
    const f  = await getCoachingFees(profile.coachingId);
    setStudents(s);
    setFees(f);
    setCoachingInfo(c);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // ── Multi-select helpers ─────────────────────────────────
  const allSelected = students.length > 0 && selectedIds.length === students.length;
  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      setOverrides({});
    } else {
      setSelectedIds(students.map(s => s.id));
    }
  };
  const toggleStudent = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    // Clear any override when deselecting
    if (selectedIds.includes(id)) {
      setOverrides(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  // When base amount changes, clear all per-student overrides
  const handleBaseAmountChange = (val) => {
    setBaseAmount(val);
    setOverrides({});
  };

  const handleOverride = (id, val) => {
    setOverrides(prev => ({ ...prev, [id]: val }));
  };

  const getStudentAmount = (id) => {
    return overrides[id] !== undefined ? overrides[id] : baseAmount;
  };

  const resetAddForm = () => {
    setSelectedIds([]);
    setBaseAmount("");
    setOverrides({});
    setMonth("");
    setYear(String(new Date().getFullYear()));
  };

  const handleAdd = async () => {
    if (selectedIds.length === 0) { toast.error("Select at least one student."); return; }
    if (!baseAmount && selectedIds.some(id => !overrides[id])) { toast.error("Enter fee amount."); return; }
    if (!month) { toast.error("Select a month."); return; }

    // Validate all amounts are positive numbers
    for (const id of selectedIds) {
      const amt = Number(getStudentAmount(id));
      if (!amt || amt <= 0) { toast.error(`Set a valid amount for ${students.find(s=>s.id===id)?.name}`); return; }
    }

    setAdding(true);
    try {
      const promises = selectedIds.map(id => {
        const student = students.find(s => s.id === id);
        const amount  = Number(getStudentAmount(id));
        return addFeeRecord(profile.coachingId, {
          studentId:   id,
          studentName: student?.name || "",
          amount,
          paid:   0,
          due:    amount,
          month:  `${month} ${year}`,
          status: "unpaid",
          date:   new Date().toISOString().slice(0, 10),
        });
      });
      await Promise.all(promises);
      toast.success(`Fee added for ${selectedIds.length} student${selectedIds.length > 1 ? "s" : ""}!`);
      setShowAdd(false);
      resetAddForm();
      load();
    } catch { toast.error("Failed to add fee records."); }
    finally { setAdding(false); }
  };

  const handleMarkPaid = async (fee) => {
    try {
      await markFeePaid(profile.coachingId, fee.id, fee);
      toast.success("Payment recorded!");
      load();
    } catch { toast.error("Failed to record payment."); }
  };

  const stats = computeFeeStats(fees);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Fees Management</h2>
        <p>Track all payments and outstanding dues</p>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <span className="stat-label">Total Billed</span>
          <span className="stat-value" style={{ fontSize: 22, color: "var(--text)" }}>{formatCurrency(stats.total)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Collected</span>
          <span className="stat-value" style={{ fontSize: 22, color: "var(--green)" }}>{formatCurrency(stats.paid)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Outstanding</span>
          <span className="stat-value" style={{ fontSize: 22, color: "var(--amber)" }}>{formatCurrency(stats.due)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Unpaid Records</span>
          <span className="stat-value" style={{ fontSize: 22, color: stats.unpaid > 0 ? "var(--red)" : "var(--green)" }}>{stats.unpaid}</span>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "var(--text2)" }}>{fees.length} fee records</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary btn-sm"
              onClick={() => exportToCSV(fees.map(f => ({ Student: f.studentName, Month: f.month, Amount: f.amount, Paid: f.paid, Due: f.due, Status: f.status })), "fees")}>
              <Icon name="download" size={12} /> Export
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => { resetAddForm(); setShowAdd(true); }}>
              <Icon name="plus" size={12} /> Add Fee
            </button>
          </div>
        </div>

        {loading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

        {!loading && fees.length === 0 && (
          <div className="empty-state"><div className="emoji">💰</div><p>No fee records yet</p></div>
        )}

        {!loading && fees.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Student</th>
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
                  <td style={{ fontWeight: 500 }}>{f.studentName}</td>
                  <td style={{ color: "var(--text2)" }}>{f.month}</td>
                  <td>{formatCurrency(f.amount)}</td>
                  <td style={{ color: "var(--green)" }}>{formatCurrency(f.paid)}</td>
                  <td style={{ color: f.due > 0 ? "var(--red)" : "var(--text3)" }}>{formatCurrency(f.due)}</td>
                  <td>
                    <span className={`badge badge-${
                      f.status === "paid" ? "approved" : f.status === "partial" ? "pending" : "rejected"
                    }`}>{f.status}</span>
                  </td>
                  <td>
                    {f.due > 0 && (
                      <button className="btn btn-success btn-sm" onClick={() => handleMarkPaid(f)}>
                        Mark Paid
                      </button>
                    )}
                    {f.paid > 0 && (
                      <button className="btn btn-secondary btn-sm" style={{ marginLeft: 6 }} onClick={() => setReceipt(f)}>
                        🧾 Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add Fee Modal ──────────────────────────────────────── */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); resetAddForm(); }} title="Add Fee Record">

        {/* Month + Year */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Month *</label>
            <select value={month} onChange={e => setMonth(e.target.value)}>
              <option value="">Select month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Year</label>
            <select value={year} onChange={e => setYear(e.target.value)}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Base Amount */}
        <div className="form-group">
          <label className="form-label">Fee Amount (₹) — applied to all selected</label>
          <input
            type="number"
            placeholder="e.g. 5000"
            value={baseAmount}
            onChange={e => handleBaseAmountChange(e.target.value)}
          />
        </div>

        {/* Student multi-select */}
        <div className="form-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              Select Students
              {selectedIds.length > 0 && (
                <span style={{ marginLeft: 8, fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>
                  {selectedIds.length} selected
                </span>
              )}
            </label>
            <button
              className={`btn btn-sm ${allSelected ? "btn-danger" : "btn-secondary"}`}
              style={{ fontSize: 11, padding: "4px 10px" }}
              onClick={toggleAll}
              type="button"
            >
              {allSelected ? "✕ Clear All" : "✓ Select All"}
            </button>
          </div>

          {students.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: "var(--text3)", fontSize: 13 }}>
              No students enrolled yet
            </div>
          ) : (
            <div style={{
              maxHeight: 260,
              overflowY: "auto",
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "var(--bg3)",
            }}>
              {students.map((s, i) => {
                const isSelected = selectedIds.includes(s.id);
                const hasOverride = overrides[s.id] !== undefined;
                return (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      borderBottom: i < students.length - 1 ? "1px solid var(--border)" : "none",
                      background: isSelected ? "rgba(108,99,255,0.08)" : "transparent",
                      transition: "background 0.15s",
                      cursor: "pointer",
                    }}
                    onClick={() => toggleStudent(s.id)}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${isSelected ? "var(--accent)" : "var(--border2)"}`,
                      background: isSelected ? "var(--accent)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}>
                      {isSelected && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
                    </div>

                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{s.name}</span>

                    {/* Per-student amount override */}
                    {isSelected && baseAmount && (
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <span style={{ fontSize: 11, color: "var(--text3)" }}>₹</span>
                        <input
                          type="number"
                          value={hasOverride ? overrides[s.id] : baseAmount}
                          onChange={e => handleOverride(s.id, e.target.value)}
                          style={{
                            width: 80, fontSize: 12, padding: "3px 8px",
                            border: `1px solid ${hasOverride ? "var(--amber)" : "var(--border)"}`,
                            borderRadius: 6,
                          }}
                          title="Override amount for this student"
                        />
                        {hasOverride && (
                          <button
                            type="button"
                            onClick={() => { const n={...overrides}; delete n[s.id]; setOverrides(n); }}
                            style={{ background:"none", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:11, padding:"0 2px" }}
                            title="Reset to base amount"
                          >↺</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedIds.length > 0 && baseAmount && (
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: "var(--accent-bg)", border: "1px solid var(--accent)",
            fontSize: 13, color: "var(--text)", marginBottom: 8,
          }}>
            💡 Adding fee of <strong>₹{baseAmount}</strong> for <strong>{selectedIds.length}</strong> student{selectedIds.length > 1 ? "s" : ""} for <strong>{month || "–"} {year}</strong>
            {Object.keys(overrides).length > 0 && (
              <span style={{ marginLeft: 6, color: "var(--amber)", fontSize: 11 }}>
                ({Object.keys(overrides).length} with custom amount)
              </span>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd} disabled={adding}>
            {adding ? <span className="spinner" /> : `Add${selectedIds.length > 1 ? ` (${selectedIds.length})` : ""} Record${selectedIds.length > 1 ? "s" : ""}`}
          </button>
          <button className="btn btn-secondary" onClick={() => { setShowAdd(false); resetAddForm(); }}>Cancel</button>
        </div>
      </Modal>

      {/* Fee Receipt Modal */}
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

