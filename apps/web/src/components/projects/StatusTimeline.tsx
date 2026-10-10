import React from "react";
import { CheckCircle2, Clock, XCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusTimelineProps {
  status: string;
  rejectionReason?: string | null;
}

const STEPS = [
  { key: "DRAFT", label: "Draft", desc: "Measurements entered" },
  { key: "SUBMITTED", label: "Submitted", desc: "Awaiting verifier" },
  { key: "UNDER_REVIEW", label: "Under Review", desc: "Verifier inspecting" },
  { key: "VERIFIED", label: "Verified", desc: "Ready for on-chain mint" },
  { key: "MINTED", label: "Minted", desc: "ERC-1155 tokenized" },
];

export function StatusTimeline({ status, rejectionReason }: StatusTimelineProps) {
  const isRejected = status === "REJECTED";
  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="space-y-4">
      {isRejected ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-sm">
            <XCircle className="h-4 w-4" />
            <span>Submission Rejected by Verifier</span>
          </div>
          <p className="text-muted-foreground">
            <strong>Reason:</strong> {rejectionReason || "Criteria not met during verification review."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STEPS.map((step, idx) => {
            const isCompleted = currentIndex >= idx;
            const isCurrent = currentIndex === idx;

            return (
              <div
                key={step.key}
                className={`p-3 rounded-lg border text-xs transition-colors ${
                  isCurrent
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-semibold"
                    : isCompleted
                    ? "border-emerald-200 bg-muted/40 text-foreground"
                    : "opacity-50 border-dashed"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-bold">{step.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground block">{step.desc}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
