import { NextResponse, type NextRequest } from "next/server";

const adminCookieName = "saba_admin_session";

function adminSessionToken() {
  return process.env.ADMIN_SESSION_TOKEN || process.env.ADMIN_SEED_PASSWORD || "change-me";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isLogin = pathname === "/admin/login" || pathname === "/api/admin/login";

  if ((!isAdminPage && !isAdminApi) || isLogin) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(adminCookieName)?.value;
  if (cookie === adminSessionToken()) {
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
