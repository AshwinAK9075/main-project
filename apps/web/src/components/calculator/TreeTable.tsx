"use client";

import React from "react";
import { TreeMeasurementInput, TreeType } from "@/lib/carbon/types";
import { TreeTypeSelect } from "./TreeTypeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, RotateCcw, Sparkles } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateDbh } from "@/lib/carbon/calculate";

interface TreeTableProps {
  trees: TreeMeasurementInput[];
  onChange: (trees: TreeMeasurementInput[]) => void;
  disabled?: boolean;
}

export function TreeTable({ trees, onChange, disabled = false }: TreeTableProps) {
  const addRow = () => {
    const newRow: TreeMeasurementInput = {
      id: Math.random().toString(36).substring(7),
      treeType: "HARDWOOD_BROADLEAF",
      circumferenceM: 1.2566,
      heightM: 20,
      treeCount: 1,
      speciesNote: "Sample Plot Row",
    };
    onChange([...trees, newRow]);
  };

  const removeRow = (index: number) => {
    if (trees.length <= 1) return;
    const next = trees.filter((_, i) => i !== index);
    onChange(next);
  };

  const updateRow = <K extends keyof TreeMeasurementInput>(
    index: number,
    field: K,
    val: TreeMeasurementInput[K]
  ) => {
    const next = [...trees];
    next[index] = { ...next[index], [field]: val };
    onChange(next);
  };

  const loadPreset = (preset: "hardwood" | "softwood" | "tropical" | "mixed") => {
    if (preset === "hardwood") {
      onChange([
        {
          id: "hw-1",
          treeType: "HARDWOOD_BROADLEAF",
          circumferenceM: 1.2566370614, // DBH 40 cm
          heightM: 20,
          treeCount: 1,
          speciesNote: "Section 4.4 Hardwood Test Vector",
        },
      ]);
    } else if (preset === "softwood") {
      onChange([
        {
          id: "sw-1",
          treeType: "SOFTWOOD_CONIFER",
          circumferenceM: 1.2566370614,
          heightM: 20,
          treeCount: 1,
          speciesNote: "Section 4.4 Softwood Test Vector",
        },
      ]);
    } else if (preset === "tropical") {
      onChange([
        {
          id: "tr-1",
          treeType: "FAST_GROWING_TROPICAL",
          circumferenceM: 1.2566370614,
          heightM: 20,
          treeCount: 1,
          speciesNote: "Section 4.4 Tropical Test Vector",
        },
      ]);
    } else if (preset === "mixed") {
      onChange([
        {
          id: "mix-1",
          treeType: "HARDWOOD_BROADLEAF",
          circumferenceM: 1.2566370614,
          heightM: 20,
          treeCount: 25,
          speciesNote: "Mature Oak Stand",
        },
        {
          id: "mix-2",
          treeType: "SOFTWOOD_CONIFER",
          circumferenceM: 0.9425,
          heightM: 18,
          treeCount: 40,
          speciesNote: "Scots Pine Buffer",
        },
        {
          id: "mix-3",
          treeType: "FAST_GROWING_TROPICAL",
          circumferenceM: 0.8,
          heightM: 15,
          treeCount: 60,
          speciesNote: "Fast-Growth Agroforestry Strip",
        },
      ]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 p-3 rounded-lg border">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Quick Presets:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadPreset("hardwood")}
            className="text-xs h-7"
            disabled={disabled}
          >
            Hardwood (Vector 4.4)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadPreset("softwood")}
            className="text-xs h-7"
            disabled={disabled}
          >
            Softwood (Vector 4.4)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadPreset("tropical")}
            className="text-xs h-7"
            disabled={disabled}
          >
            Tropical (Vector 4.4)
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => loadPreset("mixed")}
            className="text-xs h-7"
            disabled={disabled}
          >
            Sample Mixed Forest (125 trees)
          </Button>
        </div>
      </div>

      {/* Interactive Measurement Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 text-xs font-semibold">
              <TableHead className="w-[40px]">#</TableHead>
              <TableHead className="min-w-[200px]">Species / Allometric Model</TableHead>
              <TableHead className="w-[120px]">Circumference (m)</TableHead>
              <TableHead className="w-[90px]">Calc. DBH (cm)</TableHead>
              <TableHead className="w-[100px]">Height (m)</TableHead>
              <TableHead className="w-[90px]">Count</TableHead>
              <TableHead className="min-w-[140px]">Notes</TableHead>
              <TableHead className="w-[50px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trees.map((row, idx) => {
              let liveDbh = "--";
              if (row.circumferenceM > 0) {
                try {
                  liveDbh = calculateDbh(row.circumferenceM).toFixed(1);
                } catch {
                  liveDbh = "--";
                }
              }

              return (
                <TableRow key={row.id || idx}>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <TreeTypeSelect
                      value={row.treeType}
                      onChange={(val) => updateRow(idx, "treeType", val)}
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.0001"
                      min="0.01"
                      max="20"
                      value={row.circumferenceM}
                      onChange={(e) =>
                        updateRow(idx, "circumferenceM", parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono"
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="text-xs font-mono text-emerald-800 dark:text-emerald-400 font-semibold">
                    {liveDbh} cm
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="120"
                      value={row.heightM}
                      onChange={(e) =>
                        updateRow(idx, "heightM", parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs font-mono"
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      max="100000"
                      value={row.treeCount}
                      onChange={(e) =>
                        updateRow(idx, "treeCount", parseInt(e.target.value, 10) || 1)
                      }
                      className="h-8 text-xs font-mono"
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      placeholder="Species tag / notes"
                      value={row.speciesNote || ""}
                      onChange={(e) => updateRow(idx, "speciesNote", e.target.value)}
                      className="h-8 text-xs"
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(idx)}
                      disabled={disabled || trees.length <= 1}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={disabled}
          className="gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Tree Measurement Row
        </Button>
        <span className="text-xs text-muted-foreground">
          Total Tree Rows: <strong>{trees.length}</strong>
        </span>
      </div>
    </div>
  );
}
