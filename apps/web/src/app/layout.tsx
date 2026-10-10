import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AlertCircle } from "lucide-react";
import { AuthProvider } from "@/components/providers/AuthProvider";

import { Web3Provider } from "@/components/providers/Web3Provider";

export const metadata: Metadata = {
  title: "Forest Carbon MRV & Web3 Marketplace",
  description:
    "Measure, report, verify forest carbon credits and trade on EVM testnet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        {/* Testnet Global Banner */}
        <div className="bg-emerald-900 text-emerald-100 text-xs py-1.5 px-4 text-center font-medium border-b border-emerald-800 flex items-center justify-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>
            <strong>Testnet Demonstration:</strong> Estimates use generalized allometric equations and are not certified under Verra, Gold Standard or any registry.
          </span>
        </div>

        <AuthProvider>
          <Web3Provider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </Web3Provider>
        </AuthProvider>
      </body>
    </html>
  );
}
