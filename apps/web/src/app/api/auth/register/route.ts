import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/api-utils";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["LANDOWNER", "BUYER"]),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum wallet address format")
    .optional()
    .or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      return jsonError("An account with this email already exists", "EMAIL_EXISTS", 400);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        passwordHash,
        role: data.role,
        walletAddress: data.walletAddress ? data.walletAddress : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        walletAddress: true,
        createdAt: true,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "USER_REGISTERED",
        entity: "User",
        entityId: user.id,
        metaJson: JSON.stringify({ email: user.email, role: user.role }),
      },
    });

    return jsonSuccess({ user }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
