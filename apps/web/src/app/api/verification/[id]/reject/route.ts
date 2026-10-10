import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { z } from "zod";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api-utils";

interface Params {
  params: { id: string };
}

const rejectSchema = z.object({
  reason: z.string().min(5, "Rejection reason must be at least 5 characters").max(1000),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(["VERIFIER", "ADMIN"]);

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return jsonError("Project not found", "NOT_FOUND", 404);
    }

    if (project.status !== "SUBMITTED" && project.status !== "UNDER_REVIEW") {
      return jsonError(
        `Project with status '${project.status}' cannot be rejected`,
        "INVALID_STATE",
        400
      );
    }

    const body = await req.json();
    const data = rejectSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
        where: { id: params.id },
        data: {
          status: "REJECTED",
          rejectionReason: data.reason,
        },
      });

      const verification = await tx.verification.create({
        data: {
          projectId: params.id,
          verifierId: user.id,
          decision: "REJECTED",
          notes: data.notes || data.reason,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "PROJECT_REJECTED",
          entity: "Project",
          entityId: params.id,
          metaJson: JSON.stringify({
            verifier: user.name,
            reason: data.reason,
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
