import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

// GET /api/ratecards/[id] — full rate card with versions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session: any = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const card = await prisma.rateCard.findUnique({
    where: { id },
    include: {
      template: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      versions: { orderBy: { version: "desc" } },
    },
  });

  if (!card) {
    return NextResponse.json({ error: "Rate card not found" }, { status: 404 });
  }

  return NextResponse.json(card);
}

// PUT /api/ratecards/[id] — update config (creates new version)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session: any = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.rateCard.findUnique({
    where: { id },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Rate card not found" }, { status: 404 });
  }

  const nextVersion = (existing.versions[0]?.version ?? 0) + 1;

  const card = await prisma.rateCard.update({
    where: { id },
    data: {
      clientName: body.clientName ?? existing.clientName,
      config: body.config ?? existing.config,
      validUntil: body.validUntil ? new Date(body.validUntil) : existing.validUntil,
      status: body.status ?? existing.status,
      templateId: body.templateId ?? existing.templateId,
    },
  });

  // Create version snapshot
  await prisma.rateCardVersion.create({
    data: {
      rateCardId: id,
      version: nextVersion,
      config: card.config as any,
    },
  });

  return NextResponse.json(card);
}

// DELETE /api/ratecards/[id] — soft-delete
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session: any = await requireSession();
  if (session instanceof NextResponse) return session;

  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.rateCard.update({
    where: { id },
    data: { status: "expired" },
  });

  return NextResponse.json({ success: true });
}

// POST /api/ratecards/[id]/finalize — mark as final
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session: any = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  await prisma.rateCard.update({
    where: { id },
    data: { status: "final" },
  });

  return NextResponse.json({ success: true });
}
