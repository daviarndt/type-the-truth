/**
 * Checagem leve de autenticação: apenas presença do cookie de sessão.
 * A validação real (token no banco) acontece nos layouts/páginas do servidor,
 * já que o middleware roda na Edge runtime sem acesso ao Prisma.
 */

import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "ttt_session";

const APP_PREFIXES = [
  "/dashboard",
  "/type",
  "/bible-map",
  "/rewards",
  "/plans",
  "/profile",
  "/settings",
];

export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = request.nextUrl;

  const isAppRoute = APP_PREFIXES.some((p) => pathname.startsWith(p));

  if (isAppRoute && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Obs.: o redirect de usuário já logado em /login|/signup fica no layout
  // (auth), que valida a sessão no banco — um cookie órfão aqui causaria
  // loop infinito entre /login e /dashboard.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
