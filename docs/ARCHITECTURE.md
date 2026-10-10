# Architecture Overview

This project is a decentralized MRV (Measurement, Reporting, and Verification) platform for forest carbon credits, built as a Next.js monorepo.

## System Components

1.  **Web Application (`apps/web`)**
    *   **Framework:** Next.js 14 (App Router)
    *   **Database:** Prisma ORM with SQLite (local development proxy for PostgreSQL)
    *   **Authentication:** NextAuth.js (Credentials provider) with role-based access control (Landowner, Verifier, Admin, Buyer).
    *   **Web3 Integration:** `wagmi`, `viem`, and RainbowKit for wallet connections and blockchain interactions.
    *   **Styling:** Tailwind CSS & shadcn/ui.

2.  **Smart Contracts (`contracts`)**
    *   **Framework:** Hardhat
    *   **Contracts:**
        *   `EcoCarbonCredit.sol`: An ERC-1155 token representing verified carbon credits. Uses OpenZeppelin AccessControl.
        *   `CarbonMarketplace.sol`: An escrow-based marketplace for listing and buying credits.
        *   `MockUSDC.sol`: A mock ERC-20 token used for purchasing credits on the testnet.

3.  **External Services**
    *   **IPFS (Pinata):** Used to store verified MRV reports in a decentralized, immutable manner (currently using deterministic mock fallback for local dev).
    *   **Polygon Amoy Testnet:** The target blockchain for deploying the smart contracts (simulated via local Hardhat network for development).

## Data Flow & Core Workflows

### 1. Project Submission (Landowner)
1. Landowner registers and creates a new project.
2. Landowner enters plot details and individual tree measurements (DBH, height, species).
3. The platform calculates estimated carbon credits using deterministic allometric equations.
4. Project data is saved to the local database with a `SUBMITTED` status.

### 2. Verification & Minting (Verifier)
1. Verifier reviews the submitted project and its calculations.
2. If approved, the platform updates the database status to `APPROVED`.
3. The MRV report is pinned to IPFS to ensure data immutability.
4. The platform's secure server-side minter calls `EcoCarbonCredit.mint()` on-chain, passing the IPFS CID as the token URI.
5. The project status becomes `MINTED`.

### 3. Marketplace & Retirement (Buyer)
1. Landowners can list their minted credits on the `CarbonMarketplace`.
2. Buyers connect their Web3 wallet and purchase credits using MockUSDC.
3. Upon purchase, the smart contract transfers the ERC-1155 tokens to the buyer and USDC to the seller.
4. Buyers can choose to **retire** their credits, effectively burning them on-chain.
5. The platform generates a verifiable PDF Retirement Certificate.
