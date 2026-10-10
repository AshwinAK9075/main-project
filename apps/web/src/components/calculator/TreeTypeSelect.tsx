"use client";

import React from "react";
import { TreeType } from "@/lib/carbon/types";
import { TREE_TYPE_OPTIONS } from "@/lib/carbon/constants";

interface TreeTypeSelectProps {
  value: TreeType;
  onChange: (val: TreeType) => void;
  className?: string;
  disabled?: boolean;
}

export function TreeTypeSelect({
  value,
  onChange,
  className = "",
  disabled = false,
}: TreeTypeSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TreeType)}
      disabled={disabled}
      className={`h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-sans ${className}`}
    >
      {TREE_TYPE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label} ({opt.formula})
        </option>
      ))}
    </select>
  );
}
