// Proxy — auth bypass during development (Phase 8 not yet implemented)
// Re-enable route protection after Phase 8 auth is built.
import { NextResponse, type NextRequest } from "next/server";

export default function proxy(req: NextRequest) {
  // TODO: re-enable auth after Phase 8
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
