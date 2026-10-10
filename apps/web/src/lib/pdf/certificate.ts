import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

export interface CertificateData {
  certificateNumber: string;
  beneficiaryName: string;
  reason: string;
  quantityMilliCredits: number; // 1 credit = 0.001 tCO2e
  projectName: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  tokenId: string;
  txHash: string;
  ipfsCid: string;
  retiredAt: Date;
  verificationUrl: string;
}

/**
 * Generates an official PDF Retirement Certificate using pdf-lib.
 * Returns raw Uint8Array PDF bytes.
 */
export async function generateRetirementCertificate(
  data: CertificateData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Standard US Letter Landscape: 792 x 612 pt
  const width = 792;
  const height = 612;
  const page = pdfDoc.addPage([width, height]);

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Palette: Forest Emerald & Slate
  const colorForestDark = rgb(0.04, 0.28, 0.18); // #0a472e
  const colorForestLight = rgb(0.12, 0.53, 0.35); // #1f8759
  const colorSlateMuted = rgb(0.38, 0.44, 0.52); // #617085
  const colorGoldAccent = rgb(0.78, 0.62, 0.22); // #c79e38
  const colorLightBg = rgb(0.97, 0.99, 0.98); // #f7fdfa

  // Outer Border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: colorForestDark,
    borderWidth: 3,
    color: colorLightBg,
  });

  // Inner Decorative Border
  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: colorGoldAccent,
    borderWidth: 1,
  });

  // Top Header Accent Banner
  page.drawRectangle({
    x: 29,
    y: height - 85,
    width: width - 58,
    height: 55,
    color: colorForestDark,
  });

  // Header Title
  const headerTitle = "FOREST CARBON RETIREMENT CERTIFICATE";
  const headerTitleWidth = fontHelveticaBold.widthOfTextAtSize(headerTitle, 18);
  page.drawText(headerTitle, {
    x: (width - headerTitleWidth) / 2,
    y: height - 58,
    size: 18,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  const headerSub = "Transparent Web3 MRV Platform | Immutable Blockchain Proof";
  const headerSubWidth = fontHelvetica.widthOfTextAtSize(headerSub, 10);
  page.drawText(headerSub, {
    x: (width - headerSubWidth) / 2,
    y: height - 74,
    size: 10,
    font: fontHelvetica,
    color: colorGoldAccent,
  });

  // Certificate ID & Date Row
  page.drawText(`Certificate ID: ${data.certificateNumber}`, {
    x: 45,
    y: height - 110,
    size: 10,
    font: fontHelveticaBold,
    color: colorForestDark,
  });

  const dateStr = data.retiredAt.toISOString().split("T")[0];
  page.drawText(`Issue Date: ${dateStr}`, {
    x: width - 170,
    y: height - 110,
    size: 10,
    font: fontHelvetica,
    color: colorSlateMuted,
  });

  // Main Certificate Statement
  const certifyText = "THIS IS TO CERTIFY THAT";
  const certifyWidth = fontHelveticaBold.widthOfTextAtSize(certifyText, 11);
  page.drawText(certifyText, {
    x: (width - certifyWidth) / 2,
    y: height - 145,
    size: 11,
    font: fontHelveticaBold,
    color: colorSlateMuted,
  });

  // Beneficiary Name
  const benText = data.beneficiaryName.toUpperCase();
  const benWidth = fontHelveticaBold.widthOfTextAtSize(benText, 24);
  page.drawText(benText, {
    x: (width - benWidth) / 2,
    y: height - 180,
    size: 24,
    font: fontHelveticaBold,
    color: colorForestDark,
  });

  // Decorative Rule under Beneficiary
  page.drawLine({
    start: { x: (width - Math.max(benWidth, 200)) / 2 - 20, y: height - 190 },
    end: { x: (width + Math.max(benWidth, 200)) / 2 + 20, y: height - 190 },
    thickness: 1.5,
    color: colorGoldAccent,
  });

  // Purpose / Reason
  const purposeText = `has permanently retired verified carbon credits for: "${data.reason}"`;
  const purposeWidth = fontHelveticaOblique.widthOfTextAtSize(purposeText, 12);
  page.drawText(purposeText, {
    x: (width - purposeWidth) / 2,
    y: height - 215,
    size: 12,
    font: fontHelveticaOblique,
    color: rgb(0.2, 0.25, 0.3),
  });

  // Offset Quantity Box
  const tonnes = (data.quantityMilliCredits / 1000).toFixed(3);
  page.drawRectangle({
    x: (width - 320) / 2,
    y: height - 290,
    width: 320,
    height: 60,
    color: rgb(0.92, 0.97, 0.94),
    borderColor: colorForestLight,
    borderWidth: 1.5,
  });

  const quantityStr = `${tonnes} TONNES CO2e`;
  const quantityWidth = fontHelveticaBold.widthOfTextAtSize(quantityStr, 22);
  page.drawText(quantityStr, {
    x: (width - quantityWidth) / 2,
    y: height - 255,
    size: 22,
    font: fontHelveticaBold,
    color: colorForestDark,
  });

  const unitsStr = `(${data.quantityMilliCredits.toLocaleString()} ERC-1155 milli-credits burned from circulation)`;
  const unitsWidth = fontHelvetica.widthOfTextAtSize(unitsStr, 9);
  page.drawText(unitsStr, {
    x: (width - unitsWidth) / 2,
    y: height - 275,
    size: 9,
    font: fontHelvetica,
    color: colorForestLight,
  });

  // Project Information Box (Left)
  page.drawRectangle({
    x: 45,
    y: 110,
    width: 380,
    height: 180,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.85, 0.9, 0.88),
    borderWidth: 1,
  });

  page.drawText("SOURCE FOREST PROJECT", {
    x: 60,
    y: 265,
    size: 11,
    font: fontHelveticaBold,
    color: colorForestDark,
  });

  page.drawText(`Project Name: ${data.projectName}`, {
    x: 60,
    y: 242,
    size: 9.5,
    font: fontHelvetica,
    color: rgb(0.15, 0.2, 0.25),
  });

  page.drawText(`Location: ${data.region}, ${data.country}`, {
    x: 60,
    y: 224,
    size: 9.5,
    font: fontHelvetica,
    color: rgb(0.15, 0.2, 0.25),
  });

  page.drawText(`Coordinates: Lat ${data.latitude.toFixed(4)}, Lon ${data.longitude.toFixed(4)}`, {
    x: 60,
    y: 206,
    size: 9.5,
    font: fontHelvetica,
    color: rgb(0.15, 0.2, 0.25),
  });

  page.drawText(`Token Batch ID: ${data.tokenId}`, {
    x: 60,
    y: 188,
    size: 9.5,
    font: fontHelvetica,
    color: rgb(0.15, 0.2, 0.25),
  });

  const shortTx = `${data.txHash.slice(0, 14)}...${data.txHash.slice(-10)}`;
  page.drawText(`Retire Tx: ${shortTx}`, {
    x: 60,
    y: 170,
    size: 9,
    font: fontHelvetica,
    color: colorSlateMuted,
  });

  const shortCid = `${data.ipfsCid.slice(0, 18)}...${data.ipfsCid.slice(-8)}`;
  page.drawText(`IPFS MRV Report: ${shortCid}`, {
    x: 60,
    y: 152,
    size: 9,
    font: fontHelvetica,
    color: colorSlateMuted,
  });

  // QR Code & Verification Box (Right)
  page.drawRectangle({
    x: 445,
    y: 110,
    width: 300,
    height: 180,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.85, 0.9, 0.88),
    borderWidth: 1,
  });

  page.drawText("PUBLIC VERIFICATION", {
    x: 460,
    y: 265,
    size: 11,
    font: fontHelveticaBold,
    color: colorForestDark,
  });

  page.drawText("Scan QR or visit URL to verify provenance", {
    x: 460,
    y: 245,
    size: 8.5,
    font: fontHelvetica,
    color: colorSlateMuted,
  });

  // Generate QR Code PNG
  try {
    const qrDataUrl = await QRCode.toDataURL(data.verificationUrl, {
      margin: 1,
      width: 110,
      color: {
        dark: "#0a472eff",
        light: "#ffffffff",
      },
    });

    const base64Data = qrDataUrl.split(",")[1];
    const qrImageBytes = Buffer.from(base64Data, "base64");
    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    page.drawImage(qrImage, {
      x: 460,
      y: 125,
      width: 105,
      height: 105,
    });
  } catch (err) {
    console.warn("Failed to embed QR code in certificate:", err);
  }

  page.drawText("Status: PERMANENTLY RETIRED", {
    x: 580,
    y: 195,
    size: 8.5,
    font: fontHelveticaBold,
    color: colorForestLight,
  });

  page.drawText("Standard: MRV Allometric v1.0", {
    x: 580,
    y: 175,
    size: 8,
    font: fontHelvetica,
    color: colorSlateMuted,
  });

  page.drawText("Ledger: Polygon Amoy Testnet", {
    x: 580,
    y: 155,
    size: 8,
    font: fontHelvetica,
    color: colorSlateMuted,
  });

  // Bottom Disclaimer (Required by Project Brief)
  const disclaimer =
    "Estimates use generalized allometric equations and are not certified under Verra, Gold Standard or any registry.";
  const discWidth = fontHelveticaOblique.widthOfTextAtSize(disclaimer, 8);
  page.drawText(disclaimer, {
    x: (width - discWidth) / 2,
    y: 45,
    size: 8,
    font: fontHelveticaOblique,
    color: colorSlateMuted,
  });

  return await pdfDoc.save();
}
