import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

describe("POST /api/calculate Route Handler", () => {
  it("calculates plot carbon correctly for valid inputs", async () => {
    const req = new NextRequest("http://localhost:3000/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trees: [
          {
            treeType: "HARDWOOD_BROADLEAF",
            circumferenceM: 1.2566370614,
            heightM: 20,
            treeCount: 1,
          },
        ],
        areaHectares: 1,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.totalNetCredits).toBeCloseTo(3.6529, 4);
    expect(data.totalGrossCredits).toBeCloseTo(4.0587, 4);
    expect(data.disclaimer).toContain("Estimates use generalized allometric equations");
  });

  it("returns validation error for out-of-range inputs", async () => {
    const req = new NextRequest("http://localhost:3000/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trees: [
          {
            treeType: "HARDWOOD_BROADLEAF",
            circumferenceM: -5,
            heightM: 20,
            treeCount: 1,
          },
        ],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe("VALIDATION_ERROR");
    expect(data.error.fields["trees.0.circumferenceM"]).toBeDefined();
  });
});
