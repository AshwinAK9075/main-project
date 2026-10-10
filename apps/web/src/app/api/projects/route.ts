import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/guards";
import { projectCreateSchema } from "@/lib/validation/schemas";
import { calculatePlotCarbon } from "@/lib/carbon/calculate";
import { DEFAULT_CONFIG_VERSION } from "@/lib/carbon/constants";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();

    // Landowners only see their own projects; Verifiers and Admins see all
    const whereClause = user.role === "LANDOWNER" ? { ownerId: user.id } : {};

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        calculation: true,
        creditBatch: true,
        _count: { select: { trees: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonSuccess({ projects });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const data = projectCreateSchema.parse(body);

    // Fetch active carbon configuration version
    const activeConfig = await prisma.carbonConfig.findFirst({
      where: { isActive: true },
    });
    const configVersion = activeConfig?.version || DEFAULT_CONFIG_VERSION;

    // Recalculate carbon values server-side (never trust client values)
    const calculation = calculatePlotCarbon(
      {
        trees: data.trees,
        areaHectares: data.areaHectares,
      },
      configVersion
    );

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          ownerId: user.id,
          name: data.name,
          description: data.description,
          country: data.country,
          region: data.region,
          latitude: data.latitude,
          longitude: data.longitude,
          areaHectares: data.areaHectares,
          status: "DRAFT",
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

      const calcRecord = await tx.calculationResult.create({
        data: {
          projectId: project.id,
          totalGrossCredits: calculation.totalGrossCredits,
          totalNetCredits: calculation.totalNetCredits,
          totalCo2eKg: calculation.totalCo2eKg,
          breakdownJson: JSON.stringify(calculation),
          configVersion,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "PROJECT_CREATED",
          entity: "Project",
          entityId: project.id,
          metaJson: JSON.stringify({
            name: project.name,
            totalNetCredits: calculation.totalNetCredits,
          }),
        },
      });

      return { project, calculation: calcRecord };
    });

    return jsonSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
