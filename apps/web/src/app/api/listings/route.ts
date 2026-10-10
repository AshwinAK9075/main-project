import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/guards";
import { jsonSuccess, jsonError, handleApiError } from "@/lib/api-utils";
import { createListingSchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ACTIVE";

    const listings = await prisma.listing.findMany({
      where: status === "ALL" ? undefined : { status },
      include: {
        batch: {
          include: {
            project: {
              include: {
                owner: {
                  select: { id: true, name: true, email: true, walletAddress: true },
                },
                calculation: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonSuccess({ listings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const parsed = createListingSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", 400, parsed.error.flatten());
    }

    const { batchId, pricePerCreditUsdc, quantityAvailable, onchainListingId } = parsed.data;

    const batch = await prisma.creditBatch.findUnique({
      where: { id: batchId },
      include: { project: true },
    });

    if (!batch) {
      return jsonError("Credit batch not found", 404);
    }

    // Role check: Only the project owner or ADMIN can list
    if (user.role !== "ADMIN" && batch.project.ownerId !== user.id) {
      return jsonError("Forbidden: only the landowner can list these credits", 403);
    }

    if (quantityAvailable > batch.amountMinted) {
      return jsonError("Cannot list more credits than minted", 400);
    }

    const listing = await prisma.$transaction(async (tx) => {
      const created = await tx.listing.create({
        data: {
          batchId,
          sellerId: user.id,
          pricePerCreditUsdc,
          quantityAvailable,
          onchainListingId: onchainListingId || null,
          status: "ACTIVE",
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "CREATE_LISTING",
          entity: "Listing",
          entityId: created.id,
          metaJson: JSON.stringify({
            batchId,
            pricePerCreditUsdc,
            quantityAvailable,
            onchainListingId,
          }),
        },
      });

      return created;
    });

    return jsonSuccess({ listing }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
