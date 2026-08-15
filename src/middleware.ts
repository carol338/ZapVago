/**
 * Middleware de autenticação — protege todas as rotas /dashboard e as
 * rotas de API que exigem um dono logado. Rotas públicas (landing, login,
 * register, webhook do WhatsApp) ficam de fora do matcher abaixo.
 */
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/business/:path*",
    "/api/services/:path*",
    "/api/professionals/:path*",
    "/api/appointments/:path*",
    "/api/clients/:path*",
    "/api/conversations/:path*",
    "/api/flash-sales/:path*",
    "/api/waiting-list/:path*",
    "/api/loyalty/:path*",
    "/api/reports/:path*",
    "/api/booking-tokens/:path*",
  ],
};
