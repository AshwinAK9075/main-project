import Link from "next/link";
import { TreePine, AlertTriangle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-8 text-sm">
      <div className="container px-4 sm:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-400">
            <TreePine className="h-5 w-5" />
            <span>Forest Carbon MRV & Web3 Marketplace</span>
          </div>
          <div className="flex items-center gap-6 text-muted-foreground">
            <Link href="/calculator" className="hover:text-foreground">
              Calculator
            </Link>
            <Link href="/marketplace" className="hover:text-foreground">
              Marketplace
            </Link>
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <p>
            <strong>Disclaimer:</strong> Estimates use generalized allometric equations and are not certified under Verra, Gold Standard or any registry. This platform operates on EVM testnet infrastructure for academic demonstration purposes only.
          </p>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Forest Carbon MRV. Open Source Academic Project.
        </div>
      </div>
    </footer>
  );
}
