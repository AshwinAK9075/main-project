import React from "react";
import { getServerUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Users, History, FileCode2 } from "lucide-react";

export default async function AdminPage() {
  const user = await getServerUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });

  const activeConfig = await prisma.carbonConfig.findFirst({
    where: { isActive: true },
  });

  const auditLogs = await prisma.auditLog.findMany({
    take: 30,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true, email: true, role: true } } },
  });

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="border-b pb-4">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-semibold text-xs">
          <Settings className="h-4 w-4" />
          <span>System Administration</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-1">Platform Governance & Configuration</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          User roles, biophysical allometric configuration versioning, and immutable audit logs.
        </p>
      </div>

      {/* Carbon Coefficients Config Version */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base font-bold">Active Allometric Configuration</CardTitle>
            </div>
            <Badge variant="success">Version: {activeConfig?.version || "v1.0.0"}</Badge>
          </div>
          <CardDescription className="text-xs">
            Parameters utilized for automated server-side verification and minting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-3.5 rounded-lg bg-muted text-[11px] font-mono overflow-x-auto text-muted-foreground border">
            {JSON.stringify(JSON.parse(activeConfig?.valuesJson || "{}"), null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-base font-bold">Registered Users ({users.length})</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Platform accounts across all four security roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-xs">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Wallet Address</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="text-xs">
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-bold">{u.name}</p>
                      <p className="text-[11px] text-muted-foreground">{u.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {u.walletAddress ? `${u.walletAddress.substring(0, 8)}...${u.walletAddress.substring(36)}` : "None"}
                  </TableCell>
                  <TableCell className="font-mono">{u._count.projects}</TableCell>
                  <TableCell className="text-muted-foreground font-mono">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Immutable Audit Logs Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-base font-bold">Audit Trail (Recent 30 Events)</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Append-only record of all project state transitions, registrations, and transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-xs">
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id} className="text-xs">
                  <TableCell className="font-mono font-bold text-emerald-800 dark:text-emerald-400">
                    {log.action}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{log.actor.name}</span>
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        {log.actor.role}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {log.entity}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-[11px] font-mono text-muted-foreground">
                    {log.metaJson || "--"}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
