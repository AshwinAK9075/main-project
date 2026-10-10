import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { pinMRVReport, MRVReportPayload } from "@/lib/ipfs/pinata";
import { generateRetirementCertificate, CertificateData } from "@/lib/pdf/certificate";
import {
  tonnesToMilliCredits,
  milliCreditsToTonnes,
  formatTonnesCo2e,
} from "@/lib/web3/contracts";

describe("Phase 5: Web3, Marketplace & Retirement Pipeline", () => {
  it("converts between metric tonnes and on-chain milli-credits correctly", () => {
    expect(tonnesToMilliCredits(5.25)).toBe(5250);
    expect(tonnesToMilliCredits(0.001)).toBe(1);
    expect(milliCreditsToTonnes(5250)).toBe(5.25);
    expect(formatTonnesCo2e(5250)).toBe("5.250");
  });

  it("pins an MRV report to IPFS and returns a valid CID and gateway URL", async () => {
    const samplePayload: MRVReportPayload = {
      projectId: "test-proj-001",
      projectName: "Pacific Northwest Old Growth Preserve",
      description: "Restoration of native Douglas-fir forest canopy",
      location: {
        country: "USA",
        region: "Oregon",
        latitude: 45.5152,
        longitude: -122.6784,
        areaHectares: 12.5,
      },
      landowner: {
        name: "Test Landowner",
        email: "landowner@example.com",
      },
      trees: [
        {
          treeType: "SOFTWOOD_CONIFER",
          circumferenceM: 1.2,
          heightM: 22.0,
          treeCount: 50,
        },
      ],
      carbonCalculation: {
        totalGrossCredits: 38.45,
        totalNetCredits: 34.605,
        totalCo2eKg: 38450,
        configVersion: "v1.0.0",
        methodology: "MRV-ALLOMETRIC-2024.1",
        calculatedAt: new Date().toISOString(),
        breakdown: {},
      },
      verification: {
        verifierName: "Auditor Smith",
        verifierEmail: "auditor@example.com",
        decision: "APPROVED",
        decidedAt: new Date().toISOString(),
      },
      metadata: {
        platform: "Forest Carbon MRV Platform",
        standardDisclaimer:
          "Estimates use generalized allometric equations and are not certified under Verra, Gold Standard or any registry.",
        generatedAt: new Date().toISOString(),
      },
    };

    const res = await pinMRVReport(samplePayload);
    expect(res.cid).toBeDefined();
    expect(res.cid.length).toBeGreaterThan(10);
    expect(res.ipfsUrl).toContain(res.cid);
  });

  it("generates an official retirement PDF certificate with embedded QR code", async () => {
    const certData: CertificateData = {
      certificateNumber: "RET-2026-AB12CD",
      beneficiaryName: "Acme Sustainable Logistics Inc.",
      reason: "FY2026 Fleet Decarbonization Scope 1 Offset",
      quantityMilliCredits: 5000, // 5.000 tCO2e
      projectName: "Willamette Valley Reforestation",
      country: "USA",
      region: "Oregon",
      latitude: 44.9429,
      longitude: -123.0351,
      tokenId: "101",
      txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      ipfsCid: "bafkreihdwdcefghijk1234567890",
      retiredAt: new Date(),
      verificationUrl: "http://localhost:3000/certificates/RET-2026-AB12CD",
    };

    const pdfBytes = await generateRetirementCertificate(certData);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);

    // Check PDF magic header "%PDF-"
    const magic = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(magic).toBe("%PDF-");
  });

  it("executes the full database lifecycle: verified project -> credit batch -> listing -> purchase -> retirement", async () => {
    // 1. Get or create a sample verified project
    const landowner = await prisma.user.findFirst({ where: { role: "LANDOWNER" } });
    const buyer = await prisma.user.findFirst({ where: { role: "BUYER" } });
    expect(landowner).toBeDefined();
    expect(buyer).toBeDefined();

    const project = await prisma.project.create({
      data: {
        ownerId: landowner!.id,
        name: "Olympic Peninsula Carbon Reserve",
        description: "Dense conifer and mixed hardwood stand",
        country: "USA",
        region: "Washington",
        latitude: 47.8,
        longitude: -123.6,
        areaHectares: 8.0,
        status: "VERIFIED",
      },
    });

    const calculation = await prisma.calculationResult.create({
      data: {
        projectId: project.id,
        totalGrossCredits: 20.0,
        totalNetCredits: 18.0,
        totalCo2eKg: 20000.0,
        breakdownJson: JSON.stringify({}),
      },
    });

    // 2. Mint batch
    const amountMinted = tonnesToMilliCredits(calculation.totalNetCredits); // 18,000 milli-credits
    const tokenId = `tok_${Date.now()}`;
    const batch = await prisma.creditBatch.create({
      data: {
        projectId: project.id,
        tokenId,
        amountMinted,
        ipfsCid: "bafkreitestcid123",
        ipfsUrl: "https://ipfs.io/ipfs/bafkreitestcid123",
        mintTxHash: "0xmock_mint_tx_hash",
        chainId: 31337,
      },
    });

    await prisma.project.update({
      where: { id: project.id },
      data: { status: "MINTED" },
    });

    expect(batch.amountMinted).toBe(18000);

    // 3. Create listing
    const listing = await prisma.listing.create({
      data: {
        batchId: batch.id,
        sellerId: landowner!.id,
        pricePerCreditUsdc: 30.0,
        quantityAvailable: 10000, // list 10.0 tonnes
        status: "ACTIVE",
      },
    });

    expect(listing.status).toBe("ACTIVE");
    expect(listing.quantityAvailable).toBe(10000);

    // 4. Buyer purchases 4.0 tonnes (4000 milli-credits)
    const buyQty = 4000;
    const purchase = await prisma.purchase.create({
      data: {
        listingId: listing.id,
        buyerId: buyer!.id,
        quantity: buyQty,
        totalUsdc: (buyQty / 1000) * listing.pricePerCreditUsdc, // 120 USDC
        txHash: "0xmock_purchase_tx",
      },
    });

    await prisma.listing.update({
      where: { id: listing.id },
      data: { quantityAvailable: listing.quantityAvailable - buyQty },
    });

    expect(purchase.totalUsdc).toBe(120.0);

    // 5. Buyer retires 2.5 tonnes (2500 milli-credits)
    const retireQty = 2500;
    const certNum = `RET-2026-TEST-${Date.now().toString().slice(-4)}`;
    const retirement = await prisma.retirement.create({
      data: {
        batchId: batch.id,
        userId: buyer!.id,
        quantity: retireQty,
        beneficiaryName: "Buyer Corp Green Initiative",
        reason: "Scope 3 emissions offset",
        txHash: "0xmock_retire_burn_tx",
        certificateNumber: certNum,
      },
      include: {
        batch: {
          include: { project: true },
        },
      },
    });

    expect(retirement.certificateNumber).toBe(certNum);
    expect(retirement.quantity).toBe(2500);
    expect(retirement.batch.project.name).toBe("Olympic Peninsula Carbon Reserve");
  });
});
