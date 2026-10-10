import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileCheck2,
  Download,
  ExternalLink,
  ShieldCheck,
  TreePine,
  MapPin,
  Calendar,
  Flame,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CertificateVerificationPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const retirement = await prisma.retirement.findFirst({
    where: {
      OR: [{ id }, { certificateNumber: id }],
    },
    include: {
      batch: {
        include: {
          project: {
            include: {
              owner: true,
              calculation: true,
            },
          },
        },
      },
      user: true,
    },
  });

  if (!retirement) {
    notFound();
  }

  const project = retirement.batch.project;
  const tonnes = (retirement.quantity / 1000).toFixed(3);
  const certDate = new Date(retirement.retiredAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto px-4 sm:px-8 py-10 max-w-4xl space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs tracking-wider uppercase">
            <ShieldCheck className="h-4 w-4" />
            <span>Public Proof of Carbon Retirement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Certificate of Retirement
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            ID: {retirement.certificateNumber}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/api/certificates/${retirement.certificateNumber}/pdf`}
            download={`Retirement_Certificate_${retirement.certificateNumber}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 shadow-sm">
              <Download className="h-4 w-4" />
              <span>Download Official PDF</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Main Certificate Sheet */}
      <Card className="border-4 border-emerald-900/20 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Certificate Decorative Top Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-950 text-white p-8 text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-700/60 border border-emerald-400/40 text-emerald-200 mx-auto">
            <TreePine className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-wider uppercase">
            Forest Carbon Retirement Certificate
          </h2>
          <p className="text-xs text-emerald-200/90 tracking-wide">
            Transparent Web3 MRV Platform • Immutable On-Chain Proof
          </p>
        </div>

        {/* Certificate Body */}
        <div className="p-8 sm:p-12 space-y-8 text-center">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold block">
              This is to certify that
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 dark:text-emerald-100 uppercase tracking-tight">
              {retirement.beneficiaryName}
            </h3>
            <div className="w-24 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
          </div>

          <div className="max-w-xl mx-auto">
            <p className="text-sm text-slate-600 dark:text-slate-300 italic">
              has permanently retired verified carbon credits for:
            </p>
            <p className="text-base font-medium text-slate-900 dark:text-white mt-1">
              &ldquo;{retirement.reason}&rdquo;
            </p>
          </div>

          {/* Large Offset Badge */}
          <div className="max-w-md mx-auto bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-600/30 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Flame className="h-4 w-4" />
              <span>Permanent Carbon Removal</span>
            </div>
            <div className="text-4xl sm:text-5xl font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
              {tonnes}
              <span className="text-lg font-normal text-muted-foreground ml-2">
                Tonnes CO₂e
              </span>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-2">
              {retirement.quantity.toLocaleString()} ERC-1155 token units permanently burned from circulation
            </p>
          </div>

          {/* Provenance Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-6 border-t">
            {/* Source Forest */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-lg border">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <TreePine className="h-4 w-4" />
                <span>Source Forest Project</span>
              </h4>
              <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                <div><strong>Project:</strong> {project.name}</div>
                <div><strong>Location:</strong> {project.region}, {project.country}</div>
                <div>
                  <strong>Coordinates:</strong> Lat {project.latitude.toFixed(4)}°, Lon {project.longitude.toFixed(4)}°
                </div>
                <div><strong>Plot Area:</strong> {project.areaHectares} Hectares</div>
                <div><strong>Landowner:</strong> {project.owner.name}</div>
              </div>
            </div>

            {/* Blockchain Provenance */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-lg border">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Cryptographic Verification</span>
              </h4>
              <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300 font-mono">
                <div>
                  <span className="font-sans font-bold">Retirement Date:</span> {certDate}
                </div>
                <div>
                  <span className="font-sans font-bold">Token Batch ID:</span> #{retirement.batch.tokenId}
                </div>
                <div className="truncate">
                  <span className="font-sans font-bold">Retire Tx:</span> {retirement.txHash}
                </div>
                <div className="truncate">
                  <span className="font-sans font-bold">IPFS CID:</span>{" "}
                  <a
                    href={retirement.batch.ipfsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline"
                  >
                    {retirement.batch.ipfsCid}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Mandatory Project Disclaimer */}
          <div className="pt-6 border-t">
            <p className="text-[11px] text-muted-foreground italic max-w-xl mx-auto">
              Disclaimer: Estimates use generalized allometric equations and are not certified under Verra, Gold Standard or any registry.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
