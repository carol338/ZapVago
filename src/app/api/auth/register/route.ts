/**
 * POST /api/auth/register — cria a conta do dono + o negócio (Etapa 1 do onboarding).
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { fillLaunchOfferSpot } from "@/lib/launch-offer";

const schema = z.object({
  businessName: z.string().min(2),
  category: z.enum(["BARBER", "SALON", "AESTHETIC_CLINIC", "MANICURE", "DENTAL_CLINIC", "TATTOO_STUDIO", "PET_SHOP", "OTHER"]),
  businessPhone: z.string().min(10),
  ownerName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const { allowed } = await checkRateLimit(`register:ip:${ip}`, 5, 60 * 60);
  if (!allowed) return NextResponse.json({ error: "Muitas tentativas de cadastro. Tente novamente em 1 hora." }, { status: 429 });

  try {
    const body = schema.parse(await req.json());

    const existingOwner = await prisma.owner.findUnique({ where: { email: body.email } });
    if (existingOwner) {
      return NextResponse.json({ error: "Já existe uma conta com esse email." }, { status: 409 });
    }

    let slug = slugify(body.businessName);
    const slugTaken = await prisma.business.findUnique({ where: { slug } });
    if (slugTaken) slug = `${slug}-${Date.now().toString(36)}`;

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const business = await prisma.business.create({
      data: {
        name: body.businessName,
        slug,
        category: body.category as any,
        phone: body.businessPhone,
        settings: {},
        owner: {
          create: {
            name: body.ownerName,
            email: body.email,
            password: hashedPassword,
            phone: body.businessPhone,
            notifyOn: { newAppointment: true, weeklyReport: true, sentimentAlert: true, channel: "whatsapp" },
          },
        },
      },
      include: { owner: true },
    });

    await fillLaunchOfferSpot();

    return NextResponse.json({ businessId: business.id, slug: business.slug }, { status: 201 });
  } catch (err: any) {
    if (err?.issues) return NextResponse.json({ error: "Dados inválidos", details: err.issues }, { status: 400 });
    console.error("[api/auth/register] erro:", err);
    return NextResponse.json({ error: "Erro ao criar conta." }, { status: 500 });
  }
}
