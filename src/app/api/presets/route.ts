import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/api-auth";

// GET /api/presets — list all presets
export async function GET() {
  const presets = await prisma.ratePreset.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(presets);
}

// POST /api/presets — create new preset (admin only)
export async function POST(req: NextRequest) {
  const session: any = await requireSession();
  if (session instanceof NextResponse) return session;

  const forbidden = requireAdmin(session);
  if (forbidden) return forbidden;

  const body = await req.json();
  const { name, description, config, isDefault, effectiveFrom } = body;

  if (!name || !config) {
    return NextResponse.json(
      { error: "name and config are required" },
      { status: 400 }
    );
  }

  // If setting as default, unset existing defaults
  if (isDefault) {
    await prisma.ratePreset.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const preset = await prisma.ratePreset.create({
    data: {
      name,
      description,
      config,
      isDefault: isDefault ?? false,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
    },
  });

  return NextResponse.json(preset, { status: 201 });
}
