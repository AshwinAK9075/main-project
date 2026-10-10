import {
  DEFAULT_CARBON_CONFIG,
  DEFAULT_CONFIG_VERSION,
  METHODOLOGY_DISCLAIMER,
  METHODOLOGY_VERSION,
} from "./constants";
import {
  CarbonConfigValues,
  PlotCalculationInput,
  PlotCalculationResult,
  SingleTreeBreakdown,
  TreeMeasurementInput,
  TreeType,
} from "./types";

/**
 * Calculates Diameter at Breast Height (DBH) in centimeters from circumference in meters.
 * Formula: DBH_cm = Circumference_m * 100 / π
 */
export function calculateDbh(circumferenceM: number): number {
  if (circumferenceM <= 0 || !Number.isFinite(circumferenceM)) {
    throw new Error("Circumference must be a finite positive number");
  }
  return (circumferenceM * 100) / Math.PI;
}

/**
 * Calculates Above-Ground Biomass (AGB) in kilograms for a single tree based on species type.
 */
export function calculateAgb(
  treeType: TreeType,
  dbhCm: number,
  heightM: number,
  config: CarbonConfigValues = DEFAULT_CARBON_CONFIG
): number {
  if (dbhCm <= 0 || heightM <= 0 || !Number.isFinite(dbhCm) || !Number.isFinite(heightM)) {
    throw new Error("DBH and Height must be finite positive numbers");
  }

  switch (treeType) {
    case "HARDWOOD_BROADLEAF":
      // AGB = 0.06 * DBH^2 * H
      return config.hardwoodCoeff * Math.pow(dbhCm, 2) * heightM;

    case "SOFTWOOD_CONIFER":
      // AGB = 0.045 * DBH^2.1 * H
      return config.softwoodCoeff * Math.pow(dbhCm, config.softwoodExp) * heightM;

    case "FAST_GROWING_TROPICAL":
      // AGB = 0.11 * DBH^2.2 * H^0.6
      return (
        config.tropicalCoeff *
        Math.pow(dbhCm, config.tropicalExpDbh) *
        Math.pow(heightM, config.tropicalExpHeight)
      );

    default: {
      const exhaustiveCheck: never = treeType;
      throw new Error(`Unsupported tree type: ${String(exhaustiveCheck)}`);
    }
  }
}

/**
 * Pure 8-step calculation pipeline for a single tree measurement row.
 * Handles single-tree metrics and scales row totals by treeCount.
 */
export function calculateSingleTreeRow(
  input: TreeMeasurementInput,
  config: CarbonConfigValues = DEFAULT_CARBON_CONFIG
): SingleTreeBreakdown {
  if (input.circumferenceM <= 0 || input.circumferenceM > 20) {
    throw new Error("Circumference must be > 0 and <= 20 meters");
  }
  if (input.heightM <= 0 || input.heightM > 120) {
    throw new Error("Height must be > 0 and <= 120 meters");
  }
  if (!Number.isInteger(input.treeCount) || input.treeCount < 1 || input.treeCount > 100000) {
    throw new Error("Tree count must be an integer between 1 and 100,000");
  }

  // Step 1: DBH
  const dbhCm = calculateDbh(input.circumferenceM);

  // Step 2: AGB (Above-Ground Biomass in kg)
  const singleAgBkg = calculateAgb(input.treeType, dbhCm, input.heightM, config);

  // Step 3: BGB (Below-Ground Biomass in kg = AGB * 0.20)
  const singleBgBkg = singleAgBkg * config.bgbRatio;

  // Step 4: Total Biomass (AGB + BGB)
  const singleTotalBiomassKg = singleAgBkg + singleBgBkg;

  // Step 5: Carbon Mass (Total Biomass * 0.48)
  const singleCarbonMassKg = singleTotalBiomassKg * config.carbonFraction;

  // Step 6: CO2e in kg (Carbon Mass * 3.67)
  const singleCo2eKg = singleCarbonMassKg * config.co2Ratio;

  // Step 7: Gross Credits in tonnes (CO2e kg / 1000)
  const singleGrossCredits = singleCo2eKg / 1000;

  // Step 8: Net Credits in tonnes (Gross * 0.90 with 10% risk buffer deduction)
  const singleNetCredits = singleGrossCredits * config.bufferDiscount;

  // Scale totals by treeCount
  const count = input.treeCount;
  const totalAgBkg = singleAgBkg * count;
  const totalBgBkg = singleBgBkg * count;
  const totalBiomassKg = singleTotalBiomassKg * count;
  const totalCarbonMassKg = singleCarbonMassKg * count;
  const totalCo2eKg = singleCo2eKg * count;
  const totalGrossCredits = singleGrossCredits * count;
  const totalNetCredits = singleNetCredits * count;

  return {
    id: input.id,
    treeType: input.treeType,
    circumferenceM: input.circumferenceM,
    dbhCm,
    heightM: input.heightM,
    treeCount: count,
    speciesNote: input.speciesNote,

    singleAgBkg,
    singleBgBkg,
    singleTotalBiomassKg,
    singleCarbonMassKg,
    singleCo2eKg,
    singleGrossCredits,
    singleNetCredits,

    totalAgBkg,
    totalBgBkg,
    totalBiomassKg,
    totalCarbonMassKg,
    totalCo2eKg,
    totalGrossCredits,
    totalNetCredits,
  };
}

