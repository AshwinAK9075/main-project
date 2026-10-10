import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RetireModal } from "@/components/web3/RetireModal";
import {
  TreePine,
  Flame,
  FileText,
  ExternalLink,
  Download,
  ShoppingBag,
  Coins,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const user = await requireUser();

  // Purchases made by user
  const purchases = await prisma.purchase.findMany({
    where: { buyerId: user.id },
    include: {
      listing: {
        include: {
          batch: {
            include: {
              project: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Projects owned by user that have been minted
  const ownedMintedProjects = await prisma.project.findMany({
    where: { ownerId: user.id, status: "MINTED" },
    include: {
      creditBatch: true,
    },
  });

  // Retirements made by user
  const retirements = await prisma.retirement.findMany({
    where: { userId: user.id },
    include: {
      batch: {
        include: {
          project: true,
        },
      },
    },
    orderBy: { retiredAt: "desc" },
  });

  // Aggregate holdings
  // 1. From purchases
  const batchHoldingsMap = new Map<
    string,
    {
      batchId: string;
      tokenId: string;
      projectName: string;
      totalPurchasedMilliCredits: number;
      totalRetiredMilliCredits: number;
    }
  >();

  for (const p of purchases) {
    const batch = p.listing.batch;
    const existing = batchHoldingsMap.get(batch.id) || {
      batchId: batch.id,
      tokenId: batch.tokenId,
      projectName: batch.project.name,
      totalPurchasedMilliCredits: 0,
      totalRetiredMilliCredits: 0,
    };
    existing.totalPurchasedMilliCredits += p.quantity;
    batchHoldingsMap.set(batch.id, existing);
  }

  // 2. From landowner's own minted projects
  for (const proj of ownedMintedProjects) {
    if (proj.creditBatch) {
      const b = proj.creditBatch;
      const existing = batchHoldingsMap.get(b.id) || {
        batchId: b.id,
        tokenId: b.tokenId,
        projectName: proj.name,
        totalPurchasedMilliCredits: 0,
        totalRetiredMilliCredits: 0,
      };
      existing.totalPurchasedMilliCredits += b.amountMinted;
      batchHoldingsMap.set(b.id, existing);
    }
  }

  // Subtract user retirements
  for (const r of retirements) {
    const existing = batchHoldingsMap.get(r.batchId);
    if (existing) {
      existing.totalRetiredMilliCredits += r.quantity;
    }
  }

  const holdings = Array.from(batchHoldingsMap.values()).map((h) => ({
    ...h,
    netAvailableMilliCredits: Math.max(
      0,
      h.totalPurchasedMilliCredits - h.totalRetiredMilliCredits
    ),
  }));

  const totalHoldingTonnes =
    holdings.reduce((sum, h) => sum + h.netAvailableMilliCredits, 0) / 1000;
  const totalRetiredTonnes =
    retirements.reduce((sum, r) => sum + r.quantity, 0) / 1000;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Carbon Portfolio & Retirements
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your on-chain verified credits, track inventory, and burn credits for official retirement certificates.
          </p>
        </div>

        <Link href="/marketplace">
          <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span>Browse Marketplace</span>
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 border-emerald-800/20 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-semibold uppercase">
                Active Carbon Holdings
              </span>
              <div className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-300 mt-1">
                {totalHoldingTonnes.toFixed(3)}
                <span className="text-sm font-normal text-muted-foreground ml-1.5">
                  tCO₂e
                </span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 flex items-center justify-center">
              <TreePine className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Available in your custody on EVM testnet. Can be listed or retired.
          </p>
        </Card>

        <Card className="p-6 border-amber-800/20 bg-amber-50/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-semibold uppercase">
                Permanently Retired
              </span>
              <div className="text-3xl font-extrabold text-amber-800 dark:text-amber-300 mt-1">
                {totalRetiredTonnes.toFixed(3)}
                <span className="text-sm font-normal text-muted-foreground ml-1.5">
                  tCO₂e
                </span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 flex items-center justify-center">
              <Flame className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Burned from circulation with official PDF certificates issued.
          </p>
        </Card>
      </div>

      {/* Section 1: Active Holdings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="h-5 w-5 text-emerald-700" />
            <span>Active Credit Batches</span>
          </h2>
          <span className="text-xs text-muted-foreground">
            {holdings.length} distinct project batches
          </span>
        </div>

        {holdings.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p className="text-sm">You currently hold no active carbon credits.</p>
            <div className="pt-3">
              <Link href="/marketplace">
                <Button size="sm" variant="outline">
                  Visit Marketplace
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="rounded-md border bg-white dark:bg-slate-900 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Project Name</TableHead>
                  <TableHead>Token ID</TableHead>
                  <TableHead>Available Balance</TableHead>
                  <TableHead>Total Acquired</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((h) => {
                  const availTonnes = h.netAvailableMilliCredits / 1000;
                  const totalTonnes = h.totalPurchasedMilliCredits / 1000;

                  return (
                    <TableRow key={h.batchId}>
                      <TableCell className="font-semibold text-sm">
                        {h.projectName}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        #{h.tokenId}
                      </TableCell>
                      <TableCell className="font-bold text-emerald-700 dark:text-emerald-400">
                        {availTonnes.toFixed(3)} tCO₂e
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {totalTonnes.toFixed(3)} tCO₂e
                      </TableCell>
                      <TableCell className="text-right">
                        {h.netAvailableMilliCredits > 0 ? (
                          <RetireModal
                            batchId={h.batchId}
                            tokenId={h.tokenId}
                            projectName={h.projectName}
                            maxMilliCredits={h.netAvailableMilliCredits}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">Fully Retired</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Section 2: Retired Certificates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-700" />
            <span>Retirement History & Official Certificates</span>
          </h2>
          <span className="text-xs text-muted-foreground">
            {retirements.length} retirement events
          </span>
        </div>

        {retirements.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No carbon credits have been retired yet.</p>
          </Card>
        ) : (
          <div className="rounded-md border bg-white dark:bg-slate-900 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Certificate ID</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Certificate Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retirements.map((r) => {
                  const tonnes = (r.quantity / 1000).toFixed(3);

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-400">
                        <Link
                          href={`/certificates/${r.certificateNumber}`}
                          className="hover:underline flex items-center gap-1"
                        >
                          <span>{r.certificateNumber}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {r.batch.project.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{r.beneficiaryName}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1">
                          {r.reason}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-xs text-amber-800 dark:text-amber-300">
                        {tonnes} tCO₂e
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.retiredAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/certificates/${r.certificateNumber}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                              <FileText className="h-3.5 w-3.5" />
                              <span>View</span>
                            </Button>
                          </Link>
                          <a
                            href={`/api/certificates/${r.certificateNumber}/pdf`}
                            download={`Retirement_Certificate_${r.certificateNumber}.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1 text-emerald-700 hover:text-emerald-800"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>PDF</span>
                            </Button>
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
