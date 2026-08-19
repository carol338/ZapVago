/**
 * POST /api/lgpd/delete — LGPD Art. 18, VI (eliminação dos dados a pedido
 * do titular). Exige confirmação explícita no corpo da requisição (o
 * "Tem certeza? Esta ação é irreversível." é responsabilidade da tela que
 * chama essa rota — aqui é a trava do servidor pra nunca apagar por engano
 * com um clique único ou uma chamada automatizada).
 *
 * Deletar o Business é suficiente pra apagar tudo: todo modelo com
 * businessId tem onDelete: Cascade pra Business no schema (Service,
 * Professional, Client → Appointment/Conversation/WaitingListEntry/
 * BookingToken/ClientNote, LoyaltyRule, FlashSale, WaitingListEvent,
 * PushSubscription, SilentRule) e Owner também casca com a exclusão do
 * Business. Fica só um registro anônimo (AccountDeletionLog) com a data,
 * sem nenhum dado pessoal, pra eventual auditoria de atendimento ao pedido.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json().catch(() => ({}));
  if (body.confirm !== true) {
    return NextResponse.json(
      { error: "Tem certeza? Esta ação é irreversível. Reenvie a requisição com { confirm: true } para excluir definitivamente a conta e todos os dados do negócio." },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.accountDeletionLog.create({ data: {} }),
    prisma.business.delete({ where: { id: businessId } }),
  ]);

  return NextResponse.json({ ok: true });
}
