"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

export function VerificationActions({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [notes, setNotes] = useState("");

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to formally APPROVE this carbon project?")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/verification/${projectId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || "Failed to approve project");
      } else {
        router.push("/dashboard/verification");
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert("Please provide a specific reason for rejection.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/verification/${projectId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason, notes }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || "Failed to reject project");
      } else {
        setShowRejectModal(false);
        router.push("/dashboard/verification");
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleApprove}
          disabled={loading}
          className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          <span>Approve Project</span>
        </Button>

        <Button
          variant="destructive"
          onClick={() => setShowRejectModal(true)}
          disabled={loading}
          className="gap-1.5 text-xs"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>Reject Submission</span>
        </Button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-lg text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Reject Carbon Project
            </h3>
            <p className="text-xs text-muted-foreground">
              Provide feedback to the landowner regarding discrepancy in tree measurements, canopy density, or boundary overlaps.
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reason" className="text-xs">
                  Rejection Reason (Required)
                </Label>
                <textarea
                  id="reason"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Tree height measurements exceed regional canopy LIDAR limits..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectModal(false)}
                  disabled={loading}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={loading}
                  className="text-xs"
                >
                  {loading ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
