import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygonAmoy, sepolia, hardhat } from "wagmi/chains";
import { http } from "viem";

export const web3Config = getDefaultConfig({
  appName: "Forest Carbon MRV Platform",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "forest-carbon-mrv-demo-id",
  chains: [hardhat, polygonAmoy, sepolia],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_AMOY_RPC || "https://rpc-amoy.polygon.technology"),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org"),
  },
  ssr: true,
});
