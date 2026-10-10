import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/guards";
import { jsonSuccess, jsonError, handleApiError } from "@/lib/api-utils";
import { buyCreditsSchema } from "@/lib/validation/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const parsed = buyCreditsSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", 400, parsed.error.flatten());
    }

    const { quantity, txHash } = parsed.data;

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: { batch: { include: { project: true } } },
    });

    if (!listing) {
      return jsonError("Listing not found", 404);
    }

    if (listing.status !== "ACTIVE") {
      return jsonError("Listing is no longer active", 400);
    }

    if (quantity > listing.quantityAvailable) {
      return jsonError(
        `Requested ${quantity} milli-credits, but only ${listing.quantityAvailable} available`,
        400
      );
    }

    const totalUsdc = (quantity / 1000) * listing.pricePerCreditUsdc;
    const remainingQuantity = listing.quantityAvailable - quantity;
    const newStatus = remainingQuantity === 0 ? "SOLD_OUT" : "ACTIVE";

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          listingId: listing.id,
          buyerId: user.id,
          quantity,
          totalUsdc,
          txHash: txHash || `0xmock_buy_${Date.now()}`,
        },
      });

      const updatedListing = await tx.listing.update({
        where: { id: listing.id },
        data: {
          quantityAvailable: remainingQuantity,
          status: newStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "BUY_CREDITS",
          entity: "Listing",
          entityId: listing.id,
          metaJson: JSON.stringify({
            purchaseId: purchase.id,
            quantity,
            totalUsdc,
            txHash,
          }),
        },
      });

      return { purchase, updatedListing };
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
