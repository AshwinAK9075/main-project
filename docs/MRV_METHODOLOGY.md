# MRV Methodology & Carbon Calculation

This document outlines the formulas and assumptions used by the Forest Carbon MRV platform to estimate carbon sequestration.

> **DISCLAIMER:** Estimates use generalized allometric equations and are not certified under Verra, Gold Standard, or any official registry. This platform is built for educational and demonstration purposes.

## Calculation Pipeline

The calculation process operates on a per-tree basis and follows a strictly defined pipeline. The logic is implemented as pure functions in `apps/web/src/lib/carbon/calculate.ts` to ensure consistency across the UI, API, and report generation.

### 1. Above-Ground Biomass (AGB)

AGB is calculated based on the tree type, Diameter at Breast Height (DBH, derived from circumference), and Height (H).

| Tree Type | Equation | Description |
| :--- | :--- | :--- |
| `HARDWOOD_BROADLEAF` | `AGB = 0.06 * DBH^2 * H` | Generic equation for mixed hardwood forests. |
| `SOFTWOOD_CONIFER` | `AGB = 0.045 * DBH^2.1 * H` | Generic equation for softwood/coniferous species. |
| `FAST_GROWING_TROPICAL` | `AGB = 0.11 * DBH^2.2 * H^0.6`| Generic equation for tropical plantation species. |

*Units: DBH in cm, Height in meters, AGB in kg.*

### 2. Biomass to Carbon Conversion

Once AGB is determined, the remaining pipeline scales the biomass to equivalent CO2 emissions.

1.  **Below-Ground Biomass (BGB):** Assumed to be 20% of AGB.
    `BGB = AGB * 0.20`
2.  **Total Biomass:**
    `Total Biomass = AGB + BGB`
3.  **Carbon Mass:** Assumed to be 48% of total biomass.
    `Carbon Mass = Total Biomass * 0.48`
4.  **CO2 Equivalent (CO2e):** The molecular weight ratio of CO2 to Carbon.
    `CO2e = Carbon Mass * 3.67`

### 3. Credit Generation

The final step converts the kg of CO2e into tradable carbon credits.

1.  **Gross Credits:** 1 Credit = 1 Tonne (1000 kg) of CO2e.
    `Gross Credits = CO2e / 1000`
2.  **Net Credits:** A standard 10% risk buffer is applied to account for potential reversal events (e.g., forest fires, disease) or measurement inaccuracies.
    `Net Credits = Gross Credits * 0.90`

## Limitations
*   The equations are highly generalized and do not account for specific regional variations, soil types, or nuanced species profiles.
*   The platform assumes all inputted measurements are accurate and truthful; robust physical or satellite verification is outside the scope of this implementation.
