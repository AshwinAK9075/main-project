import Link from "next/link";
import {
  TreePine,
  Calculator,
  ShieldCheck,
  Coins,
  FileCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 py-12 md:py-20">
      {/* Hero Section */}
      <section className="container px-4 sm:px-8 text-center max-w-4xl mx-auto space-y-6">
        <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100">
          🌿 Open MRV Standard & Web3 Escrow
        </Badge>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Transparent Forest Carbon Accounting on Blockchain
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Bridge biophysical field forestry measurements to verifiable ERC-1155 carbon credits with an open 8-stage allometric pipeline, IPFS auditing, and on-chain retirement.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/calculator">
            <Button size="lg" className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white">
              <Calculator className="h-4 w-4" />
              Launch Quick Calculator
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button size="lg" variant="outline" className="gap-2">
              <Coins className="h-4 w-4" />
              Browse Marketplace
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary" className="gap-2">
              Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Pipeline */}
      <section className="container px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-bold tracking-tight">The 5-Stage MRV Lifecycle</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            From plot circumferences to burned carbon offsets: an unalterable chain of custody.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-emerald-100 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 font-bold">
                1
              </div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TreePine className="h-5 w-5 text-emerald-600" />
                Plot & Tree Entry
              </CardTitle>
              <CardDescription>
                Landowners map forest plots using interactive Leaflet coordinates and log DBH, height, and species classifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Standardized DBH conversion from circumference</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Multi-tree batch rows with density factors</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 font-bold">
                2
              </div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-emerald-600" />
                Allometric Carbon Engine
              </CardTitle>
              <CardDescription>
                Pure mathematical modeling computes Above-Ground Biomass (AGB), Below-Ground Biomass (BGB), Carbon Mass, and Net Credits.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>10% non-permanence risk buffer reserve</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Versioned biophysical coefficient auditing</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 font-bold">
                3
              </div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Independent Verification
              </CardTitle>
              <CardDescription>
                Accredited verifiers inspect submission parameters, compare field measurements, and approve or reject with audit notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Role-based verifier queue isolation</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Full historical audit trail on PostgreSQL</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 font-bold">
                4
              </div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-emerald-600" />
                IPFS Dossier & Minting
              </CardTitle>
              <CardDescription>
                Full MRV JSON dossiers are pinned immutably to IPFS via Pinata. Server signer mints batch-specific ERC-1155 tokens.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Integer milli-credit representation (0.001 tCO2e)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Immutable tokenURI linking to IPFS CID</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 font-bold">
                5
              </div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Coins className="h-5 w-5 text-emerald-600" />
                Escrow Marketplace
              </CardTitle>
              <CardDescription>
                Buyers settle purchases with testnet Mock USDC via non-custodial smart contracts with partial fill support.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>SafeERC20 escrow settlements</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Integrated testnet USDC faucet</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 font-bold">
                6
              </div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                Retirement & PDF Certificate
              </CardTitle>
              <CardDescription>
                Credits are permanently burned on-chain. Generate cryptographic PDF retirement certificates with QR code verification.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>On-chain CarbonRetired event emission</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Unique certificate serials and public audit links</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Role Access Callout */}
      <section className="container px-4 sm:px-8 max-w-4xl mx-auto">
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-8 text-center space-y-4">
          <Globe2 className="h-10 w-10 text-emerald-700 dark:text-emerald-400 mx-auto" />
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Role-Based Access Control Built-In</h3>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Test as a Landowner submitting forest plots, a Verifier approving carbon claims, a Buyer purchasing and retiring credits, or an Admin managing biophysical coefficients.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Badge variant="outline" className="bg-white dark:bg-slate-900 px-3 py-1">LANDOWNER</Badge>
            <Badge variant="outline" className="bg-white dark:bg-slate-900 px-3 py-1">VERIFIER</Badge>
            <Badge variant="outline" className="bg-white dark:bg-slate-900 px-3 py-1">BUYER</Badge>
            <Badge variant="outline" className="bg-white dark:bg-slate-900 px-3 py-1">ADMIN</Badge>
          </div>
        </div>
      </section>
    </div>
  );
}
