import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/src/lib/firebase-admin";
import { adminApproveJoinRequest, adminRejectJoinRequest } from "@/src/lib/joinRequestAdmin";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(idToken);

    const { action, coachingId, requestId, studentId } = await request.json();
    if (!coachingId || !requestId || !studentId) {
      return NextResponse.json({ error: "Missing coachingId, requestId, or studentId" }, { status: 400 });
    }

    const adminSnap = await getAdminDb().doc(`users/${decoded.uid}`).get();
    const adminProfile = adminSnap.data();
    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json({ error: "Only institute admins can manage join requests" }, { status: 403 });
    }
    if (adminProfile.coachingId !== coachingId) {
      return NextResponse.json({ error: "You can only manage requests for your own institute" }, { status: 403 });
    }

    if (action === "approve") {
      await adminApproveJoinRequest(coachingId, requestId, studentId);
    } else if (action === "reject") {
      await adminRejectJoinRequest(coachingId, requestId, studentId);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/join-requests]", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
