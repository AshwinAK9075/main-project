"use client";

import React, { useState } from "react";
import { PlotCalculationResult } from "@/lib/carbon/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TreePine,
  ShieldAlert,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle,
  FileCheck2,
} from "lucide-react";

interface ResultsPanelProps {
  result: PlotCalculationResult | null;
  areaHectares?: number;
}

export function ResultsPanel({ result, areaHectares }: ResultsPanelProps) {
  const [showDetailedSteps, setShowDetailedSteps] = useState(true);

  if (!result || result.totalTreesCount === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <TreePine className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm">No measurements calculated yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Configure plot measurements above to view your transparent 8-stage MRV estimation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary KPI Summary Card */}
      <Card className="border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/20 dark:to-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="success" className="gap-1 text-xs">
              <FileCheck2 className="h-3.5 w-3.5" />
              MRV Audit Summary ({result.configVersion})
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">
              {result.methodologyVersion}
            </span>
          </div>
          <CardTitle className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-300 pt-2">
            Estimated Net Carbon Credits
          </CardTitle>
          <CardDescription>
            Calculated across {result.totalTreesCount} trees using pure allometric pipelines
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Primary Net Tonnes */}
            <div className="p-3.5 rounded-lg bg-white dark:bg-card border shadow-xs space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Net Credits</span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                {result.totalNetCredits.toFixed(4)}
              </p>
              <span className="text-[10px] text-muted-foreground block">
                tCO₂e (Available to mint)
              </span>
            </div>

            {/* Gross Tonnes */}
            <div className="p-3.5 rounded-lg bg-white dark:bg-card border shadow-xs space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Gross Carbon</span>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-200 font-mono">
                {result.totalGrossCredits.toFixed(4)}
              </p>
              <span className="text-[10px] text-muted-foreground block">
                tCO₂e (Total sequestered)
              </span>
            </div>

            {/* 10% Risk Buffer */}
            <div className="p-3.5 rounded-lg bg-white dark:bg-card border shadow-xs space-y-1">
              <span className="text-xs text-muted-foreground font-medium">10% Risk Buffer</span>
              <p className="text-2xl font-black text-amber-600 font-mono">
                {result.bufferDeductionCredits.toFixed(4)}
              </p>
              <span className="text-[10px] text-muted-foreground block">
                tCO₂e (Permanence reserve)
              </span>
            </div>

            {/* Per-Hectare Yield */}
            <div className="p-3.5 rounded-lg bg-white dark:bg-card border shadow-xs space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Yield / Hectare</span>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-200 font-mono">
                {result.creditsPerHectare !== undefined
                  ? result.creditsPerHectare.toFixed(2)
                  : "--"}
              </p>
              <span className="text-[10px] text-muted-foreground block">
                {areaHectares ? `${areaHectares} ha plot` : "Specify plot area (ha)"}
              </span>
            </div>
          </div>

          {/* Secondary Mass Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/40 p-3 rounded-lg border">
            <div>
              <span className="text-muted-foreground block">Above-Ground (AGB):</span>
              <span className="font-mono font-semibold">
                {result.totalAgBkg.toLocaleString("en-US", { maximumFractionDigits: 2 })} kg
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Below-Ground (BGB):</span>
              <span className="font-mono font-semibold">
                {result.totalBgBkg.toLocaleString("en-US", { maximumFractionDigits: 2 })} kg
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Total Biomass:</span>
              <span className="font-mono font-semibold">
                {result.totalBiomassKg.toLocaleString("en-US", { maximumFractionDigits: 2 })} kg
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Pure Carbon Mass:</span>
              <span className="font-mono font-semibold">
                {result.totalCarbonMassKg.toLocaleString("en-US", { maximumFractionDigits: 2 })} kg
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Mathematical Pipeline Breakdown */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowDetailedSteps(!showDetailedSteps)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-700" />
              <div>
                <CardTitle className="text-base font-bold">
                  8-Stage Allometric Pipeline Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Full mathematical proof and intermediate formulas per tree row
                </CardDescription>
              </div>
            </div>
            <button type="button" className="text-muted-foreground hover:text-foreground">
              {showDetailedSteps ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
        </CardHeader>

        {showDetailedSteps && (
          <CardContent className="space-y-6 pt-0">
            {/* Reference Table of Pipeline Formulas */}
            <div className="rounded-lg border bg-muted/20 p-3.5 space-y-2 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Standard Pipeline Formulation Reference
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-emerald-700 font-bold">1. DBH:</span> Circumference_m × 100 / π
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-emerald-700 font-bold">2. AGB:</span> Species Allometric Equation
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-emerald-700 font-bold">3. BGB:</span> AGB × 0.20 (20% Root:Shoot)
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-emerald-700 font-bold">4. Biomass:</span> AGB + BGB
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-emerald-700 font-bold">5. Carbon:</span> Total Biomass × 0.48
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-emerald-700 font-bold">6. CO₂e:</span> Carbon Mass × 3.67
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-emerald-700 font-bold">7. Gross:</span> CO₂e kg / 1000 (tonnes)
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-emerald-700 font-bold">8. Net:</span> Gross × 0.90 (10% Risk Buffer)
                </div>
              </div>
            </div>

            {/* Per-Row Intermediate Values */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Row-Level Intermediate Values
              </h4>

              {result.breakdown.map((row, idx) => (
                <div
                  key={row.id || idx}
                  className="rounded-lg border p-4 bg-card text-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Row {idx + 1}</Badge>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {row.treeType.replace(/_/g, " ")}
                      </span>
                      {row.speciesNote && (
                        <span className="text-muted-foreground italic">({row.speciesNote})</span>
                      )}
                    </div>
                    <span className="font-mono text-muted-foreground">
                      Quantity: <strong>{row.treeCount}</strong> trees
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-muted-foreground font-mono">
                    <div>
                      <span className="block text-[11px] text-slate-500">1. DBH</span>
                      <strong className="text-foreground">{row.dbhCm.toFixed(2)} cm</strong>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">2. Single AGB</span>
                      <strong className="text-foreground">{row.singleAgBkg.toFixed(2)} kg</strong>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">3. Single BGB</span>
                      <strong className="text-foreground">{row.singleBgBkg.toFixed(2)} kg</strong>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">4. Single Biomass</span>
                      <strong className="text-foreground">{row.singleTotalBiomassKg.toFixed(2)} kg</strong>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">5. Single Carbon</span>
                      <strong className="text-foreground">{row.singleCarbonMassKg.toFixed(2)} kg</strong>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">6. Single CO₂e</span>
                      <strong className="text-foreground">{row.singleCo2eKg.toFixed(2)} kg</strong>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">7. Single Gross</span>
                      <strong className="text-foreground">{row.singleGrossCredits.toFixed(4)} t</strong>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">8. Single Net</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {row.singleNetCredits.toFixed(4)} t
                      </strong>
                    </div>
                  </div>

                  {row.treeCount > 1 && (
                    <div className="pt-2 border-t flex flex-wrap items-center justify-between text-xs bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded">
                      <span className="font-medium text-emerald-900 dark:text-emerald-300">
                        Total for this row ({row.treeCount} trees):
                      </span>
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">
                        {row.totalNetCredits.toFixed(4)} Net tCO₂e (from {row.totalGrossCredits.toFixed(4)} Gross)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Mandatory Methodology Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Mandatory Methodology Disclaimer:</strong> {result.disclaimer}
        </p>
      </div>
    </div>
  );
}
