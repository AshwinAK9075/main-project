import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertProjectOwnership, requireUser } from "@/lib/auth/guards";
import { projectCreateSchema } from "@/lib/validation/schemas";
import { calculatePlotCarbon } from "@/lib/carbon/calculate";
import { DEFAULT_CONFIG_VERSION } from "@/lib/carbon/constants";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api-utils";

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, email: true, walletAddress: true } },
        trees: true,
        calculation: true,
        verifications: {
          include: { verifier: { select: { id: true, name: true, email: true } } },
          orderBy: { decidedAt: "desc" },
        },
        creditBatch: true,
      },
    });

    if (!project) {
      return jsonError("Project not found", "NOT_FOUND", 404);
    }

    // Role guard: Landowners can only access their own projects
    if (user.role === "LANDOWNER" && project.ownerId !== user.id) {
      return jsonError("Forbidden: You do not own this project", "FORBIDDEN", 403);
    }

    return jsonSuccess({ project });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const existing = await assertProjectOwnership(params.id, user);

    if (existing.status !== "DRAFT" && existing.status !== "REJECTED") {
      return jsonError(
        "Only DRAFT or REJECTED projects can be edited",
        "INVALID_STATE",
        400
      );
    }

    const body = await req.json();
    const data = projectCreateSchema.parse(body);

    const activeConfig = await prisma.carbonConfig.findFirst({
      where: { isActive: true },
    });
    const configVersion = activeConfig?.version || DEFAULT_CONFIG_VERSION;

    const calculation = calculatePlotCarbon(
      {
        trees: data.trees,
        areaHectares: data.areaHectares,
      },
      configVersion
    );

    const updated = await prisma.$transaction(async (tx) => {
      // Remove old tree rows
      await tx.treeMeasurement.deleteMany({
        where: { projectId: params.id },
      });

      const proj = await tx.project.update({
        where: { id: params.id },
        data: {
          name: data.name,
          description: data.description,
          country: data.country,
          region: data.region,
          latitude: data.latitude,
          longitude: data.longitude,
          areaHectares: data.areaHectares,
          status: "DRAFT", // Reset to DRAFT upon editing
          rejectionReason: null,
          configVersion,
          trees: {
            create: data.trees.map((t) => ({
              treeType: t.treeType,
              circumferenceM: t.circumferenceM,
              heightM: t.heightM,
              treeCount: t.treeCount,
              speciesNote: t.speciesNote,
            })),
          },
        },
        include: { trees: true },
      });

      await tx.calculationResult.upsert({
        where: { projectId: params.id },
        create: {
          projectId: params.id,
          totalGrossCredits: calculation.totalGrossCredits,
          totalNetCredits: calculation.totalNetCredits,
          totalCo2eKg: calculation.totalCo2eKg,
          breakdownJson: JSON.stringify(calculation),
          configVersion,
        },
        update: {
          totalGrossCredits: calculation.totalGrossCredits,
          totalNetCredits: calculation.totalNetCredits,
          totalCo2eKg: calculation.totalCo2eKg,
          breakdownJson: JSON.stringify(calculation),
          configVersion,
          calculatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "PROJECT_UPDATED",
          entity: "Project",
          entityId: params.id,
          metaJson: JSON.stringify({
            name: proj.name,
            totalNetCredits: calculation.totalNetCredits,
          }),
        },
      });

      return proj;
    });

    return jsonSuccess({ project: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const existing = await assertProjectOwnership(params.id, user);

    if (existing.status !== "DRAFT") {
      return jsonError("Only DRAFT projects can be deleted", "INVALID_STATE", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.project.delete({ where: { id: params.id } });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "PROJECT_DELETED",
          entity: "Project",
          entityId: params.id,
          metaJson: JSON.stringify({ name: existing.name }),
        },
      });
    });

    return jsonSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
