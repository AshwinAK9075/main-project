import React from "react";
import { getServerUser } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { TreePine } from "lucide-react";

export default async function NewProjectPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  if (user.role !== "LANDOWNER" && user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="border-b pb-4">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-semibold text-xs">
          <TreePine className="h-4 w-4" />
          <span>Plot Registration</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-1">Register New Forest Carbon Plot</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Submit field inventory tree rows, plot boundary coordinates, and allometric parameters.
        </p>
      </div>

      <ProjectForm />
    </div>
  );
}
