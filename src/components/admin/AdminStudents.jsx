"use client";
// src/components/admin/AdminStudents.jsx
// ============================================================
// Shows all enrolled students. Admin can view details or remove.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getCoaching, getStudentProfiles, removeStudent, addOfflineStudent } from "../../services/firestoreService";
import { getInitials, exportToCSV } from "../../utils/helpers";
import Icon from "../shared/Icon";
import toast from "react-hot-toast";

export default function AdminStudents() {
  const { profile } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", phone: "" });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const c = await getCoaching(profile.coachingId);
    if (!c) {
      setLoading(false);
      return;
    }
    const s = await getStudentProfiles(c.students || []);
    setStudents(s);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.name) return toast.error("Name is required");
    setAdding(true);
    try {
      await addOfflineStudent(profile.coachingId, {
        name: newStudent.name,
        email: newStudent.email || "",
        phone: newStudent.phone || "",
      });
      toast.success("Student added successfully.");
      setShowAddModal(false);
      setNewStudent({ name: "", email: "", phone: "" });
      load(); // refresh the list
    } catch (err) {
      console.error(err);
      toast.error("Failed to add student.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (student) => {
    if (!window.confirm(`Remove ${student.name} from the institute?`)) return;
    try {
      await removeStudent(profile.coachingId, student.id);
      setStudents(s => s.filter(x => x.id !== student.id));
      toast.success(`${student.name} removed.`);
    } catch { toast.error("Failed to remove student."); }
  };

  const filtered = students.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
               s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Students</h2>
        <p>{students.length} enrolled students</p>
      </div>

      <div className="card">
        <div className="page-toolbar">
          <div className="search-wrap" style={{ flex: 1, maxWidth: 300 }}>
            <span className="search-icon"><Icon name="search" size={14} /></span>
            <input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="page-toolbar-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => exportToCSV(students.map(s => ({ Name: s.name, Email: s.email, Status: s.isOffline ? "Offline" : "Enrolled" })), "students")}
            >
              <Icon name="download" size={12} /> Export CSV
            </button>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => setShowAddModal(true)}
            >
              <Icon name="plus" size={12} /> Add Student
            </button>
          </div>
        </div>

        {loading && <div style={{ textAlign: "center", padding: 40 }}><span className="spinner" /></div>}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <p>{search ? "No students match your search" : "No students enrolled yet"}</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="table-wrap">
          <table className="table-mobile-cards">
            <thead>
              <tr>
                <th>Student</th>
                <th className="hide-mobile">Email</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td data-label="Student">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar">{getInitials(s.name)}</div>
                      <span style={{ fontWeight: 500 }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="hide-mobile" data-label="Email" style={{ color: "var(--text2)" }}>{s.email}</td>
                  <td data-label="Status">
                    {s.isOffline ? (
                      <span className="badge" style={{ background: "#475569", color: "#fff" }}>Offline</span>
                    ) : (
                      <span className="badge badge-approved">Enrolled</span>
                    )}
                  </td>
                  <td data-label="Action" className="td-actions">
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemove(s)}>
                      <Icon name="trash" size={12} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal card slide-up" onClick={e => e.stopPropagation()}>
            <h3>Add Student Manually</h3>
            <p style={{ color: "var(--text2)", marginBottom: 16 }}>
              Add a student who hasn't registered yet. You can manage their fees and attendance seamlessly.
            </p>
            <form onSubmit={handleAddStudent}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email (Optional)</label>
                <input
                  type="email"
                  placeholder="johndoe@example.com"
                  value={newStudent.email}
                  onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Phone (Optional)</label>
                <input
                  type="tel"
                  placeholder="1234567890"
                  value={newStudent.phone}
                  onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                />
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={adding}>
                  {adding ? "Adding..." : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

