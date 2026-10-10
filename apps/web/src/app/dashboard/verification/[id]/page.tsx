import React from "react";
import { getServerUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import { StatusTimeline } from "@/components/projects/StatusTimeline";
import { PlotMap } from "@/components/map/PlotMap";
import { ResultsPanel } from "@/components/calculator/ResultsPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ShieldCheck, User, MapPin, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import { PlotCalculationResult } from "@/lib/carbon/types";
import { VerificationActions } from "./VerificationActions";

interface PageProps {
  params: { id: string };
}

export default async function VerificationReviewPage({ params }: PageProps) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  if (user.role !== "VERIFIER" && user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, email: true, walletAddress: true } },
      trees: true,
      calculation: true,
      verifications: true,
    },
  });

  if (!project) notFound();

  let parsedCalculation: PlotCalculationResult | null = null;
  if (project.calculation?.breakdownJson) {
    try {
      parsedCalculation = JSON.parse(project.calculation.breakdownJson);
    } catch {
      parsedCalculation = null;
    }
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <Link
            href="/dashboard/verification"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Queue</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Audit: {project.name}</h1>
            <Badge variant="warning">{project.status}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              Applicant: {project.owner.name} ({project.owner.email})
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              {project.region}, {project.country}
            </span>
          </div>
        </div>

        <VerificationActions projectId={project.id} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {/* Plot Boundaries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Plot Boundary Verification</CardTitle>
              <CardDescription className="text-xs">{project.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border">
                <PlotMap
                  latitude={project.latitude}
                  longitude={project.longitude}
                  interactive={false}
                  height="260px"
                  projectName={project.name}
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-muted/30 border">
                  <span className="text-muted-foreground block text-[10px]">Claimed Area</span>
                  <strong className="font-mono">{project.areaHectares} ha</strong>
                </div>
                <div className="p-2 rounded bg-muted/30 border">
                  <span className="text-muted-foreground block text-[10px]">Latitude</span>
                  <strong className="font-mono">{project.latitude.toFixed(5)}</strong>
                </div>
                <div className="p-2 rounded bg-muted/30 border">
                  <span className="text-muted-foreground block text-[10px]">Longitude</span>
                  <strong className="font-mono">{project.longitude.toFixed(5)}</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submitted Tree Measurements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Submitted Tree Measurements</CardTitle>
              <CardDescription className="text-xs">
                Review submitted species allometric models, DBH, and height
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 text-xs">
                    <TableHead>#</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Circumference</TableHead>
                    <TableHead>Height</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.trees.map((t, idx) => (
                    <TableRow key={t.id} className="text-xs">
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">
                        {t.treeType.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="font-mono">{t.circumferenceM} m</TableCell>
                      <TableCell className="font-mono">{t.heightM} m</TableCell>
                      <TableCell className="font-mono font-semibold">{t.treeCount}</TableCell>
                      <TableCell className="text-muted-foreground italic">
                        {t.speciesNote || "--"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Calculation Audit Results */}
        <div className="lg:col-span-5 space-y-6">
          <ResultsPanel result={parsedCalculation} areaHectares={project.areaHectares} />
        </div>
      </div>
    </div>
  );
}
