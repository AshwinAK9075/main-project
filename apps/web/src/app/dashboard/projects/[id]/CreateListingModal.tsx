"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ShoppingBag, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateListingModalProps {
  batchId: string;
  totalMintedMilliCredits: number;
}

export function CreateListingModal({
  batchId,
  totalMintedMilliCredits,
}: CreateListingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pricePerTonne, setPricePerTonne] = useState<string>("25.00");
  const [tonnes, setTonnes] = useState<string>((totalMintedMilliCredits / 1000).toFixed(3));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const maxTonnes = totalMintedMilliCredits / 1000;

  const handleList = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const price = parseFloat(pricePerTonne);
    const qtyTonnes = parseFloat(tonnes);

    if (isNaN(price) || price <= 0) {
      setError("Please enter a valid price per tonne.");
      return;
    }

    if (isNaN(qtyTonnes) || qtyTonnes <= 0 || qtyTonnes > maxTonnes) {
      setError(`Quantity must be between 0.001 and ${maxTonnes.toFixed(3)} tCO₂e.`);
      return;
    }

    const quantityAvailable = Math.floor(qtyTonnes * 1000);

    setLoading(true);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          pricePerCreditUsdc: price,
          quantityAvailable,
          onchainListingId: `list_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create marketplace listing");
      }

      setIsOpen(false);
      router.push("/marketplace");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create listing";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
      >
        <ShoppingBag className="h-4 w-4" />
        <span>List on Marketplace</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-900 shadow-2xl border-emerald-800/20">
            <div className="flex items-center justify-between pb-4 border-b">
              <h3 className="text-lg font-bold">List Credits on Marketplace</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleList} className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (USDC per Tonne CO₂e)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-muted-foreground">$</span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="pl-7"
                    value={pricePerTonne}
                    onChange={(e) => setPricePerTonne(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qty">Quantity to List (Tonnes CO₂e)</Label>
                <Input
                  id="qty"
                  type="number"
                  step="0.001"
                  min="0.001"
                  max={maxTonnes}
                  value={tonnes}
                  onChange={(e) => setTonnes(e.target.value)}
                  required
                />
                <span className="text-[11px] text-muted-foreground">
                  Max available: {maxTonnes.toFixed(3)} tCO₂e
                </span>
              </div>

              {error && (
                <div className="p-2.5 rounded bg-red-50 text-red-700 text-xs border border-red-200">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish Listing"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
