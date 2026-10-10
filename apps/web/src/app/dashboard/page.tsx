import React from "react";
import { getServerUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  TreePine,
  ShieldCheck,
  Coins,
  FileCheck2,
  ArrowRight,
  TrendingUp,
  Layers,
  Clock,
} from "lucide-react";

export default async function DashboardOverviewPage() {
  const user = await getServerUser();
  if (!user) return null;

  // Query stats according to role
  const totalProjects = await prisma.project.count({
    where: user.role === "LANDOWNER" ? { ownerId: user.id } : {},
  });

  const pendingVerification = await prisma.project.count({
    where: { status: "SUBMITTED" },
  });

  const verifiedProjects = await prisma.project.count({
    where: user.role === "LANDOWNER" ? { ownerId: user.id, status: "VERIFIED" } : { status: "VERIFIED" },
  });

  const mintedBatches = await prisma.creditBatch.count();

  const totalRetirements = await prisma.retirement.count({
    where: user.role === "BUYER" ? { userId: user.id } : {},
  });

  // Recent activity logs
  const recentLogs = await prisma.auditLog.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true, role: true } } },
  });

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Signed in as <strong>{user.name}</strong> ({user.role})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user.role === "LANDOWNER" && (
            <Link href="/dashboard/projects/new">
              <Button size="sm" className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
                <TreePine className="h-4 w-4" />
                Register Forest Plot
              </Button>
            </Link>
          )}
          {user.role === "VERIFIER" && (
            <Link href="/dashboard/verification">
              <Button size="sm" className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
                <ShieldCheck className="h-4 w-4" />
                Review Queue ({pendingVerification})
              </Button>
            </Link>
          )}
          {user.role === "BUYER" && (
            <Link href="/marketplace">
              <Button size="sm" className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
                <Coins className="h-4 w-4" />
                Explore Marketplace
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Total Projects
              <TreePine className="h-4 w-4 text-emerald-600" />
            </span>
            <CardTitle className="text-2xl font-bold font-mono">{totalProjects}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground">
              {user.role === "LANDOWNER" ? "Owned by you" : "Across platform"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Awaiting Review
              <Clock className="h-4 w-4 text-amber-500" />
            </span>
            <CardTitle className="text-2xl font-bold font-mono text-amber-600">
              {pendingVerification}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground">Pending verifier audit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Verified & Minted
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </span>
            <CardTitle className="text-2xl font-bold font-mono text-emerald-700">
              {mintedBatches}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground">ERC-1155 token batches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Retirements
              <FileCheck2 className="h-4 w-4 text-blue-600" />
            </span>
            <CardTitle className="text-2xl font-bold font-mono text-blue-600">
              {totalRetirements}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground">Permanent offsets</p>
          </CardContent>
        </Card>
      </div>

      {/* Role-Specific Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                Recent System Activity & Audit Trail
              </CardTitle>
              <CardDescription className="text-xs">
                Immutable audit log of state changes and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No recent activity</p>
                ) : (
                  recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border text-xs bg-muted/20"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-foreground">
                            {log.action}
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0">
                            {log.entity}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Actor: <strong>{log.actor.name}</strong> ({log.actor.role})
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Quick Navigation</CardTitle>
              <CardDescription className="text-xs">Direct role portals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/projects" className="block">
                <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                  <span>View Projects</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link href="/marketplace" className="block">
                <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                  <span>Credit Marketplace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link href="/calculator" className="block">
                <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                  <span>Public Calculator</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/dashboard/admin" className="block">
                  <Button variant="secondary" size="sm" className="w-full justify-between text-xs">
                    <span>Admin Configuration</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
