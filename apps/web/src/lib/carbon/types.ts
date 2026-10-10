export type TreeType =
  | "HARDWOOD_BROADLEAF"
  | "SOFTWOOD_CONIFER"
  | "FAST_GROWING_TROPICAL";

export interface TreeTypeOption {
  value: TreeType;
  label: string;
  formula: string;
  description: string;
}

export interface TreeMeasurementInput {
  id?: string;
  treeType: TreeType;
  circumferenceM: number;
  heightM: number;
  treeCount: number;
  speciesNote?: string;
}

export interface SingleTreeBreakdown {
  id?: string;
  treeType: TreeType;
  circumferenceM: number;
  dbhCm: number;
  heightM: number;
  treeCount: number;
  speciesNote?: string;

  // Single tree metrics (kg and tonnes)
  singleAgBkg: number;
  singleBgBkg: number;
  singleTotalBiomassKg: number;
  singleCarbonMassKg: number;
  singleCo2eKg: number;
  singleGrossCredits: number;
  singleNetCredits: number;

  // Row totals scaled by treeCount
  totalAgBkg: number;
  totalBgBkg: number;
  totalBiomassKg: number;
  totalCarbonMassKg: number;
  totalCo2eKg: number;
  totalGrossCredits: number;
  totalNetCredits: number;
}

export interface PlotCalculationInput {
  trees: TreeMeasurementInput[];
  areaHectares?: number;
  configOverrides?: Partial<CarbonConfigValues>;
}

export interface CarbonConfigValues {
  hardwoodCoeff: number; // 0.06
  softwoodCoeff: number; // 0.045
  softwoodExp: number; // 2.1
  tropicalCoeff: number; // 0.11
  tropicalExpDbh: number; // 2.2
  tropicalExpHeight: number; // 0.6
  bgbRatio: number; // 0.20
  carbonFraction: number; // 0.48
  co2Ratio: number; // 3.67
  bufferDiscount: number; // 0.90 (10% risk buffer reserve)
}

export interface PlotCalculationResult {
  configVersion: string;
  methodologyVersion: string;
  totalTreesCount: number;
  totalAgBkg: number;
  totalBgBkg: number;
  totalBiomassKg: number;
  totalCarbonMassKg: number;
  totalCo2eKg: number;
  totalGrossCredits: number;
  totalNetCredits: number;
  bufferDeductionCredits: number;
  areaHectares?: number;
  creditsPerHectare?: number;
  breakdown: SingleTreeBreakdown[];
  disclaimer: string;
}
