import { NextResponse, type NextRequest } from "next/server";

const adminCookieName = "saba_admin_session";

function adminSessionToken() {
  return process.env.ADMIN_SESSION_TOKEN || "dev-admin-session-secret";
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

type AdminSession = {
  exp?: number;
  role?: "SUPER_ADMIN" | "MANAGER" | "STAFF" | "KITCHEN";
};

const ownerOnlyPaths = [
  "/admin/users",
  "/admin/menu",
  "/admin/settings",
  "/admin/website-settings",
  "/admin/opening-hours",
  "/admin/promo-codes",
  "/admin/customers",
  "/api/admin/users",
  "/api/admin/menu",
  "/api/admin/settings",
  "/api/admin/business-info",
  "/api/admin/legal-content"
];

const managerAllowedPaths = [
  "/admin",
  "/admin/tables",
  "/admin/orders",
  "/admin/kitchen",
  "/admin/bookings",
  "/admin/reviews",
  "/api/admin/me",
  "/api/admin/tables",
  "/api/admin/orders",
  "/api/admin/orders/",
  "/api/admin/staff-orders",
  "/api/admin/staff-orders/",
  "/api/admin/bookings",
  "/api/admin/bookings/",
  "/api/menu"
];

const staffAllowedPaths = [
  "/admin",
  "/admin/tables",
  "/api/admin/me",
  "/api/admin/tables",
  "/api/admin/orders",
  "/api/admin/orders/",
  "/api/admin/staff-orders",
  "/api/admin/staff-orders/",
  "/api/menu"
];

const kitchenAllowedPaths = [
  "/admin",
  "/admin/kitchen",
  "/api/admin/me",
  "/api/admin/orders",
  "/api/admin/orders/"
];

function isOwnerOnlyPath(pathname: string) {
  return ownerOnlyPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isKitchenAllowedPath(pathname: string) {
  return kitchenAllowedPaths.some((path) => pathname === path || pathname.startsWith(path));
}

function isManagerAllowedPath(pathname: string) {
  return managerAllowedPaths.some((path) => pathname === path || pathname.startsWith(path));
}

function isStaffAllowedPath(pathname: string) {
  return staffAllowedPaths.some((path) => pathname === path || pathname.startsWith(path));
}

async function verifySessionCookie(cookie?: string): Promise<AdminSession | null> {
  if (!cookie) return null;
  const [payload, signature] = cookie.split(".");
  if (!payload || !signature) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(adminSessionToken()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const valid = await crypto.subtle.verify("HMAC", key, base64UrlToBytes(signature), new TextEncoder().encode(payload));
  if (!valid) return null;

  try {
    const session = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as AdminSession;
    if (!session.exp || session.exp <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isInvite = pathname === "/admin/invite";
  const isLogin = pathname === "/admin/login" || pathname === "/api/admin/login";

  if ((!isAdminPage && !isAdminApi) || isLogin || isInvite) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(adminCookieName)?.value;
  const session = await verifySessionCookie(cookie);
  if (session) {
    if (session.role === "STAFF" && pathname === "/admin") {
      const staffUrl = request.nextUrl.clone();
      staffUrl.pathname = "/admin/tables";
      return NextResponse.redirect(staffUrl);
    }
    if (session.role === "KITCHEN" && pathname === "/admin") {
      const kitchenUrl = request.nextUrl.clone();
      kitchenUrl.pathname = "/admin/kitchen";
      return NextResponse.redirect(kitchenUrl);
    }
    if (session.role === "STAFF" && !isStaffAllowedPath(pathname)) {
      if (isAdminApi) return NextResponse.json({ error: "Staff table-ordering access only." }, { status: 403 });
      const staffUrl = request.nextUrl.clone();
      staffUrl.pathname = "/admin/tables";
      staffUrl.searchParams.set("access", "restricted");
      return NextResponse.redirect(staffUrl);
    }
    if (session.role === "MANAGER" && !isManagerAllowedPath(pathname)) {
      if (isAdminApi) return NextResponse.json({ error: "Manager day-to-day operations access only." }, { status: 403 });
      const managerUrl = request.nextUrl.clone();
      managerUrl.pathname = "/admin";
      managerUrl.searchParams.set("access", "restricted");
      return NextResponse.redirect(managerUrl);
    }
    if (session.role === "KITCHEN" && !isKitchenAllowedPath(pathname)) {
      if (isAdminApi) return NextResponse.json({ error: "Kitchen access only." }, { status: 403 });
      const kitchenUrl = request.nextUrl.clone();
      kitchenUrl.pathname = "/admin/kitchen";
      kitchenUrl.searchParams.set("access", "restricted");
      return NextResponse.redirect(kitchenUrl);
    }
    if (session.role !== "SUPER_ADMIN" && isOwnerOnlyPath(pathname)) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Owner access required." }, { status: 403 });
      }

      const overviewUrl = request.nextUrl.clone();
      overviewUrl.pathname = "/admin";
      overviewUrl.searchParams.set("access", "restricted");
      return NextResponse.redirect(overviewUrl);
    }
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
