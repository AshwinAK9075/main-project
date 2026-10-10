"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { TreeMeasurementInput } from "@/lib/carbon/types";
import { calculatePlotCarbon } from "@/lib/carbon/calculate";
import { TreeTable } from "@/components/calculator/TreeTable";
import { ResultsPanel } from "@/components/calculator/ResultsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, ArrowRight, Save, Info, RefreshCw } from "lucide-react";

export default function PublicCalculatorPage() {
  const [areaHectares, setAreaHectares] = useState<number>(1.0);
  const [trees, setTrees] = useState<TreeMeasurementInput[]>([
    {
      id: "initial-1",
      treeType: "HARDWOOD_BROADLEAF",
      circumferenceM: 1.2566370614, // Exact Section 4.4 test vector (DBH = 40cm)
      heightM: 20,
      treeCount: 1,
      speciesNote: "Section 4.4 Reference Tree",
    },
  ]);

  // Live real-time calculation using pure function
  const calculationResult = useMemo(() => {
    try {
      return calculatePlotCarbon({
        trees,
        areaHectares: areaHectares > 0 ? areaHectares : undefined,
      });
    } catch {
      return null;
    }
  }, [trees, areaHectares]);

  return (
    <div className="container px-4 sm:px-8 py-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-semibold text-sm">
            <Calculator className="h-4 w-4" />
            <span>Public Open MRV Calculator</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            Forest Carbon Biomass & Credit Estimator
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Enter field measurements (circumference in metres and total height) to calculate biomass, carbon sequestered, and net verifiable credits through an 8-stage transparent allometric equation pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login?callbackUrl=/dashboard/projects/new">
            <Button className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm">
              <Save className="h-4 w-4" />
              Save as Project
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Plot Field Measurements</CardTitle>
              <CardDescription>
                Define plot surface area and tree rows with respective circumference and height.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plot Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-3.5 rounded-lg border">
                <div>
                  <Label htmlFor="area" className="text-xs font-semibold">
                    Plot Area (Hectares)
                  </Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input
                      id="area"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100000"
                      value={areaHectares}
                      onChange={(e) => setAreaHectares(parseFloat(e.target.value) || 0)}
                      className="font-mono text-xs"
                    />
                    <span className="text-xs text-muted-foreground font-mono">ha</span>
                  </div>
                </div>

                <div className="flex items-center text-xs text-muted-foreground gap-2 pt-2 sm:pt-4">
                  <Info className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    Used to calculate credits yield per hectare (<code className="text-xs">tCO₂e/ha</code>).
                  </span>
                </div>
              </div>

              {/* Dynamic Measurement Table */}
              <TreeTable trees={trees} onChange={setTrees} />
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Results Panel */}
        <div className="lg:col-span-5 sticky top-20">
          <ResultsPanel result={calculationResult} areaHectares={areaHectares} />
        </div>
      </div>
    </div>
  );
}
