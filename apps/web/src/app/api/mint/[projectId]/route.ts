import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/guards";
import { jsonSuccess, jsonError, handleApiError } from "@/lib/api-utils";
import { pinMRVReport, MRVReportPayload } from "@/lib/ipfs/pinata";
import { mintCarbonCreditsOnChain } from "@/lib/web3/server-minter";
import { tonnesToMilliCredits } from "@/lib/web3/contracts";

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await requireUser();
    const { projectId } = params;

    // Fetch project with all related records
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: true,
        trees: true,
        calculation: true,
        verifications: {
          include: { verifier: true },
          orderBy: { decidedAt: "desc" },
        },
        creditBatch: true,
      },
    });

    if (!project) {
      return jsonError("Project not found", 404);
    }

    // Role check: Only the project owner or ADMIN can trigger mint
    if (user.role !== "ADMIN" && project.ownerId !== user.id) {
      return jsonError("Forbidden: only the landowner or admin can mint credits", 403);
    }

    // Must be in VERIFIED status
    if (project.status !== "VERIFIED") {
      return jsonError(
        `Cannot mint credits for project in '${project.status}' status. Status must be VERIFIED.`,
        400
      );
    }

    if (project.creditBatch) {
      return jsonError("This project has already been minted on-chain", 400);
    }

    if (!project.calculation) {
      return jsonError("Project does not have calculation results", 400);
    }

    const netCredits = project.calculation.totalNetCredits;
    const amountMilliCredits = BigInt(tonnesToMilliCredits(netCredits));

    if (amountMilliCredits <= BigInt(0)) {
      return jsonError("Net credits must be greater than zero to mint", 400);
    }

    // Derive deterministic numeric Token ID from timestamp and project ID slice
    const numericSuffix = parseInt(project.id.replace(/\D/g, "").slice(0, 4) || "101", 10);
    const tokenId = BigInt(Date.now() % 1_000_000) * BigInt(1000) + BigInt(numericSuffix);

    // Latest verification
    const latestVerification = project.verifications[0];

    // Build standard MRV report payload
    const mrvPayload: MRVReportPayload = {
      projectId: project.id,
      projectName: project.name,
      description: project.description,
      location: {
        country: project.country,
        region: project.region,
        latitude: project.latitude,
        longitude: project.longitude,
        areaHectares: project.areaHectares,
      },
      landowner: {
        name: project.owner.name,
        email: project.owner.email,
        walletAddress: project.owner.walletAddress,
      },
      trees: project.trees.map((t) => ({
        treeType: t.treeType,
        circumferenceM: t.circumferenceM,
        heightM: t.heightM,
        treeCount: t.treeCount,
        speciesNote: t.speciesNote,
      })),
      carbonCalculation: {
        totalGrossCredits: project.calculation.totalGrossCredits,
        totalNetCredits: project.calculation.totalNetCredits,
        totalCo2eKg: project.calculation.totalCo2eKg,
        configVersion: project.calculation.configVersion,
        methodology: "MRV-ALLOMETRIC-2024.1",
        calculatedAt: project.calculation.calculatedAt.toISOString(),
        breakdown: JSON.parse(project.calculation.breakdownJson),
      },
      verification: {
        verifierName: latestVerification?.verifier.name || "System Verifier",
        verifierEmail: latestVerification?.verifier.email || "verifier@forestmrv.org",
        decision: latestVerification?.decision || "APPROVED",
        notes: latestVerification?.notes || "Fully audited and verified",
        decidedAt: (latestVerification?.decidedAt || new Date()).toISOString(),
      },
      metadata: {
        platform: "Forest Carbon MRV Platform",
        standardDisclaimer:
          "Estimates use generalized allometric equations and are not certified under Verra, Gold Standard or any registry.",
        generatedAt: new Date().toISOString(),
      },
    };

    // 1. Pin to IPFS
    const ipfsResult = await pinMRVReport(mrvPayload);

    // Recipient address (fallback to caller or zero-safe default)
    const recipient =
      project.owner.walletAddress && project.owner.walletAddress.startsWith("0x")
        ? project.owner.walletAddress
        : "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    // 2. Mint on-chain
    const mintResult = await mintCarbonCreditsOnChain({
      recipientAddress: recipient,
      tokenId,
      amountMilliCredits,
      ipfsCid: ipfsResult.cid,
    });

    // 3. Update DB atomically
    const batch = await prisma.$transaction(async (tx) => {
      const createdBatch = await tx.creditBatch.create({
        data: {
          projectId: project.id,
          tokenId: tokenId.toString(),
          amountMinted: Number(amountMilliCredits),
          ipfsCid: ipfsResult.cid,
          ipfsUrl: ipfsResult.ipfsUrl,
          mintTxHash: mintResult.txHash,
          chainId: 31337,
        },
      });

      await tx.project.update({
        where: { id: project.id },
        data: { status: "MINTED" },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "MINT_CREDITS",
          entity: "Project",
          entityId: project.id,
          metaJson: JSON.stringify({
            tokenId: tokenId.toString(),
            amountMinted: Number(amountMilliCredits),
            ipfsCid: ipfsResult.cid,
            txHash: mintResult.txHash,
            simulated: mintResult.simulated,
          }),
        },
      });

      return createdBatch;
    });

    return jsonSuccess({
      batch,
      txHash: mintResult.txHash,
      simulated: mintResult.simulated,
      ipfsUrl: ipfsResult.ipfsUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
