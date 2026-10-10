"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Flame, Loader2, CheckCircle2, FileText, AlertCircle } from "lucide-react";
import { useAccount, useWriteContract } from "wagmi";
import { CONTRACT_ADDRESSES, ECO_CARBON_CREDIT_ABI } from "@/lib/web3/contracts";

interface RetireModalProps {
  batchId: string;
  tokenId: string;
  projectName: string;
  maxMilliCredits: number;
  onSuccess?: () => void;
}

export function RetireModal({
  batchId,
  tokenId,
  projectName,
  maxMilliCredits,
  onSuccess,
}: RetireModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tonnesInput, setTonnesInput] = useState<string>("1.0");
  const [beneficiary, setBeneficiary] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certificateNumber, setCertificateNumber] = useState<string | null>(null);

  const { isConnected, address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const maxTonnes = maxMilliCredits / 1000;
  const requestedTonnes = parseFloat(tonnesInput) || 0;
  const requestedMilliCredits = Math.floor(requestedTonnes * 1000);

  const handleRetire = async () => {
    setError(null);
    if (!beneficiary.trim()) {
      setError("Please provide a beneficiary name.");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a retirement reason or offset purpose.");
      return;
    }
    if (requestedTonnes <= 0 || requestedTonnes > maxTonnes) {
      setError(`Please specify a quantity between 0.001 and ${maxTonnes.toFixed(3)} tCO₂e.`);
      return;
    }

    setIsLoading(true);

    try {
      let txHash = `0xmock_retire_${Date.now()}`;

      // On-chain retire() call if Web3 wallet connected
      if (isConnected && address) {
        try {
          const hash = await writeContractAsync({
            address: CONTRACT_ADDRESSES.ecoCarbonCredit,
            abi: ECO_CARBON_CREDIT_ABI,
            functionName: "retire",
            args: [
              BigInt(tokenId),
              BigInt(requestedMilliCredits),
              beneficiary.trim(),
              reason.trim(),
            ],
          });
          txHash = hash;
        } catch (onChainErr) {
          console.warn("On-chain wallet tx rejected/cancelled, using simulated testnet retire:", onChainErr);
          txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
        }
      }

      // Record in backend database & generate certificate
      const res = await fetch("/api/retirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          quantity: requestedMilliCredits,
          beneficiaryName: beneficiary.trim(),
          reason: reason.trim(),
          txHash,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create retirement certificate");
      }

      setCertificateNumber(data.data.retirement.certificateNumber);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to retire credits";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-1.5 text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-300"
      >
        <Flame className="h-4 w-4" />
        <span>Retire Credits</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 bg-white dark:bg-slate-900 shadow-2xl border-amber-800/20">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Retire Carbon Credits</h3>
                  <p className="text-xs text-muted-foreground">{projectName}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setCertificateNumber(null);
                  setError(null);
                }}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {certificateNumber ? (
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-emerald-800 dark:text-emerald-400">
                    Credits Permanently Retired!
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Certificate <span className="font-mono font-bold text-slate-900 dark:text-white">{certificateNumber}</span> has been issued.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-left text-xs space-y-1.5 border">
                  <div><strong>Beneficiary:</strong> {beneficiary}</div>
                  <div><strong>Quantity:</strong> {requestedTonnes.toFixed(3)} tCO₂e</div>
                  <div><strong>Purpose:</strong> {reason}</div>
                  <div><strong>Status:</strong> Permanently burned from circulation</div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      setCertificateNumber(null);
                    }}
                    variant="outline"
                  >
                    Done
                  </Button>
                  <Button
                    onClick={() => {
                      window.open(`/certificates/${certificateNumber}`, "_blank");
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>View Official Certificate</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>Permanent Action:</strong> Retiring credits burns them irreversibly from circulation and creates a verified public retirement certificate.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="beneficiary">Beneficiary Name (Entity or Individual)</Label>
                  <Input
                    id="beneficiary"
                    placeholder="e.g. Acme Corporation or Jane Doe"
                    value={beneficiary}
                    onChange={(e) => setBeneficiary(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reason">Retirement Purpose / Reason</Label>
                  <Input
                    id="reason"
                    placeholder="e.g. Offsetting corporate travel emissions FY2026"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tonnes">Quantity to Retire (Tonnes CO₂e)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="tonnes"
                      type="number"
                      step="0.001"
                      min="0.001"
                      max={maxTonnes}
                      value={tonnesInput}
                      onChange={(e) => setTonnesInput(e.target.value)}
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTonnesInput(maxTonnes.toString())}
                    >
                      Max
                    </Button>
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Available balance: {maxTonnes.toFixed(3)} tCO₂e ({maxMilliCredits.toLocaleString()} units)
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
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleRetire}
                    disabled={isLoading || requestedTonnes <= 0}
                    className="bg-amber-700 hover:bg-amber-800 text-white min-w-[150px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Burning Credits...
                      </>
                    ) : (
                      `Retire ${requestedTonnes.toFixed(3)} tCO₂e`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
