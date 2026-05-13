import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/api-auth";

// GET /api/presets/default — fetch current default preset
export async function GET() {
  const preset = await prisma.ratePreset.findFirst({
    where: { isDefault: true },
  });

  if (!preset) {
    return NextResponse.json({ error: "No default preset found" }, { status: 404 });
  }

  return NextResponse.json(preset);
}
