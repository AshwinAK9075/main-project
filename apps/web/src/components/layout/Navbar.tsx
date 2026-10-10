"use client";

import Link from "next/link";
import { TreePine, Calculator, ShoppingBag, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ConnectButton } from "@/components/web3/ConnectButton";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-emerald-800 dark:text-emerald-400">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-sm">
            <TreePine className="h-5 w-5" />
          </div>
          <span>Forest Carbon MRV</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/calculator" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
            <Calculator className="h-4 w-4" />
            <span>Calculator</span>
          </Link>
          <Link href="/marketplace" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
            <ShoppingBag className="h-4 w-4" />
            <span>Marketplace</span>
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ConnectButton />
          {session?.user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 font-medium">
                  <span>{session.user.name}</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                    {session.user.role}
                  </Badge>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-xs"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
