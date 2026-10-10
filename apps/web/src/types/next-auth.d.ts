import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "LANDOWNER" | "VERIFIER" | "BUYER" | "ADMIN";
      walletAddress?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: "LANDOWNER" | "VERIFIER" | "BUYER" | "ADMIN";
    walletAddress?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "LANDOWNER" | "VERIFIER" | "BUYER" | "ADMIN";
    walletAddress?: string | null;
  }
}
