import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "./server/auth/cookie";

/**
 * Быстрая проверка до рендера: без cookie сессии кабинет сразу отправляет на вход.
 * Это только удобство — настоящая проверка сессии делается на сервере в каждой странице,
 * Server Action и API-маршруте (`src/server/auth`).
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: "/profile/:path*",
};
