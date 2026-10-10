import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateRetirementCertificate, CertificateData } from "@/lib/pdf/certificate";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Search by either database ID or certificateNumber
    const retirement = await prisma.retirement.findFirst({
      where: {
        OR: [{ id }, { certificateNumber: id }],
      },
      include: {
        batch: {
          include: {
            project: true,
          },
        },
        user: true,
      },
    });

    if (!retirement) {
      return NextResponse.json(
        { success: false, error: "Retirement certificate not found" },
        { status: 404 }
      );
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const verificationUrl = `${protocol}://${host}/certificates/${retirement.certificateNumber}`;

    const certData: CertificateData = {
      certificateNumber: retirement.certificateNumber,
      beneficiaryName: retirement.beneficiaryName,
      reason: retirement.reason,
      quantityMilliCredits: retirement.quantity,
      projectName: retirement.batch.project.name,
      country: retirement.batch.project.country,
      region: retirement.batch.project.region,
      latitude: retirement.batch.project.latitude,
      longitude: retirement.batch.project.longitude,
      tokenId: retirement.batch.tokenId,
      txHash: retirement.txHash,
      ipfsCid: retirement.batch.ipfsCid,
      retiredAt: retirement.retiredAt,
      verificationUrl,
    };

    const pdfBytes = await generateRetirementCertificate(certData);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Retirement_Certificate_${retirement.certificateNumber}.pdf"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Error generating certificate PDF:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate certificate PDF" },
      { status: 500 }
    );
  }
}
