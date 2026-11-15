import { NextResponse, type NextRequest } from "next/server";

export const runtime = "experimental-edge";

export function middleware(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/master-admin/:path*", "/admin/:path*"],
};
