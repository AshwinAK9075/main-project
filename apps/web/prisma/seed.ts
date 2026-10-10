import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_CARBON_CONFIG, DEFAULT_CONFIG_VERSION } from "../src/lib/carbon/constants";
import { calculatePlotCarbon } from "../src/lib/carbon/calculate";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing records
  await prisma.auditLog.deleteMany();
  await prisma.retirement.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.creditBatch.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.calculationResult.deleteMany();
  await prisma.treeMeasurement.deleteMany();
  await prisma.project.deleteMany();
  await prisma.carbonConfig.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: "Alice Admin",
      email: "admin@forestcarbon.io",
      passwordHash,
      role: "ADMIN",
      walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    },
  });

  const verifier = await prisma.user.create({
    data: {
      name: "Victor Verifier",
      email: "verifier@forestcarbon.io",
      passwordHash,
      role: "VERIFIER",
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    },
  });

  const landowner1 = await prisma.user.create({
    data: {
      name: "Liam Landowner",
      email: "landowner1@forestcarbon.io",
      passwordHash,
      role: "LANDOWNER",
      walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    },
  });

  const landowner2 = await prisma.user.create({
    data: {
      name: "Laura Landowner",
      email: "landowner2@forestcarbon.io",
      passwordHash,
      role: "LANDOWNER",
      walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    },
  });

  const buyer1 = await prisma.user.create({
    data: {
      name: "Bob Buyer",
      email: "buyer1@forestcarbon.io",
      passwordHash,
      role: "BUYER",
      walletAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    },
  });

  const buyer2 = await prisma.user.create({
    data: {
      name: "Beth Buyer",
      email: "buyer2@forestcarbon.io",
      passwordHash,
      role: "BUYER",
      walletAddress: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    },
  });

  console.log("✓ Seeded 6 demo users with hashed credentials");

  // 2. Create Active CarbonConfig
  const carbonConfig = await prisma.carbonConfig.create({
    data: {
      version: DEFAULT_CONFIG_VERSION,
      valuesJson: JSON.stringify(DEFAULT_CARBON_CONFIG),
      isActive: true,
      createdBy: admin.id,
    },
  });

  console.log(`✓ Seeded default CarbonConfig (${carbonConfig.version})`);

  // 3. Create Sample Project for Landowner 1
  const project = await prisma.project.create({
    data: {
      ownerId: landowner1.id,
      name: "Willamette Valley Native Reforestation Plot A",
      description:
        "Restoration agroforestry project converting unused pastoral lands into high-density mixed hardwood and conifer stands with community biodiversity corridors.",
      country: "United States",
      region: "Oregon",
      latitude: 44.0521,
      longitude: -123.0868,
      areaHectares: 12.5,
      status: "DRAFT",
      configVersion: DEFAULT_CONFIG_VERSION,
      trees: {
        create: [
          {
            treeType: "HARDWOOD_BROADLEAF",
            circumferenceM: 1.2566370614, // DBH = 40cm
            heightM: 20,
            treeCount: 45,
            speciesNote: "Oregon White Oak (Quercus garryana)",
          },
          {
            treeType: "SOFTWOOD_CONIFER",
            circumferenceM: 1.1, // DBH ≈ 35cm
            heightM: 24,
            treeCount: 60,
            speciesNote: "Douglas Fir (Pseudotsuga menziesii)",
          },
          {
            treeType: "FAST_GROWING_TROPICAL",
            circumferenceM: 0.85,
            heightM: 16,
            treeCount: 30,
            speciesNote: "Riparian Willow Buffer Stand",
          },
        ],
      },
    },
    include: {
      trees: true,
    },
  });

  // Calculate carbon metrics for sample project
  const calc = calculatePlotCarbon({
    trees: project.trees.map((t) => ({
      id: t.id,
      treeType: t.treeType as any,
      circumferenceM: t.circumferenceM,
      heightM: t.heightM,
      treeCount: t.treeCount,
      speciesNote: t.speciesNote ?? undefined,
    })),
    areaHectares: project.areaHectares,
  });

  await prisma.calculationResult.create({
    data: {
      projectId: project.id,
      totalGrossCredits: calc.totalGrossCredits,
      totalNetCredits: calc.totalNetCredits,
      totalCo2eKg: calc.totalCo2eKg,
      breakdownJson: JSON.stringify(calc),
      configVersion: DEFAULT_CONFIG_VERSION,
    },
  });

  // Log creation in AuditLog
  await prisma.auditLog.create({
    data: {
      actorId: landowner1.id,
      action: "PROJECT_CREATED",
      entity: "Project",
      entityId: project.id,
      metaJson: JSON.stringify({
        name: project.name,
        treesCount: 135,
        netCredits: calc.totalNetCredits,
      }),
    },
  });

  console.log(`✓ Seeded sample project "${project.name}" with 135 trees and calculation result`);
  console.log("🌱 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
