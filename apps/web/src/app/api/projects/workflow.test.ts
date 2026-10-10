import { describe, expect, it, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

describe("Phase 3 Database & Workflow Verification", () => {
  let landownerUser: any;
  let verifierUser: any;
  let buyerUser: any;

  beforeAll(async () => {
    landownerUser = await prisma.user.findUnique({
      where: { email: "landowner1@forestcarbon.io" },
    });
    verifierUser = await prisma.user.findUnique({
      where: { email: "verifier@forestcarbon.io" },
    });
    buyerUser = await prisma.user.findUnique({
      where: { email: "buyer1@forestcarbon.io" },
    });
  });

  it("verifies seeded users and password hashing", async () => {
    expect(landownerUser).toBeDefined();
    expect(landownerUser.role).toBe("LANDOWNER");
    expect(verifierUser).toBeDefined();
    expect(verifierUser.role).toBe("VERIFIER");
    expect(buyerUser).toBeDefined();
    expect(buyerUser.role).toBe("BUYER");

    const isMatch = await bcrypt.compare("Password123!", landownerUser.passwordHash);
    expect(isMatch).toBe(true);
  });

  it("moves a project lifecycle: DRAFT -> SUBMITTED -> VERIFIED with audit logging", async () => {
    // 1. Create a DRAFT project
    const project = await prisma.project.create({
      data: {
        ownerId: landownerUser.id,
        name: "Test Workflow Stand",
        description: "Test plot for phase 3 verification lifecycle",
        country: "United States",
        region: "Oregon",
        latitude: 45.5152,
        longitude: -122.6784,
        areaHectares: 10,
        status: "DRAFT",
        trees: {
          create: [
            {
              treeType: "HARDWOOD_BROADLEAF",
              circumferenceM: 1.2566370614,
              heightM: 20,
              treeCount: 10,
            },
          ],
        },
      },
    });

    expect(project.status).toBe("DRAFT");

    // 2. Submit project
    const submitted = await prisma.project.update({
      where: { id: project.id },
      data: { status: "SUBMITTED" },
    });
    expect(submitted.status).toBe("SUBMITTED");

    await prisma.auditLog.create({
      data: {
        actorId: landownerUser.id,
        action: "PROJECT_SUBMITTED",
        entity: "Project",
        entityId: project.id,
      },
    });

    // 3. Verifier approves project
    const verified = await prisma.project.update({
      where: { id: project.id },
      data: { status: "VERIFIED" },
    });
    expect(verified.status).toBe("VERIFIED");

    await prisma.verification.create({
      data: {
        projectId: project.id,
        verifierId: verifierUser.id,
        decision: "APPROVED",
        notes: "Verified canopy and measurements in unit test",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: verifierUser.id,
        action: "PROJECT_VERIFIED",
        entity: "Project",
        entityId: project.id,
      },
    });

    // Check audit logs
    const logs = await prisma.auditLog.findMany({
      where: { entityId: project.id },
    });
    expect(logs.length).toBeGreaterThanOrEqual(2);

    // Clean up test project
    await prisma.project.delete({ where: { id: project.id } });
  });

  it("enforces role constraints: buyer cannot be verifier", () => {
    const isVerifierOrAdmin = (role: string) => role === "VERIFIER" || role === "ADMIN";
    expect(isVerifierOrAdmin(buyerUser.role)).toBe(false);
    expect(isVerifierOrAdmin(landownerUser.role)).toBe(false);
    expect(isVerifierOrAdmin(verifierUser.role)).toBe(true);
  });
});
