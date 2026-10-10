import { z } from "zod";

export const treeTypeEnum = z.enum([
  "HARDWOOD_BROADLEAF",
  "SOFTWOOD_CONIFER",
  "FAST_GROWING_TROPICAL",
]);

export const treeMeasurementSchema = z.object({
  id: z.string().optional(),
  treeType: treeTypeEnum,
  circumferenceM: z
    .number({ invalid_type_error: "Circumference must be a number" })
    .gt(0, "Circumference must be greater than 0 meters")
    .lte(20, "Circumference must be at most 20 meters"),
  heightM: z
    .number({ invalid_type_error: "Height must be a number" })
    .gt(0, "Height must be greater than 0 meters")
    .lte(120, "Height must be at most 120 meters"),
  treeCount: z
    .number({ invalid_type_error: "Tree count must be a number" })
    .int("Tree count must be an integer")
    .min(1, "Tree count must be at least 1")
    .max(100000, "Tree count must be at most 100,000"),
  speciesNote: z.string().max(255).optional(),
});

export const calculatePlotSchema = z.object({
  trees: z
    .array(treeMeasurementSchema)
    .min(1, "At least one tree measurement row is required"),
  areaHectares: z
    .number({ invalid_type_error: "Area must be a number" })
    .gt(0, "Area must be greater than 0 hectares")
    .lte(100000, "Area must be at most 100,000 hectares")
    .optional(),
});

export const projectCreateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  country: z.string().min(2, "Country is required").max(60),
  region: z.string().min(2, "Region is required").max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  areaHectares: z.number().gt(0).lte(100000),
  trees: z.array(treeMeasurementSchema).min(1, "At least one tree row is required"),
});

export const verificationDecisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().max(2000).optional(),
  rejectionReason: z.string().min(5, "Rejection reason required when rejecting").max(1000).optional(),
});

export const listingCreateSchema = z.object({
  tokenId: z.string().min(1, "Token ID is required").optional(),
  batchId: z.string().min(1, "Batch ID is required").optional(),
  amount: z.number().int().min(1, "Amount must be at least 1 token unit").optional(),
  quantityAvailable: z.number().int().min(1).optional(),
  pricePerCreditUsdc: z.number().gt(0, "Price must be greater than 0 USDC"),
  onchainListingId: z.string().optional(),
});

export const createListingSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  pricePerCreditUsdc: z.number().gt(0, "Price must be greater than 0 USDC"),
  quantityAvailable: z.number().int().min(1, "Quantity must be at least 1 unit"),
  onchainListingId: z.string().optional(),
});

export const buyCreditsSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1 unit"),
  txHash: z.string().optional(),
});

export const retirementRequestSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1 unit"),
  beneficiaryName: z.string().min(2, "Beneficiary name must be at least 2 characters").max(120),
  reason: z.string().min(5, "Retirement reason must be at least 5 characters").max(500),
  txHash: z.string().min(5, "Transaction hash is required").optional(),
});

export const retireCreditsSchema = retirementRequestSchema;

export type TreeMeasurementSchema = z.infer<typeof treeMeasurementSchema>;
export type CalculatePlotSchema = z.infer<typeof calculatePlotSchema>;
export type ProjectCreateSchema = z.infer<typeof projectCreateSchema>;
export type VerificationDecisionSchema = z.infer<typeof verificationDecisionSchema>;
export type ListingCreateSchema = z.infer<typeof listingCreateSchema>;
export type CreateListingSchema = z.infer<typeof createListingSchema>;
export type BuyCreditsSchema = z.infer<typeof buyCreditsSchema>;
export type RetirementRequestSchema = z.infer<typeof retirementRequestSchema>;
export type RetireCreditsSchema = z.infer<typeof retireCreditsSchema>;
