import React from "react";
import { getServerUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import { StatusTimeline } from "@/components/projects/StatusTimeline";
import { PlotMap } from "@/components/map/PlotMap";
import { ResultsPanel } from "@/components/calculator/ResultsPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TreePine,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  Send,
  Coins,
  ArrowLeft,
  FileCheck2,
} from "lucide-react";
import Link from "next/link";
import { PlotCalculationResult } from "@/lib/carbon/types";
import { ProjectSubmitButton } from "./ProjectSubmitButton";

import { ProjectMintButton } from "./ProjectMintButton";
import { CreateListingModal } from "./CreateListingModal";

interface PageProps {
  params: { id: string };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, email: true, walletAddress: true } },
      trees: true,
      calculation: true,
      verifications: {
        include: { verifier: { select: { name: true, email: true } } },
        orderBy: { decidedAt: "desc" },
      },
      creditBatch: true,
    },
  });

  if (!project) notFound();

  // Role guard: Landowners can only see their own projects
  if (user.role === "LANDOWNER" && project.ownerId !== user.id) {
    redirect("/dashboard/projects");
  }

  let parsedCalculation: PlotCalculationResult | null = null;
  if (project.calculation?.breakdownJson) {
    try {
      parsedCalculation = JSON.parse(project.calculation.breakdownJson);
    } catch {
      parsedCalculation = null;
    }
  }

  const isOwner = project.ownerId === user.id;
  const canSubmit = (isOwner || user.role === "ADMIN") && (project.status === "DRAFT" || project.status === "REJECTED");
  const canVerify = (user.role === "VERIFIER" || user.role === "ADMIN") && (project.status === "SUBMITTED" || project.status === "UNDER_REVIEW");
  const canMint = (isOwner || user.role === "ADMIN") && project.status === "VERIFIED" && !project.creditBatch;
  const canList = (isOwner || user.role === "ADMIN") && project.status === "MINTED" && project.creditBatch;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Back and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Projects</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              {project.region}, {project.country}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              Owner: {project.owner.name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Created {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canSubmit && <ProjectSubmitButton projectId={project.id} />}

          {canVerify && (
            <Link href={`/dashboard/verification/${project.id}`}>
              <Button size="sm" className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
                <ShieldCheck className="h-4 w-4" />
                Review & Verify
              </Button>
            </Link>
          )}

          {canMint && <ProjectMintButton projectId={project.id} />}

          {canList && (
            <CreateListingModal
              batchId={project.creditBatch!.id}
              totalMintedMilliCredits={project.creditBatch!.amountMinted}
            />
          )}
        </div>
      </div>

      {/* Status Progress Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Project Lifecycle Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline
            status={project.status}
            rejectionReason={project.rejectionReason}
          />
        </CardContent>
      </Card>

      {/* Minted Credit Batch Banner */}
      {project.creditBatch && (
        <Card className="border-emerald-600/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-700" />
              <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                On-Chain Credit Batch Minted (ERC-1155 Token #{project.creditBatch.tokenId})
              </h3>
            </div>
            <Badge className="bg-emerald-700 text-white text-xs">
              {(project.creditBatch.amountMinted / 1000).toFixed(3)} tCO₂e Issued
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block">IPFS MRV Report:</span>
              <a
                href={project.creditBatch.ipfsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>{project.creditBatch.ipfsCid.slice(0, 16)}...</span>
                <FileCheck2 className="h-3 w-3" />
              </a>
            </div>
            <div>
              <span className="text-muted-foreground block">Mint Transaction:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {project.creditBatch.mintTxHash.slice(0, 18)}...
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Minted Date:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {new Date(project.creditBatch.mintedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Plot Map & Description */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Forest Plot Overview</CardTitle>
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
                  <span className="text-muted-foreground block text-[10px]">Surface Area</span>
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

          {/* Tree Measurements Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Field Inventory Measurements</CardTitle>
              <CardDescription className="text-xs">
                {project.trees.length} recorded tree measurement stands
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 text-xs">
                    <TableHead>#</TableHead>
                    <TableHead>Species / Model</TableHead>
                    <TableHead>Circumference</TableHead>
                    <TableHead>Height</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Species Note</TableHead>
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

        {/* Calculation Results Panel */}
        <div className="lg:col-span-5 space-y-6">
          <ResultsPanel result={parsedCalculation} areaHectares={project.areaHectares} />

          {/* Verification Audit Log */}
          {project.verifications.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-emerald-600" />
                  Verification Audit History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {project.verifications.map((v) => (
                  <div key={v.id} className="p-3 rounded-lg border bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant={v.decision === "APPROVED" ? "success" : "destructive"}>
                        {v.decision}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(v.decidedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      Verifier: <strong>{v.verifier.name}</strong>
                    </p>
                    {v.notes && (
                      <p className="text-[11px] bg-background p-2 rounded border mt-1">
                        &quot;{v.notes}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
