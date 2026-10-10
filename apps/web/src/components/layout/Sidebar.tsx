"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TreePine,
  PlusCircle,
  ShieldCheck,
  Briefcase,
  Settings,
  ShoppingBag,
  LogOut,
  User,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "GUEST";

  const navLinks = [
    {
      href: "/dashboard",
      label: "Overview",
      icon: LayoutDashboard,
      roles: ["LANDOWNER", "VERIFIER", "BUYER", "ADMIN"],
    },
    {
      href: "/dashboard/projects",
      label: "My Projects",
      icon: TreePine,
      roles: ["LANDOWNER", "ADMIN"],
    },
    {
      href: "/dashboard/projects/new",
      label: "New Project",
      icon: PlusCircle,
      roles: ["LANDOWNER", "ADMIN"],
    },
    {
      href: "/dashboard/verification",
      label: "Verification Queue",
      icon: ShieldCheck,
      roles: ["VERIFIER", "ADMIN"],
    },
    {
      href: "/dashboard/portfolio",
      label: "My Portfolio",
      icon: Briefcase,
      roles: ["BUYER", "LANDOWNER", "ADMIN"],
    },
    {
      href: "/marketplace",
      label: "Marketplace",
      icon: ShoppingBag,
      roles: ["LANDOWNER", "VERIFIER", "BUYER", "ADMIN"],
    },
    {
      href: "/dashboard/admin",
      label: "Admin & Config",
      icon: Settings,
      roles: ["ADMIN"],
    },
  ];

  const filteredLinks = navLinks.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 border-r bg-card/60 backdrop-blur min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <div className="space-y-6">
        {/* User Card */}
        <div className="p-3 bg-muted/40 rounded-lg border space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
              <User className="h-4 w-4" />
            </div>
            <div className="truncate">
              <p className="font-semibold text-xs truncate">{session?.user?.name || "User"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email}</p>
            </div>
          </div>
          <div className="pt-1 flex items-center justify-between">
            <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">
              {role}
            </Badge>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {filteredLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-emerald-700" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full justify-start text-xs text-muted-foreground hover:text-destructive gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}
