"use client";
// src/components/shared/FeeReceipt.jsx
// ============================================================
// Generates and downloads a PDF fee receipt using jsPDF.
// No external HTML canvas needed – builds receipt programmatically.
// ============================================================

import React from "react";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";

export default function FeeReceipt({ fee, coachingName, coachingCity, onClose }) {
  const receiptNo = `EP-${fee.id?.slice(-8).toUpperCase() || "000000"}`;

  const downloadPDF = () => {
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210;
      const accent = [99, 102, 241]; // indigo

      // ── Header bar ──
      doc.setFillColor(...accent);
      doc.rect(0, 0, pageW, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.text("Mentorria360", 15, 22);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Coaching Institute Management Platform", 15, 30);
      doc.text("FEE RECEIPT", pageW - 15, 22, { align: "right" });
      doc.text(`Receipt No: ${receiptNo}`, pageW - 15, 30, { align: "right" });

      // ── Institute info ──
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(coachingName || "—", 15, 55);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(coachingCity || "", 15, 62);

      // ── Divider ──
      doc.setDrawColor(220, 220, 230);
      doc.setLineWidth(0.5);
      doc.line(15, 67, pageW - 15, 67);

      // ── Student & Payment Details Block ──
      const col1 = 15, col2 = 115;
      let y = 78;
      const field = (label, value, x, yPos) => {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(130, 130, 150);
        doc.text(label.toUpperCase(), x, yPos);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 40);
        doc.text(String(value || "—"), x, yPos + 6);
      };

      field("Student Name", fee.studentName, col1, y);
      field("Receipt Date", fee.paidAt
        ? new Date(fee.paidAt.seconds * 1000).toLocaleDateString("en-IN")
        : fee.date || new Date().toLocaleDateString("en-IN"), col2, y);

      y += 20;
      field("Fee Month", fee.month, col1, y);
      field("Payment Status", fee.status?.toUpperCase(), col2, y);

      // ── Amount Table ──
      y += 24;
      doc.setFillColor(245, 245, 255);
      doc.roundedRect(15, y, pageW - 30, 40, 4, 4, "F");
      doc.setDrawColor(...accent);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, y, pageW - 30, 40, 4, 4, "S");

      // Table header
      const tableY = y + 8;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...accent);
      doc.text("DESCRIPTION", 25, tableY);
      doc.text("TOTAL AMOUNT", 100, tableY);
      doc.text("AMOUNT PAID", 145, tableY);
      doc.text("BALANCE DUE", 182, tableY, { align: "right" });

      doc.setDrawColor(200, 200, 220);
      doc.line(25, tableY + 3, pageW - 25, tableY + 3);

      // Table row
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 40);
      const rowY = tableY + 12;
      doc.text(`Tuition Fee – ${fee.month}`, 25, rowY);
      doc.text(`₹${(fee.amount || 0).toLocaleString("en-IN")}`, 100, rowY);
      doc.setTextColor(22, 163, 74);
      doc.text(`₹${(fee.paid || 0).toLocaleString("en-IN")}`, 145, rowY);
      doc.setTextColor(fee.due > 0 ? 220 : 22, fee.due > 0 ? 38 : 163, fee.due > 0 ? 38 : 74);
      doc.text(`₹${(fee.due || 0).toLocaleString("en-IN")}`, 182, rowY, { align: "right" });

      // ── Total box ──
      y += 55;
      doc.setFillColor(...accent);
      doc.roundedRect(pageW - 80, y, 65, 20, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("TOTAL PAID", pageW - 15, y + 7, { align: "right" });
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`₹${(fee.paid || 0).toLocaleString("en-IN")}`, pageW - 15, y + 16, { align: "right" });

      // ── Status stamp ──
      if (fee.status === "paid") {
        doc.setTextColor(22, 163, 74);
        doc.setFontSize(32);
        doc.setFont("helvetica", "bold");
        doc.setGState(doc.GState({ opacity: 0.15 }));
        doc.text("PAID", 30, y + 18);
        doc.setGState(doc.GState({ opacity: 1 }));
      }

      // ── Footer ──
      y += 35;
      doc.setDrawColor(220, 220, 230);
      doc.line(15, y, pageW - 15, y);
      y += 8;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 160);
      doc.text("This is a computer-generated receipt and does not require a physical signature.", pageW / 2, y, { align: "center" });
      doc.text(`Generated by Mentorria360 · ${new Date().toLocaleString("en-IN")}`, pageW / 2, y + 6, { align: "center" });

      doc.save(`Mentorria360_Receipt_${receiptNo}.pdf`);
      toast.success("Receipt downloaded!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate receipt.");
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal fee-receipt-panel card fade-in" style={{
        maxWidth: 480, padding: 0, overflow: "hidden",
        boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: "var(--accent)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: "Syne, sans-serif" }}>Mentorria360</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2 }}>FEE RECEIPT</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 12 }}>{receiptNo}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, marginTop: 2 }}>
              {new Date().toLocaleDateString("en-IN")}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{coachingName}</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{coachingCity}</div>
          </div>

          <div className="form-grid-2" style={{ marginBottom: 20 }}>
            {[
              ["Student", fee.studentName],
              ["Month", fee.month],
              ["Date", fee.date || new Date().toLocaleDateString("en-IN")],
              ["Status", fee.status?.toUpperCase()],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{val || "—"}</div>
              </div>
            ))}
          </div>

          {/* Amount table */}
          <div style={{ background: "var(--bg3)", borderRadius: 10, overflow: "hidden", marginBottom: 20, border: "1px solid var(--border)" }}>
            <div className="fee-receipt-amounts" style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <span>Total</span><span>Paid</span><span>Due</span>
            </div>
            <div className="fee-receipt-amounts" style={{ padding: "12px 14px", fontSize: 15, fontWeight: 700 }}>
              <span>₹{(fee.amount || 0).toLocaleString("en-IN")}</span>
              <span style={{ color: "var(--green)" }}>₹{(fee.paid || 0).toLocaleString("en-IN")}</span>
              <span style={{ color: fee.due > 0 ? "var(--red)" : "var(--green)" }}>
                ₹{(fee.due || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="fee-receipt-actions">
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={downloadPDF}>
              ⬇️ Download PDF
            </button>
            <button className="btn btn-secondary" onClick={() => window.print()}>🖨️ Print</button>
            <button className="btn btn-secondary" onClick={onClose}>✕ Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

