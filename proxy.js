import { NextResponse } from "next/server";

// Protected route prefixes mapped to allowed roles.
// Checks session token + role cookie before allowing dashboard access.
const PROTECTED = {
  "/admin":      ["admin"],
  "/student":    ["student"],
  "/tutor":      ["tutor"],
  "/superadmin": ["superadmin"],
};

export function proxy(request) {
  const { pathname } = request.nextUrl;

  const matchedPrefix = Object.keys(PROTECTED).find((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!matchedPrefix) return NextResponse.next();

  const sessionCookie = request.cookies.get("m360_session")?.value;
  const roleCookie    = request.cookies.get("m360_role")?.value;

  if (!sessionCookie || !roleCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const payloadB64 = sessionCookie.split(".")[1];
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    );

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const res = NextResponse.redirect(new URL("/", request.url));
      res.cookies.delete("m360_session");
      res.cookies.delete("m360_role");
      return res;
    }

    const allowedRoles = PROTECTED[matchedPrefix];
    if (!allowedRoles.includes(roleCookie)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/", request.url));
    res.cookies.delete("m360_session");
    res.cookies.delete("m360_role");
    return res;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/student/:path*",
    "/tutor/:path*",
    "/superadmin/:path*",
  ],
};
