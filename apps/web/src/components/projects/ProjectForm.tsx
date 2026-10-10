"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TreeMeasurementInput } from "@/lib/carbon/types";
import { TreeTable } from "@/components/calculator/TreeTable";
import { PlotMap } from "@/components/map/PlotMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Save, Send, MapPin } from "lucide-react";

interface ProjectFormProps {
  initialData?: {
    id?: string;
    name: string;
    description: string;
    country: string;
    region: string;
    latitude: number;
    longitude: number;
    areaHectares: number;
    trees: TreeMeasurementInput[];
  };
  isEditing?: boolean;
}

export function ProjectForm({ initialData, isEditing = false }: ProjectFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [country, setCountry] = useState(initialData?.country || "United States");
  const [region, setRegion] = useState(initialData?.region || "Pacific Northwest");
  const [latitude, setLatitude] = useState<number>(initialData?.latitude || 44.0521);
  const [longitude, setLongitude] = useState<number>(initialData?.longitude || -123.0868);
  const [areaHectares, setAreaHectares] = useState<number>(initialData?.areaHectares || 5.0);
  const [trees, setTrees] = useState<TreeMeasurementInput[]>(
    initialData?.trees || [
      {
        id: "tr-1",
        treeType: "HARDWOOD_BROADLEAF",
        circumferenceM: 1.2566370614,
        heightM: 20,
        treeCount: 30,
        speciesNote: "Hardwood grove",
      },
      {
        id: "tr-2",
        treeType: "SOFTWOOD_CONIFER",
        circumferenceM: 1.0,
        heightM: 22,
        treeCount: 50,
        speciesNote: "Conifer boundary",
      },
    ]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (submitForReview: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const url = isEditing && initialData?.id ? `/api/projects/${initialData.id}` : "/api/projects";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          country,
          region,
          latitude,
          longitude,
          areaHectares,
          trees,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to save project");
      }

      const projectId = data.project.id;

      if (submitForReview) {
        const submitRes = await fetch(`/api/projects/${projectId}/submit`, {
          method: "POST",
        });
        const submitData = await submitRes.json();
        if (!submitRes.ok) {
          throw new Error(submitData.error?.message || "Failed to submit project for verification");
        }
      }

      router.push(`/dashboard/projects/${projectId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Basic Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Metadata</CardTitle>
          <CardDescription>
            Enter general plot information, geographical bounds, and land description.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              placeholder="e.g. Cascade Foothills Carbon Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Project Description</Label>
            <textarea
              id="description"
              rows={3}
              placeholder="Describe forest composition, conservation goals, and history..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="region">Region / State</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area">Plot Area (Hectares)</Label>
              <Input
                id="area"
                type="number"
                step="0.1"
                min="0.1"
                value={areaHectares}
                onChange={(e) => setAreaHectares(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Map Coordinates */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Geographic Coordinates</CardTitle>
          </div>
          <CardDescription>
            Click anywhere on the map to set plot coordinates or enter decimals directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="lat">Latitude (Decimal)</Label>
              <Input
                id="lat"
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lng">Longitude (Decimal)</Label>
              <Input
                id="lng"
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="rounded-lg overflow-hidden border">
            <PlotMap
              latitude={latitude}
              longitude={longitude}
              interactive={true}
              onCoordinatesChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              height="280px"
              projectName={name || "Selected Plot Coordinates"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Field Tree Measurements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tree Stand Measurements</CardTitle>
          <CardDescription>
            Specify species groupings, circumference in metres, and total height.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TreeTable trees={trees} onChange={setTrees} />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? "Saving..." : "Save Draft"}
        </Button>

        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
        >
          <Send className="h-4 w-4" />
          {loading ? "Submitting..." : "Submit for Verification"}
        </Button>
      </div>
    </div>
  );
}
