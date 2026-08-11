/**
 * Helper para rotas de API: obtém a sessão do dono logado e o businessId,
 * usado para escopar todas as queries por negócio (multi-tenant).
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireBusinessId(): Promise<string | NextResponse> {
  const session = await getServerSession(authOptions);
  const businessId = (session?.user as any)?.businessId;
  if (!businessId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  return businessId;
}
