/** GET /api/clients?search=&tag=&sort= — lista clientes com filtros; POST cria manualmente. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusinessId } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const tag = searchParams.get("tag");
  const sort = searchParams.get("sort") ?? "name";

  const clients = await prisma.client.findMany({
    where: {
      businessId,
      ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }] } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    },
    orderBy:
      sort === "totalSpent"
        ? { totalSpent: "desc" }
        : sort === "lastVisit"
        ? { lastVisitAt: "desc" }
        : { name: "asc" },
  });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const businessId = await requireBusinessId();
  if (businessId instanceof NextResponse) return businessId;

  const body = await req.json();
  const client = await prisma.client.create({
    data: {
      businessId,
      name: body.name,
      phone: body.phone,
      notes: body.notes,
      tags: body.tags ?? [],
      alergias: body.alergias ?? [],
      preferencias: body.preferencias ?? {},
    },
  });
  return NextResponse.json(client, { status: 201 });
}
