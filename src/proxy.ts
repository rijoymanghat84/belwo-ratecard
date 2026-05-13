import { middlewareAuth } from "@/lib/auth-edge";
import { NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/ratecards", "/invoices", "/fixed-bids", "/admin"];
const adminPaths = ["/admin", "/templates"];

export default middlewareAuth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user as any)?.role;

  // Allow auth routes, login page, public assets
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  // Require authentication for protected areas
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Require admin for admin-only areas
  if (adminPaths.some((p) => pathname.startsWith(p)) && role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
