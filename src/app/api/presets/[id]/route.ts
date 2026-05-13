import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/api-auth";

// GET /api/presets/[id] — single preset
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const preset = await prisma.ratePreset.findUnique({ where: { id } });
  if (!preset) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }
  return NextResponse.json(preset);
}

// PUT /api/presets/[id] — update (archives old, creates new — version history)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session: any = await requireSession();
  if (session instanceof NextResponse) return session;

  const forbidden = requireAdmin(session);
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.ratePreset.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }

  // Archive old: set effectiveTo to now
  await prisma.ratePreset.update({
    where: { id },
    data: { effectiveTo: new Date(), isDefault: false },
  });

  // If setting as default, unset others
  if (body.isDefault) {
    await prisma.ratePreset.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  // Create new version
  const preset = await prisma.ratePreset.create({
    data: {
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      config: body.config ?? existing.config,
      isDefault: body.isDefault ?? false,
      effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : new Date(),
    },
  });

  return NextResponse.json(preset, { status: 200 });
}

// DELETE /api/presets/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session: any = await requireSession();
  if (session instanceof NextResponse) return session;

  const forbidden = requireAdmin(session);
  if (forbidden) return forbidden;

  const { id } = await params;
  await prisma.ratePreset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
