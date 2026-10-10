import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TreePine, MapPin, ShieldCheck, ArrowRight, ShoppingBag } from "lucide-react";
import { formatTonnesCo2e } from "@/lib/web3/contracts";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
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
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <ShoppingBag className="h-4 w-4" />
            <span>Web3 Carbon Registry</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Forest Carbon Credit Marketplace
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl mt-1">
            Browse verified forest carbon removal credits on the EVM testnet. Each credit batch represents real field measurements audited through our transparent MRV pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/portfolio">
            <Button variant="outline" size="sm">
              My Portfolio
            </Button>
          </Link>
          <Link href="/calculator">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800">
              Calculate Plot Carbon
            </Button>
          </Link>
        </div>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <Card className="p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 flex items-center justify-center mx-auto">
            <TreePine className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold">No Active Listings Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              There are currently no credit batches listed on the marketplace. Verified landowners can list their minted batches from their project dashboard.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/dashboard/projects">
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800">
                Go to Projects Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => {
            const project = listing.batch.project;
            const availableTonnes = listing.quantityAvailable / 1000;
            const totalTonnes = listing.batch.amountMinted / 1000;

            return (
              <Card
                key={listing.id}
                className="overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all border-emerald-900/10"
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Audited MRV
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      Token #{listing.batch.tokenId}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {project.region}, {project.country}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Available</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {availableTonnes.toFixed(2)} tCO₂e
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Batch Total</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {totalTonnes.toFixed(2)} tCO₂e
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t mt-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Price</span>
                    <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                      ${listing.pricePerCreditUsdc.toFixed(2)}
                      <span className="text-xs font-normal text-muted-foreground"> / tCO₂e</span>
                    </span>
                  </div>

                  <Link href={`/marketplace/${listing.id}`}>
                    <Button size="sm" className="gap-1 bg-emerald-700 hover:bg-emerald-800 text-white">
                      <span>View & Buy</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
