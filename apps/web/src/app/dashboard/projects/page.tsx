import React from "react";
import { getServerUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, TreePine, Eye, MapPin } from "lucide-react";

export default async function ProjectsPage() {
  const user = await getServerUser();
  if (!user) return null;

  const whereClause = user.role === "LANDOWNER" ? { ownerId: user.id } : {};

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      owner: { select: { name: true } },
      calculation: true,
      _count: { select: { trees: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline">DRAFT</Badge>;
      case "SUBMITTED":
        return <Badge variant="warning">SUBMITTED</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="secondary">UNDER REVIEW</Badge>;
      case "VERIFIED":
        return <Badge variant="success">VERIFIED</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">REJECTED</Badge>;
      case "MINTED":
        return <Badge variant="default" className="bg-emerald-700">MINTED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Forest Carbon Projects</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {user.role === "LANDOWNER" ? "Manage your registered forest plots" : "All registered forest plots"}
          </p>
        </div>

        {(user.role === "LANDOWNER" || user.role === "ADMIN") && (
          <Link href="/dashboard/projects/new">
            <Button size="sm" className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
              <Plus className="h-4 w-4" />
              Register New Project
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <TreePine className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-sm">No projects found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Get started by registering a new forest plot with field measurements and coordinates.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 text-xs">
                  <TableHead>Project Name & Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Area (ha)</TableHead>
                  <TableHead>Tree Rows</TableHead>
                  <TableHead>Net Credits (tCO₂e)</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((proj) => (
                  <TableRow key={proj.id} className="text-xs">
                    <TableCell className="font-medium">
                      <div className="space-y-0.5">
                        <Link
                          href={`/dashboard/projects/${proj.id}`}
                          className="font-bold text-foreground hover:text-emerald-700 hover:underline"
                        >
                          {proj.name}
                        </Link>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {proj.region}, {proj.country}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(proj.status)}</TableCell>
                    <TableCell className="font-mono">{proj.areaHectares} ha</TableCell>
                    <TableCell className="font-mono">{proj._count.trees}</TableCell>
                    <TableCell className="font-mono font-semibold text-emerald-800 dark:text-emerald-400">
                      {proj.calculation?.totalNetCredits.toFixed(4) || "--"}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono">
                      {new Date(proj.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/projects/${proj.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
