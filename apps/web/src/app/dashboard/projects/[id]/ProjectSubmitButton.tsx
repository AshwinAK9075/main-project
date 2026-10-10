"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

export function ProjectSubmitButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!confirm("Are you sure you want to submit this project for formal verifier review?")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/submit`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || "Failed to submit project");
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleSubmit}
      disabled={loading}
      className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      <span>{loading ? "Submitting..." : "Submit for Verification"}</span>
    </Button>
  );
}
