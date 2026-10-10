import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlotMap } from "@/components/map/PlotMap";
import { BuyCreditsModal } from "@/components/web3/BuyCreditsModal";
import {
  TreePine,
  MapPin,
  ShieldCheck,
  ExternalLink,
  ChevronLeft,
  FileCheck2,
  Coins,
  CheckCircle,
} from "lucide-react";
import { CONTRACT_ADDRESSES } from "@/lib/web3/contracts";

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({
  params,
}: {
  params: { listingId: string };
}) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.listingId },
    include: {
      batch: {
        include: {
          project: {
            include: {
              owner: true,
              trees: true,
              calculation: true,
              verifications: {
                include: { verifier: true },
                orderBy: { decidedAt: "desc" },
              },
            },
          },
        },
      },
    },
  });

  if (!listing) {
    notFound();
  }

  const project = listing.batch.project;
  const calc = project.calculation;
  const verification = project.verifications[0];
  const availableTonnes = listing.quantityAvailable / 1000;
  const totalTonnes = listing.batch.amountMinted / 1000;

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center gap-2">
        <Link href="/marketplace">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Marketplace</span>
          </Button>
        </Link>
      </div>

      {/* Main Grid: Left Details & Right Buy Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                Verified & Minted
              </Badge>
              <Badge variant="outline">ERC-1155 Token #{listing.batch.tokenId}</Badge>
              <Badge variant="outline" className="bg-slate-50">
                Batch: {listing.batch.id.slice(0, 10)}...
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {project.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                {project.region}, {project.country} (Coordinates: {project.latitude.toFixed(4)}, {project.longitude.toFixed(4)})
              </span>
            </div>
          </div>

          {/* Description */}
          <Card className="p-6 space-y-3">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Project Description</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {project.description}
            </p>
            <div className="pt-2 text-xs text-muted-foreground flex gap-4">
              <span><strong>Landowner:</strong> {project.owner.name}</span>
              <span><strong>Plot Area:</strong> {project.areaHectares} Hectares</span>
            </div>
          </Card>

          {/* Map Preview */}
          <Card className="p-6 space-y-3">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Plot Location Map</h2>
            <PlotMap
              latitude={project.latitude}
              longitude={project.longitude}
              projectName={project.name}
              className="h-72 w-full rounded-md"
            />
          </Card>

          {/* Field Measurement Trees */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">Field Inventory Measurements</h2>
              <span className="text-xs text-muted-foreground">{project.trees.length} measurement rows</span>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Allometric Model</TableHead>
                    <TableHead>Circumference</TableHead>
                    <TableHead>Height</TableHead>
                    <TableHead>Tree Count</TableHead>
                    <TableHead>Species / Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.trees.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-xs">
                        {t.treeType.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{t.circumferenceM} m</TableCell>
                      <TableCell className="font-mono text-xs">{t.heightM} m</TableCell>
                      <TableCell className="font-mono text-xs">{t.treeCount}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.speciesNote || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Verification & MRV Provenance */}
          <Card className="p-6 space-y-4 bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-800/20">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-emerald-700" />
              <h2 className="font-bold text-base text-emerald-900 dark:text-emerald-300">
                Audited MRV Provenance & Smart Contract Data
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground block">Audited By:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {verification?.verifier.name || "Accredited Verifier"} ({verification?.verifier.email})
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block">Audit Decision:</span>
                <span className="font-medium text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> APPROVED ({verification?.decidedAt ? new Date(verification.decidedAt).toLocaleDateString() : "Verified"})
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block">IPFS MRV Report Hash:</span>
                <a
                  href={listing.batch.ipfsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>{listing.batch.ipfsCid.slice(0, 16)}...</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block">Mint Tx Hash:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {listing.batch.mintTxHash.slice(0, 16)}...
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Buy Widget */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6 border-emerald-800/30 shadow-lg sticky top-24">
            <div>
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Unit Listing Price
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400">
                  ${listing.pricePerCreditUsdc.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">USDC / tonne CO₂e</span>
              </div>
            </div>

            <div className="space-y-3 border-y py-4 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available Credits:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {availableTonnes.toFixed(3)} tCO₂e
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Batch Issued:</span>
                <span className="font-medium">{totalTonnes.toFixed(3)} tCO₂e</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Measured:</span>
                <span className="font-medium">
                  {calc ? (calc.totalGrossCredits).toFixed(3) : "—"} tCO₂e
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Buffer (10%):</span>
                <span className="font-medium text-amber-700">
                  {calc ? ((calc.totalGrossCredits - calc.totalNetCredits)).toFixed(3) : "—"} tCO₂e
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <BuyCreditsModal
                listingId={listing.id}
                onchainListingId={listing.onchainListingId}
                projectName={project.name}
                pricePerCreditUsdc={listing.pricePerCreditUsdc}
                quantityAvailableMilliCredits={listing.quantityAvailable}
              />
              <p className="text-[11px] text-center text-muted-foreground">
                Payment settles in Mock USDC on EVM testnet. Purchased credits can be transferred or permanently retired.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
