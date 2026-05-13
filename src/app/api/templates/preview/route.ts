import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderTemplate } from "@/lib/template-engine";

// POST /api/templates/preview — render any template with sample or provided config
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { templateId, clientName, validUntil, config, logoBase64 } = body;

  // Load template
  let html: string;
  if (templateId) {
    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    html = template.htmlContent;
  } else if (body.html) {
    html = body.html;
  } else {
    return NextResponse.json({ error: "templateId or html is required" }, { status: 400 });
  }

  // Use sample data if no config provided
  const sampleConfig = config ?? SAMPLE_CONFIG;
  const ctx = {
    clientName: clientName ?? "Sample Client",
    validUntil: validUntil ?? "2026-12-31",
    logoBase64: logoBase64 ?? "",
    year: new Date().getFullYear(),
    config: sampleConfig,
  };

  const rendered = renderTemplate(html, ctx);
  return NextResponse.json({ html: rendered });
}

const SAMPLE_CONFIG = {
  sections: {
    blended: {
      enabled: true,
      rates: {
        offshore: [65.0, 59.0, 49.5],
        onshore: [135.0, 114.5, 105.0],
      },
    },
    perRole: {
      enabled: true,
      roles: [
        { label: "Project Manager", offshore: [59.5, 52.5, 47.5], onshore: [149.5, 139.5, 125.0] },
        { label: "Business Analyst", offshore: [59.5, 52.5, 47.5], onshore: [125.0, 115.5, 105.5] },
        { label: "CCM Developer", offshore: [56.5, 49.5, 45.0], onshore: [115.0, 105.5, 99.5] },
        { label: ".Net Developer", offshore: [52.0, 44.5, 39.5], onshore: [105.0, 99.5, 95.0] },
        { label: "Quality Assurance", offshore: [45.0, 41.5, 38.0], onshore: [95.0, 90.5, 85.5] },
      ],
    },
    flatRate: {
      enabled: true,
      roles: [
        { label: "Solution Architect", offshore: 90.0, onshore: 158.0 },
        { label: "BCC Support", offshore: 40.0, onshore: 85.0 },
        { label: "General Support (Non-Tech)", offshore: 25.0, onshore: 50.0 },
      ],
    },
    billingTerms: {
      enabled: true,
      netPayment: 30,
      lateFee: 1.5,
    },
  },
};
