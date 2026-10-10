# Forest Carbon MRV Calculator and Web3 Marketplace

An end-to-end decentralized application and biophysical carbon accounting platform for forest carbon measurement, reporting, verification (MRV), tokenization, escrow trading, and cryptographic retirement.

## Tech Stack
- **Web App**: Next.js 14 (App Router), TypeScript (strict mode), Tailwind CSS, shadcn/ui
- **Calculation Engine**: Pure functional allometric carbon pipeline (`lib/carbon/calculate.ts`) calibrated with IPCC and forestry guidelines
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth with credentials and role-based access control (`LANDOWNER`, `VERIFIER`, `BUYER`, `ADMIN`)
- **Maps**: Leaflet & OpenStreetMap (dynamic client-side rendering)
- **Smart Contracts**: Solidity ^0.8.20, Hardhat, OpenZeppelin ERC-1155, escrow marketplace, Mock USDC
- **Storage**: IPFS via Pinata for MRV report dossiers
- **Certificates**: `pdf-lib` vector retirement certificates with QR verification

## Quick Start

### 1. Prerequisites
- Node.js >= 18
- pnpm >= 9
- Docker & Docker Compose (for PostgreSQL)

### 2. Installation
```bash
pnpm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

### 4. Database Setup
```bash
docker compose up -d
pnpm --filter web prisma:migrate
pnpm --filter web prisma:seed
```

### 5. Running the Application
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Disclaimer
Estimates use generalized allometric equations and are not certified under Verra, Gold Standard or any registry. Operates on EVM testnet infrastructure for academic demonstration purposes.
