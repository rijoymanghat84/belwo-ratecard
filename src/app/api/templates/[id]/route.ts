import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

// GET /api/templates/[id] — full template with HTML/CSS
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  return NextResponse.json(template);
}

// PUT /api/templates/[id] — update HTML/CSS (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session: any = await requireSession();
  if (session instanceof NextResponse) return session;

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const template = await prisma.template.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      htmlContent: body.htmlContent,
      cssContent: body.cssContent,
    },
  });

  return NextResponse.json(template);
}

// DELETE /api/templates/[id] — soft-delete (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session: any = await requireSession();
  if (session instanceof NextResponse) return session;

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.template.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
