import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api-utils";

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    // Only VERIFIER or ADMIN can approve
    const user = await requireRole(["VERIFIER", "ADMIN"]);

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: { calculation: true },
    });

    if (!project) {
      return jsonError("Project not found", "NOT_FOUND", 404);
    }

    if (project.status !== "SUBMITTED" && project.status !== "UNDER_REVIEW") {
      return jsonError(
        `Project with status '${project.status}' cannot be approved`,
        "INVALID_STATE",
        400
      );
    }

    let notes: string | undefined;
    try {
      const body = await req.json();
      notes = body.notes;
    } catch {
      // Empty body is acceptable
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
        where: { id: params.id },
        data: {
          status: "VERIFIED",
          rejectionReason: null,
        },
      });

      const verification = await tx.verification.create({
        data: {
          projectId: params.id,
          verifierId: user.id,
          decision: "APPROVED",
          notes: notes || "Allometric measurements verified against canopy and plot bounds.",
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "PROJECT_VERIFIED",
          entity: "Project",
          entityId: params.id,
          metaJson: JSON.stringify({
            verifier: user.name,
            verifierRole: user.role,
            netCredits: project.calculation?.totalNetCredits,
          }),
        },
      });

      return { project: updatedProject, verification };
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
