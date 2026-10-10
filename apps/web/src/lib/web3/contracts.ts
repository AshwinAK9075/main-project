import EcoCarbonCreditAbiJson from "./abis/EcoCarbonCredit.json";
import CarbonMarketplaceAbiJson from "./abis/CarbonMarketplace.json";
import MockUSDCAbiJson from "./abis/MockUSDC.json";
import deploymentsJson from "./deployments.json";

export const ECO_CARBON_CREDIT_ABI = EcoCarbonCreditAbiJson.abi;
export const CARBON_MARKETPLACE_ABI = CarbonMarketplaceAbiJson.abi;
export const MOCK_USDC_ABI = MockUSDCAbiJson.abi;

export const CONTRACT_ADDRESSES = {
  ecoCarbonCredit:
    (process.env.NEXT_PUBLIC_ECO_CARBON_CREDIT_ADDRESS as `0x${string}`) ||
    (deploymentsJson.contracts.EcoCarbonCredit as `0x${string}`),
  carbonMarketplace:
    (process.env.NEXT_PUBLIC_CARBON_MARKETPLACE_ADDRESS as `0x${string}`) ||
    (deploymentsJson.contracts.CarbonMarketplace as `0x${string}`),
  mockUsdc:
    (process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS as `0x${string}`) ||
    (deploymentsJson.contracts.MockUSDC as `0x${string}`),
};

export const DEFAULT_CHAIN_ID = deploymentsJson.chainId || 31337;

/**
 * Convert metric tonnes of CO2e to integer milli-credits for on-chain ERC-1155 storage.
 * 1 token unit = 0.001 tCO2e
 */
export function tonnesToMilliCredits(tonnes: number): number {
  return Math.floor(tonnes * 1000);
}

/**
 * Convert on-chain milli-credits back to metric tonnes of CO2e.
 */
export function milliCreditsToTonnes(milliCredits: number): number {
  return milliCredits / 1000;
}

/**
 * Formats milli-credits as human readable tonnes CO2e.
 */
export function formatTonnesCo2e(milliCredits: number): string {
  return (milliCredits / 1000).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}