/**
 * Pure aggregation function calculating total plot carbon metrics across multiple tree rows.
 * Maintains full precision internally and computes optional per-hectare metrics.
 */
export function calculatePlotCarbon(
  input: PlotCalculationInput,
  configVersion: string = DEFAULT_CONFIG_VERSION
): PlotCalculationResult {
  const config = { ...DEFAULT_CARBON_CONFIG, ...input.configOverrides };

  if (!input.trees || input.trees.length === 0) {
    return {
      configVersion,
      methodologyVersion: METHODOLOGY_VERSION,
      totalTreesCount: 0,
      totalAgBkg: 0,
      totalBgBkg: 0,
      totalBiomassKg: 0,
      totalCarbonMassKg: 0,
      totalCo2eKg: 0,
      totalGrossCredits: 0,
      totalNetCredits: 0,
      bufferDeductionCredits: 0,
      areaHectares: input.areaHectares,
      creditsPerHectare: 0,
      breakdown: [],
      disclaimer: METHODOLOGY_DISCLAIMER,
    };
  }

  const breakdown: SingleTreeBreakdown[] = input.trees.map((tree) =>
    calculateSingleTreeRow(tree, config)
  );

  let totalTreesCount = 0;
  let totalAgBkg = 0;
  let totalBgBkg = 0;
  let totalBiomassKg = 0;
  let totalCarbonMassKg = 0;
  let totalCo2eKg = 0;
  let totalGrossCredits = 0;
  let totalNetCredits = 0;

  for (const row of breakdown) {
    totalTreesCount += row.treeCount;
    totalAgBkg += row.totalAgBkg;
    totalBgBkg += row.totalBgBkg;
    totalBiomassKg += row.totalBiomassKg;
    totalCarbonMassKg += row.totalCarbonMassKg;
    totalCo2eKg += row.totalCo2eKg;
    totalGrossCredits += row.totalGrossCredits;
    totalNetCredits += row.totalNetCredits;
  }

  const bufferDeductionCredits = totalGrossCredits - totalNetCredits;

  let creditsPerHectare: number | undefined;
  if (input.areaHectares !== undefined && input.areaHectares > 0) {
    creditsPerHectare = totalNetCredits / input.areaHectares;
  }

  return {
    configVersion,
    methodologyVersion: METHODOLOGY_VERSION,
    totalTreesCount,
    totalAgBkg,
    totalBgBkg,
    totalBiomassKg,
    totalCarbonMassKg,
    totalCo2eKg,
    totalGrossCredits,
    totalNetCredits,
    bufferDeductionCredits,
    areaHectares: input.areaHectares,
    creditsPerHectare,
    breakdown,
    disclaimer: METHODOLOGY_DISCLAIMER,
  };
}
