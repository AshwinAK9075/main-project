import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertProjectOwnership, requireUser } from "@/lib/auth/guards";
import { calculatePlotCarbon } from "@/lib/carbon/calculate";
import { DEFAULT_CONFIG_VERSION } from "@/lib/carbon/constants";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api-utils";

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const project = await assertProjectOwnership(params.id, user);

    if (project.status !== "DRAFT" && project.status !== "REJECTED") {
      return jsonError(
        `Cannot submit project with status ${project.status}`,
        "INVALID_STATE",
        400
      );
    }

    // Fetch trees
    const trees = await prisma.treeMeasurement.findMany({
      where: { projectId: params.id },
    });

    if (trees.length === 0) {
      return jsonError(
        "Cannot submit project without tree measurements",
        "EMPTY_TREES",
        400
      );
    }

    // Fetch active carbon config
    const activeConfig = await prisma.carbonConfig.findFirst({
      where: { isActive: true },
    });
    const configVersion = activeConfig?.version || DEFAULT_CONFIG_VERSION;

    // Recalculate on server to guarantee authenticity
    const calculation = calculatePlotCarbon(
      {
        trees: trees.map((t) => ({
          id: t.id,
          treeType: t.treeType as any,
          circumferenceM: t.circumferenceM,
          heightM: t.heightM,
          treeCount: t.treeCount,
          speciesNote: t.speciesNote ?? undefined,
        })),
        areaHectares: project.areaHectares,
      },
      configVersion
    );

    const updated = await prisma.$transaction(async (tx) => {
      // Upsert calculation result
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

      // Update project status to SUBMITTED
      const proj = await tx.project.update({
        where: { id: params.id },
        data: {
          status: "SUBMITTED",
          rejectionReason: null,
          configVersion,
        },
      });

      // Record AuditLog
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "PROJECT_SUBMITTED",
          entity: "Project",
          entityId: params.id,
          metaJson: JSON.stringify({
            status: "SUBMITTED",
            totalNetCredits: calculation.totalNetCredits,
          }),
        },
      });

      return proj;
    });

    return jsonSuccess({ project: updated, calculation });
  } catch (error) {
    return handleApiError(error);
  }
}
