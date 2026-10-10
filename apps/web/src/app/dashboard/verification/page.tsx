import React from "react";
import { getServerUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Eye, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export default async function VerificationQueuePage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  if (user.role !== "VERIFIER" && user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const submissions = await prisma.project.findMany({
    where: {
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
    },
    include: {
      owner: { select: { name: true, email: true } },
      calculation: true,
      _count: { select: { trees: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="border-b pb-4">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-semibold text-xs">
          <ShieldCheck className="h-4 w-4" />
          <span>Independent MRV Audit Portal</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-1">Verification Queue</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pending landowner submissions requiring independent biophysical audit and plot perimeter review.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 text-emerald-600/60 mb-3" />
              <p className="font-semibold text-sm">All submissions reviewed!</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                There are currently no forest plots awaiting verification audit in the queue.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 text-xs">
                  <TableHead>Project & Landowner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Area (ha)</TableHead>
                  <TableHead>Estimated Net Credits</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((proj) => (
                  <TableRow key={proj.id} className="text-xs">
                    <TableCell className="font-medium">
                      <div className="space-y-0.5">
                        <Link
                          href={`/dashboard/verification/${proj.id}`}
                          className="font-bold text-foreground hover:text-emerald-700 hover:underline"
                        >
                          {proj.name}
                        </Link>
                        <p className="text-[11px] text-muted-foreground">
                          By: {proj.owner.name} ({proj.owner.email})
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="warning">{proj.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {proj.region}, {proj.country}
                    </TableCell>
                    <TableCell className="font-mono">{proj.areaHectares} ha</TableCell>
                    <TableCell className="font-mono font-semibold text-emerald-800 dark:text-emerald-400">
                      {proj.calculation?.totalNetCredits.toFixed(4) || "--"} tCO₂e
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono">
                      {new Date(proj.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/verification/${proj.id}`}>
                        <Button size="sm" className="h-8 gap-1 text-xs bg-emerald-700 hover:bg-emerald-800 text-white">
                          <Eye className="h-3.5 w-3.5" />
                          <span>Audit & Review</span>
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
