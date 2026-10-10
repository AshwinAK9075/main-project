import { NextRequest } from "next/server";
import { calculatePlotSchema } from "@/lib/validation/schemas";
import { calculatePlotCarbon } from "@/lib/carbon/calculate";
import { checkRateLimit, handleApiError, jsonError, jsonSuccess } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local-client";
    const rate = checkRateLimit(ip, 120, 60000);
    if (!rate.success) {
      return jsonError("Too many requests, please try again later", "RATE_LIMIT_EXCEEDED", 429);
    }

    const body = await req.json();
    const parsed = calculatePlotSchema.parse(body);

    const result = calculatePlotCarbon({
      trees: parsed.trees,
      areaHectares: parsed.areaHectares,
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
