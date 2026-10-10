"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Coins, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ProjectMintButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleMint = async () => {
    if (!confirm("Are you sure you want to mint these verified carbon credits to the EVM blockchain?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/mint/${projectId}`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to mint credits on-chain");
      }

      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Minting failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200">
        <CheckCircle2 className="h-4 w-4" />
        <span>Successfully Minted!</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={handleMint}
        disabled={loading}
        size="sm"
        className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs shadow-sm"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Pinning IPFS & Minting...</span>
          </>
        ) : (
          <>
            <Coins className="h-4 w-4" />
            <span>Mint ERC-1155 Credits</span>
          </>
        )}
      </Button>
      {error && <span className="text-[11px] text-red-600 font-medium">{error}</span>}
    </div>
  );
}
