import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { prisma } from "@/lib/db/prisma";

export type Role = "LANDOWNER" | "VERIFIER" | "BUYER" | "ADMIN";

export async function getServerUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getServerUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Authentication required");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`FORBIDDEN: Requires one of [${allowedRoles.join(", ")}]`);
  }
  return user;
}

export async function assertProjectOwnership(projectId: string, user: { id: string; role: Role }) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Admins have override access, landowners must be the project owner
  if (user.role !== "ADMIN" && project.ownerId !== user.id) {
    throw new Error("FORBIDDEN: You do not own this project");
  }

  return project;
}
