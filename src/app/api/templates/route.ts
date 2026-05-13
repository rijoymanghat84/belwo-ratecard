import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

// GET /api/templates — list active templates
export async function GET() {
  const templates = await prisma.template.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
    },
  });
  return NextResponse.json(templates);
}

// POST /api/templates — create new (admin only)
export async function POST(req: NextRequest) {
  const session: any = await requireSession();
  if (session instanceof NextResponse) return session;

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, htmlContent, cssContent } = body;

  if (!name || !htmlContent) {
    return NextResponse.json(
      { error: "name and htmlContent are required" },
      { status: 400 }
    );
  }

  const template = await prisma.template.create({
    data: { name, description, htmlContent, cssContent: cssContent || "", isActive: true },
  });

  return NextResponse.json(template, { status: 201 });
}
