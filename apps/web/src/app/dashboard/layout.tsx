import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { getServerUser } from "@/lib/auth/guards";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <div className="flex-1 p-6 md:p-8 bg-muted/20 overflow-y-auto">{children}</div>
    </div>
  );
}
