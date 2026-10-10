# Live Demo Script (Viva Preparation)

Follow this step-by-step script to demonstrate the full platform lifecycle during your final-year project viva.

## Setup (Before the Demo)

1.  Ensure the development server is running in the root directory: `pnpm dev`
2.  Ensure the Hardhat local node is running: `cd contracts && npx hardhat node`
3.  Have a Web3 wallet (e.g., MetaMask) installed in your browser.
4.  Configure MetaMask to connect to the local Hardhat network (`http://127.0.0.1:8545`, Chain ID: `31337`).
5.  Import at least two accounts from the Hardhat node terminal into MetaMask using their private keys (e.g., Account 0 for Admin/Minter, Account 1 for Buyer).
6.  Ensure the database is seeded with demo users: `pnpm --filter web db:seed`

## Step 1: The Landowner (Project Creation)

1.  Open an incognito window to `http://localhost:3000`.
2.  Navigate to **Login**.
3.  Log in as the demo landowner (e.g., `landowner@example.com` / `password123`).
4.  Navigate to **Dashboard -> Projects**.
5.  Click **Create New Project**.
6.  Fill out the basic details (Name, Location, Area).
7.  In the **Tree Measurements** section, add 2-3 sample trees with realistic data (e.g., Circumference: 1.5m, Height: 20m, Type: Hardwood).
8.  Observe the real-time calculation update on the right side. *Point out the transparency of the MRV equations.*
9.  Click **Submit for Verification**. The project status changes to `SUBMITTED`.
10. Log out.

## Step 2: The Verifier (Approval & Minting)

1.  Log in as the demo verifier (e.g., `verifier@example.com` / `password123`).
2.  Navigate to **Dashboard -> Verification Queue**.
3.  Select the newly submitted project.
4.  Review the submitted data. *Explain that in reality, this would involve cross-referencing satellite imagery or field audits.*
5.  Click **Approve Project**.
6.  *Crucial talking point:* Explain what happens in the background:
    *   The MRV report is pinned to IPFS (show the mocked CID in the UI).
    *   The Next.js backend securely mints an ERC-1155 token on the blockchain representing this verified batch.
7.  Log out.

## Step 3: The Buyer (Marketplace & Retirement)

1.  Log in as the demo buyer (e.g., `buyer@example.com` / `password123`).
2.  Ensure your MetaMask is set to the Hardhat network and connected to the "Buyer" account (Account 1).
3.  Navigate to the **Marketplace**.
4.  *(Note: if no listings exist, you may need to quickly log back in as the landowner and list the newly minted project. Or show an existing seeded listing).*
5.  Find a listed project and click **Buy Credits**.
6.  Approve the MockUSDC transaction in MetaMask. *Explain the escrow smart contract mechanism.*
7.  Navigate to **Dashboard -> Portfolio**. You should see the purchased credits.
8.  Select the credits and click **Retire**.
9.  Approve the retirement transaction in MetaMask. *Explain that this permanently removes the credits from circulation (burning them).*
10. Once retired, click the link to **View Certificate**.
11. A PDF retirement certificate will be generated and displayed. *Point out the unique Retirement ID and verifiable data.*

## End of Demo
*   Conclude by highlighting the main achievements: Full-stack integration, automated transparent MRV calculations, role-based access, and functional Web3 smart contracts linking real-world data to on-chain assets.
