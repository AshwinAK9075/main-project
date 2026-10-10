import { CarbonConfigValues, TreeTypeOption } from "./types";

/**
 * Standard biophysical coefficients for generalized allometric equations
 * Derived from forestry literature (Brown et al., Chave et al.) and IPCC Good Practice Guidance.
 */
export const HARDWOOD_COEFF = 0.06;
export const HARDWOOD_EXP = 2.0;

export const SOFTWOOD_COEFF = 0.045;
export const SOFTWOOD_EXP = 2.1;

export const TROPICAL_COEFF = 0.11;
export const TROPICAL_EXP_DBH = 2.2;
export const TROPICAL_EXP_HEIGHT = 0.6;

/**
 * Root-to-shoot ratio for Below-Ground Biomass (BGB = AGB * 0.20)
 */
export const BGB_RATIO = 0.20;

/**
 * Carbon fraction of dry biomass (Total Biomass * 0.48)
 */
export const CARBON_FRACTION = 0.48;

/**
 * Molecular weight ratio of CO2 to Carbon (44 / 12 ≈ 3.67)
 */
export const CO2_RATIO = 3.67;

/**
 * Kilograms per metric tonne of CO2
 */
export const KG_PER_TONNE = 1000;

/**
 * Non-permanence risk buffer fraction (10% deduction -> Net = Gross * 0.90)
 */
export const BUFFER_DISCOUNT = 0.90;

export const DEFAULT_CARBON_CONFIG: CarbonConfigValues = {
  hardwoodCoeff: HARDWOOD_COEFF,
  softwoodCoeff: SOFTWOOD_COEFF,
  softwoodExp: SOFTWOOD_EXP,
  tropicalCoeff: TROPICAL_COEFF,
  tropicalExpDbh: TROPICAL_EXP_DBH,
  tropicalExpHeight: TROPICAL_EXP_HEIGHT,
  bgbRatio: BGB_RATIO,
  carbonFraction: CARBON_FRACTION,
  co2Ratio: CO2_RATIO,
  bufferDiscount: BUFFER_DISCOUNT,
};

export const DEFAULT_CONFIG_VERSION = "v1.0.0";
export const METHODOLOGY_VERSION = "MRV-ALLOMETRIC-2024.1";

export const METHODOLOGY_DISCLAIMER =
  "Estimates use generalized allometric equations and are not certified under Verra, Gold Standard or any registry.";

export const TREE_TYPE_OPTIONS: TreeTypeOption[] = [
  {
    value: "HARDWOOD_BROADLEAF",
    label: "Hardwood / Broadleaf Mix",
    formula: "0.06 × DBH² × H",
    description: "Oak, Maple, Birch, Beech, Teak, and mixed temperate hardwood forests",
  },
  {
    value: "SOFTWOOD_CONIFER",
    label: "Softwood / Conifer Mix",
    formula: "0.045 × DBH²·¹ × H",
    description: "Pine, Spruce, Fir, Cedar, and temperate needleleaf coniferous forests",
  },
  {
    value: "FAST_GROWING_TROPICAL",
    label: "Fast-Growing / Tropical Plantation",
    formula: "0.11 × DBH²·² × H⁰·⁶",
    description: "Eucalyptus, Acacia, Bamboo, and high-growth tropical agroforestry plantations",
  },
];
