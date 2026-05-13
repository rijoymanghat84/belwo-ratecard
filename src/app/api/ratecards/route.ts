import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

// GET /api/ratecards — list rate cards (paginated, filterable)
export async function GET(req: NextRequest) {
  const session: any = await requireSession();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const status = searchParams.get("status");
  const clientName = searchParams.get("client");

  const where: any = {};
  if (status) where.status = status;
  if (clientName) where.clientName = { contains: clientName, mode: "insensitive" };

  const [cards, total] = await Promise.all([
    prisma.rateCard.findMany({
      where,
      include: {
        template: { select: { name: true } },
        createdBy: { select: { name: true } },
        _count: { select: { versions: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.rateCard.count({ where }),
  ]);

  return NextResponse.json({ cards, total, page, limit });
}

// POST /api/ratecards — create new rate card
export async function POST(req: NextRequest) {
  const session: any = await requireSession();
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  const { clientName, templateId, config, validUntil } = body;

  if (!clientName || !templateId || !config) {
    return NextResponse.json(
      { error: "clientName, templateId, and config are required" },
      { status: 400 }
    );
  }

  const card = await prisma.rateCard.create({
    data: {
      clientName,
      templateId,
      config,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      userId: session.user.id,
    },
  });

  // Create initial version
  await prisma.rateCardVersion.create({
    data: {
      rateCardId: card.id,
      version: 1,
      config,
    },
  });

  return NextResponse.json(card, { status: 201 });
}
