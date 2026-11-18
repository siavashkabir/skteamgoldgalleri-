import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 🚀 موقتاً تمام محافظت‌ها و ریدایرکت‌ها غیرفعال شدند
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
