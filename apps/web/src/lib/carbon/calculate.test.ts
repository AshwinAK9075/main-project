import { describe, expect, it } from "vitest";
import { calculateAgb, calculateDbh, calculatePlotCarbon, calculateSingleTreeRow } from "./calculate";
import { TreeMeasurementInput } from "./types";

describe("Carbon Calculation Engine (Section 4 Spec)", () => {
  // Test reference parameters from Section 4.4:
  // circumference = 1.2566370614 m -> DBH = 40 cm
  // height = 20 m, 1 tree
  const TEST_CIRCUMFERENCE = 1.2566370614;
  const TEST_HEIGHT = 20;

  it("calculates DBH correctly from circumference", () => {
    const dbh = calculateDbh(TEST_CIRCUMFERENCE);
    expect(dbh).toBeCloseTo(40.0, 4);
  });

  describe("Hardwood / Broadleaf Mix (4.4 Vector)", () => {
    const input: TreeMeasurementInput = {
      treeType: "HARDWOOD_BROADLEAF",
      circumferenceM: TEST_CIRCUMFERENCE,
      heightM: TEST_HEIGHT,
      treeCount: 1,
    };

    it("matches Section 4.4 expected values within tolerance (0.01 kg, 0.0001 tonnes)", () => {
      const result = calculateSingleTreeRow(input);

      expect(result.singleAgBkg).toBeCloseTo(1920.0, 2);
      expect(result.singleBgBkg).toBeCloseTo(384.0, 2);
      expect(result.singleTotalBiomassKg).toBeCloseTo(2304.0, 2);
      expect(result.singleCarbonMassKg).toBeCloseTo(1105.92, 2);
      expect(result.singleCo2eKg).toBeCloseTo(4058.73, 2);
      expect(result.singleGrossCredits).toBeCloseTo(4.0587, 4);
      expect(result.singleNetCredits).toBeCloseTo(3.6529, 4);
    });
  });

  describe("Softwood / Conifer Mix (4.4 Vector)", () => {
    const input: TreeMeasurementInput = {
      treeType: "SOFTWOOD_CONIFER",
      circumferenceM: TEST_CIRCUMFERENCE,
      heightM: TEST_HEIGHT,
      treeCount: 1,
    };

    it("matches Section 4.4 expected values within tolerance (0.01 kg, 0.0001 tonnes)", () => {
      const result = calculateSingleTreeRow(input);

      expect(result.singleAgBkg).toBeCloseTo(2082.42, 2);
      expect(result.singleBgBkg).toBeCloseTo(416.48, 2);
      expect(result.singleTotalBiomassKg).toBeCloseTo(2498.9, 2);
      expect(result.singleCarbonMassKg).toBeCloseTo(1199.47, 2);
      expect(result.singleCo2eKg).toBeCloseTo(4402.07, 2);
      expect(result.singleGrossCredits).toBeCloseTo(4.4021, 4);
      expect(result.singleNetCredits).toBeCloseTo(3.9619, 4);
    });
  });

  describe("Fast-Growing / Tropical Plantation (4.4 Vector)", () => {
    const input: TreeMeasurementInput = {
      treeType: "FAST_GROWING_TROPICAL",
      circumferenceM: TEST_CIRCUMFERENCE,
      heightM: TEST_HEIGHT,
      treeCount: 1,
    };

    it("matches Section 4.4 expected values within tolerance (0.01 kg, 0.0001 tonnes)", () => {
      const result = calculateSingleTreeRow(input);

      expect(result.singleAgBkg).toBeCloseTo(2220.97, 2);
      expect(result.singleBgBkg).toBeCloseTo(444.19, 2);
      expect(result.singleTotalBiomassKg).toBeCloseTo(2665.16, 2);
      expect(result.singleCarbonMassKg).toBeCloseTo(1279.28, 2);
      expect(result.singleCo2eKg).toBeCloseTo(4694.95, 2);
      expect(result.singleGrossCredits).toBeCloseTo(4.695, 4);
      expect(result.singleNetCredits).toBeCloseTo(4.2255, 4);
    });
  });

  describe("Tree Count Multiplication", () => {
    it("correctly scales metrics by treeCount", () => {
      const count = 50;
      const input: TreeMeasurementInput = {
        treeType: "HARDWOOD_BROADLEAF",
        circumferenceM: TEST_CIRCUMFERENCE,
        heightM: TEST_HEIGHT,
        treeCount: count,
      };

      const result = calculateSingleTreeRow(input);
      expect(result.totalAgBkg).toBeCloseTo(result.singleAgBkg * count, 4);
      expect(result.totalBgBkg).toBeCloseTo(result.singleBgBkg * count, 4);
      expect(result.totalBiomassKg).toBeCloseTo(result.singleTotalBiomassKg * count, 4);
      expect(result.totalCarbonMassKg).toBeCloseTo(result.singleCarbonMassKg * count, 4);
      expect(result.totalCo2eKg).toBeCloseTo(result.singleCo2eKg * count, 4);
      expect(result.totalGrossCredits).toBeCloseTo(result.singleGrossCredits * count, 4);
      expect(result.totalNetCredits).toBeCloseTo(result.singleNetCredits * count, 4);
    });
  });

  describe("Plot Level Aggregation & Per-Hectare Calculations", () => {
    it("correctly aggregates multiple tree rows and computes per-hectare metrics", () => {
      const trees: TreeMeasurementInput[] = [
        {
          treeType: "HARDWOOD_BROADLEAF",
          circumferenceM: TEST_CIRCUMFERENCE,
          heightM: TEST_HEIGHT,
          treeCount: 10,
        },
        {
          treeType: "SOFTWOOD_CONIFER",
          circumferenceM: TEST_CIRCUMFERENCE,
          heightM: TEST_HEIGHT,
          treeCount: 5,
        },
      ];

      const areaHectares = 2.5;
      const plot = calculatePlotCarbon({ trees, areaHectares });

      expect(plot.totalTreesCount).toBe(15);

      const expectedGross = 4.0587264 * 10 + 4.4020724 * 5;
      const expectedNet = expectedGross * 0.9;

      expect(plot.totalGrossCredits).toBeCloseTo(expectedGross, 3);
      expect(plot.totalNetCredits).toBeCloseTo(expectedNet, 3);
      expect(plot.bufferDeductionCredits).toBeCloseTo(expectedGross - expectedNet, 3);
      expect(plot.creditsPerHectare).toBeCloseTo(expectedNet / areaHectares, 3);
      expect(plot.disclaimer).toContain("Estimates use generalized allometric equations");
    });

    it("handles empty tree array gracefully", () => {
      const plot = calculatePlotCarbon({ trees: [] });
      expect(plot.totalTreesCount).toBe(0);
      expect(plot.totalNetCredits).toBe(0);
      expect(plot.breakdown).toHaveLength(0);
    });
  });

  describe("Validation & Invariant Safety (No NaN, No Negatives)", () => {
    it("throws clear errors on non-positive circumference", () => {
      expect(() =>
        calculateSingleTreeRow({
          treeType: "HARDWOOD_BROADLEAF",
          circumferenceM: 0,
          heightM: 20,
          treeCount: 1,
        })
      ).toThrow("Circumference must be > 0 and <= 20 meters");

      expect(() =>
        calculateSingleTreeRow({
          treeType: "HARDWOOD_BROADLEAF",
          circumferenceM: -1.5,
          heightM: 20,
          treeCount: 1,
        })
      ).toThrow("Circumference must be > 0 and <= 20 meters");
    });

    it("throws clear errors on circumference exceeding 20m", () => {
      expect(() =>
        calculateSingleTreeRow({
          treeType: "HARDWOOD_BROADLEAF",
          circumferenceM: 20.5,
          heightM: 20,
          treeCount: 1,
        })
      ).toThrow("Circumference must be > 0 and <= 20 meters");
    });

    it("throws clear errors on invalid height", () => {
      expect(() =>
        calculateSingleTreeRow({
          treeType: "HARDWOOD_BROADLEAF",
          circumferenceM: 1.2,
          heightM: 0,
          treeCount: 1,
        })
      ).toThrow("Height must be > 0 and <= 120 meters");

      expect(() =>
        calculateSingleTreeRow({
          treeType: "HARDWOOD_BROADLEAF",
          circumferenceM: 1.2,
          heightM: 125,
          treeCount: 1,
        })
      ).toThrow("Height must be > 0 and <= 120 meters");
    });

    it("throws clear errors on non-integer or out-of-range treeCount", () => {
      expect(() =>
        calculateSingleTreeRow({
          treeType: "HARDWOOD_BROADLEAF",
          circumferenceM: 1.2,
          heightM: 20,
          treeCount: 0,
        })
      ).toThrow("Tree count must be an integer between 1 and 100,000");

      expect(() =>
        calculateSingleTreeRow({
          treeType: "HARDWOOD_BROADLEAF",
          circumferenceM: 1.2,
          heightM: 20,
          treeCount: 2.5,
        })
      ).toThrow("Tree count must be an integer between 1 and 100,000");
    });

    it("ensures no output value is negative or NaN", () => {
      const treeTypes = [
        "HARDWOOD_BROADLEAF",
        "SOFTWOOD_CONIFER",
        "FAST_GROWING_TROPICAL",
      ] as const;

      for (const t of treeTypes) {
        const res = calculateSingleTreeRow({
          treeType: t,
          circumferenceM: 0.5,
          heightM: 10,
          treeCount: 1,
        });

        expect(Number.isFinite(res.singleAgBkg)).toBe(true);
        expect(res.singleAgBkg).toBeGreaterThan(0);
        expect(Number.isFinite(res.singleBgBkg)).toBe(true);
        expect(res.singleBgBkg).toBeGreaterThan(0);
        expect(Number.isFinite(res.singleTotalBiomassKg)).toBe(true);
        expect(res.singleTotalBiomassKg).toBeGreaterThan(0);
        expect(Number.isFinite(res.singleCarbonMassKg)).toBe(true);
        expect(res.singleCarbonMassKg).toBeGreaterThan(0);
        expect(Number.isFinite(res.singleCo2eKg)).toBe(true);
        expect(res.singleCo2eKg).toBeGreaterThan(0);
        expect(Number.isFinite(res.singleGrossCredits)).toBe(true);
        expect(res.singleGrossCredits).toBeGreaterThan(0);
        expect(Number.isFinite(res.singleNetCredits)).toBe(true);
        expect(res.singleNetCredits).toBeGreaterThan(0);
      }
    });
  });
});
