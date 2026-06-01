// Server-only join request approve/reject (Firebase Admin SDK — bypasses client rules).

import { getAdminDb } from "./firebase-admin";

export async function adminApproveJoinRequest(coachingId, requestId, studentId) {
  const adminDb = getAdminDb();
  const coachingRef = adminDb.doc(`coachings/${coachingId}`);
  const coachingSnap = await coachingRef.get();
  if (!coachingSnap.exists) throw new Error("Coaching institute not found.");

  const coaching = coachingSnap.data();
  const studentSnap = await adminDb.doc(`users/${studentId}`).get();
  const studentProfile = studentSnap.exists ? studentSnap.data() : null;

  const existing = studentProfile?.coachingIds
    || (studentProfile?.coachingId ? [studentProfile.coachingId] : []);
  const pending = studentProfile?.pendingCoachingIds || [];
  const newCoachingIds = existing.includes(coachingId) ? existing : [...existing, coachingId];
  const newPending = pending.filter((id) => id !== coachingId);
  const students = coaching.students || [];
  const newStudents = students.includes(studentId) ? students : [...students, studentId];

  const batch = adminDb.batch();
  batch.update(adminDb.doc(`coachings/${coachingId}/joinRequests/${requestId}`), {
    status: "approved",
  });
  batch.update(coachingRef, { students: newStudents });
  batch.set(
    adminDb.doc(`users/${studentId}`),
    {
      coachingIds: newCoachingIds,
      coachingId: newCoachingIds[0] || coachingId,
      pendingCoachingIds: newPending,
      status: "approved",
      role: studentProfile?.role || "student",
    },
    { merge: true }
  );
  await batch.commit();
}

export async function adminRejectJoinRequest(coachingId, requestId, studentId) {
  const adminDb = getAdminDb();
  const studentSnap = await adminDb.doc(`users/${studentId}`).get();
  const studentProfile = studentSnap.exists ? studentSnap.data() : null;
  const pending = studentProfile?.pendingCoachingIds || [];
  const enrolled = studentProfile?.coachingIds
    || (studentProfile?.coachingId ? [studentProfile.coachingId] : []);
  const newPending = pending.filter((id) => id !== coachingId);

  const batch = adminDb.batch();
  batch.update(adminDb.doc(`coachings/${coachingId}/joinRequests/${requestId}`), {
    status: "rejected",
  });
  batch.set(
    adminDb.doc(`users/${studentId}`),
    {
      pendingCoachingIds: newPending,
      ...(enrolled.length === 0 && newPending.length === 0 ? { status: "independent" } : {}),
    },
    { merge: true }
  );
  await batch.commit();
}
