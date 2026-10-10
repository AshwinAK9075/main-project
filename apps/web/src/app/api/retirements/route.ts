import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/guards";
import { jsonSuccess, jsonError, handleApiError } from "@/lib/api-utils";
import { retireCreditsSchema } from "@/lib/validation/schemas";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    const retirements = await prisma.retirement.findMany({
      where: user.role === "ADMIN" && all ? undefined : { userId: user.id },
      include: {
        batch: {
          include: {
            project: true,
          },
        },
      },
      orderBy: { retiredAt: "desc" },
    });

    return jsonSuccess({ retirements });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const parsed = retireCreditsSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", 400, parsed.error.flatten());
    }

    const { batchId, quantity, beneficiaryName, reason, txHash } = parsed.data;

    const batch = await prisma.creditBatch.findUnique({
      where: { id: batchId },
      include: { project: true },
    });

    if (!batch) {
      return jsonError("Credit batch not found", 404);
    }

    // Generate unique Certificate Number: RET-YYYY-XXXXXX
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const year = new Date().getFullYear();
    const certificateNumber = `RET-${year}-${randomHex}`;

    const retirement = await prisma.$transaction(async (tx) => {
      const created = await tx.retirement.create({
        data: {
          batchId,
          userId: user.id,
          quantity,
          beneficiaryName,
          reason,
          txHash: txHash || `0xmock_retire_${Date.now()}`,
          certificateNumber,
        },
        include: {
          batch: {
            include: {
              project: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "RETIRE_CREDITS",
          entity: "Retirement",
          entityId: created.id,
          metaJson: JSON.stringify({
            certificateNumber,
            quantity,
            beneficiaryName,
            reason,
            txHash: created.txHash,
          }),
        },
      });

      return created;
    });

    return jsonSuccess({ retirement }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
