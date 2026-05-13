// Seed: default BelWo 2026 preset + BelWo Corporate template
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BELWO_TEMPLATE_HTML = readFileSync(
  join(__dirname, "templates", "belwo-corporate.html"),
  "utf-8"
);

const BELWO_TEMPLATE_CSS = readFileSync(
  join(__dirname, "templates", "belwo-corporate.css"),
  "utf-8"
);

const BELWO_2026_PRESET = {
  name: "BelWo 2026 Default",
  description: "Default BelWo rate card pricing for 2026",
  isDefault: true,
  effectiveFrom: new Date("2026-01-01"),
  config: {
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
          { key: "projectManager", label: "Project Manager", enabled: true, offshore: [59.5, 52.5, 47.5], onshore: [149.5, 139.5, 125.0] },
          { key: "businessAnalyst", label: "Business Analyst", enabled: true, offshore: [59.5, 52.5, 47.5], onshore: [125.0, 115.5, 105.5] },
          { key: "ccmDeveloper", label: "CCM Developer", enabled: true, offshore: [56.5, 49.5, 45.0], onshore: [115.0, 105.5, 99.5] },
          { key: "netDeveloper", label: ".Net Developer", enabled: true, offshore: [52.0, 44.5, 39.5], onshore: [105.0, 99.5, 95.0] },
          { key: "qa", label: "Quality Assurance", enabled: true, offshore: [45.0, 41.5, 38.0], onshore: [95.0, 90.5, 85.5] },
        ],
      },
      flatRate: {
        enabled: true,
        roles: [
          { key: "solutionArchitect", label: "Solution Architect", enabled: true, offshore: 90.0, onshore: 158.0 },
          { key: "bccSupport", label: "BCC Support", enabled: true, offshore: 40.0, onshore: 85.0 },
          { key: "generalSupport", label: "General Support (Non-Tech)", enabled: true, offshore: 25.0, onshore: 50.0 },
        ],
      },
      billingTerms: { enabled: true, netPayment: 30, lateFee: 1.5 },
    },
  },
};

async function seed() {
  const existing = await prisma.ratePreset.findFirst({ where: { isDefault: true } });
  if (existing) { console.log("Default preset already exists. Skipping."); return; }

  await prisma.ratePreset.create({ data: BELWO_2026_PRESET });
  console.log("✅ Created default preset: BelWo 2026 Default");

  await prisma.template.create({
    data: {
      name: "BelWo Corporate",
      description: "BelWo corporate rate card design with navy & orange branding",
      htmlContent: BELWO_TEMPLATE_HTML,
      cssContent: BELWO_TEMPLATE_CSS,
      isActive: true,
    },
  });
  console.log("✅ Created template: BelWo Corporate");
}

seed()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
