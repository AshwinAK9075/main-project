import { createWalletClient, http, publicActions, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESSES, ECO_CARBON_CREDIT_ABI } from "./contracts";
import crypto from "crypto";

const hardhatChain: Chain = {
  id: 31337,
  name: "Hardhat",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
};

const polygonAmoyChain: Chain = {
  id: 80002,
  name: "Polygon Amoy",
  nativeCurrency: { name: "MATIC", symbol: "POL", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-amoy.polygon.technology"] } },
};

const DEFAULT_DEV_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as `0x${string}`;

/**
 * Executes on-chain minting of carbon credit ERC-1155 tokens.
 * Called only server-side by /api/mint/[projectId].
 */
export async function mintCarbonCreditsOnChain(params: {
  recipientAddress: string;
  tokenId: bigint;
  amountMilliCredits: bigint;
  ipfsCid: string;
}): Promise<{ txHash: string; simulated: boolean }> {
  const privateKey = (process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`) || DEFAULT_DEV_KEY;
  const isAmoy = process.env.NETWORK === "amoy";
  const chain = isAmoy ? polygonAmoyChain : hardhatChain;
  const rpcUrl = isAmoy
    ? process.env.POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology"
    : "http://127.0.0.1:8545";

  try {
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl, { timeout: 4000 }),
    }).extend(publicActions);

    // Call contract mint()
    const txHash = await client.writeContract({
      address: CONTRACT_ADDRESSES.ecoCarbonCredit,
      abi: ECO_CARBON_CREDIT_ABI,
      functionName: "mint",
      args: [
        params.recipientAddress as `0x${string}`,
        params.tokenId,
        params.amountMilliCredits,
        params.ipfsCid,
      ],
    });

    // Wait for 1 confirmation
    await client.waitForTransactionReceipt({ hash: txHash });

    return { txHash, simulated: false };
  } catch (err) {
    console.warn(
      "On-chain mint call to RPC failed or RPC offline. Generating deterministic simulated tx hash:",
      err
    );

    // Deterministic mock tx hash for offline demo / test runs
    const seed = `${params.recipientAddress}-${params.tokenId}-${params.amountMilliCredits}-${params.ipfsCid}`;
    const hash = crypto.createHash("sha256").update(seed).digest("hex");
    const simulatedTxHash = `0x${hash}`;

    return { txHash: simulatedTxHash, simulated: true };
  }
}
