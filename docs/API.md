# Internal API Reference

The platform utilizes Next.js Route Handlers (`app/api/...`) to serve the front-end. It does not use a separate backend server.

## Authentication

*   `POST /api/auth/[...nextauth]`
    *   Handles login, registration (if exposed), and session management via Auth.js.

## Carbon Calculation

*   `POST /api/calculate`
    *   **Description:** Stateless endpoint to calculate carbon yields for a set of trees.
    *   **Body:** `{ trees: Array<{ circumference: number, height: number, type: string }> }`
    *   **Response:** `{ aGB: number, bGB: number, totalBiomass: number, carbonMass: number, co2e: number, grossCredits: number, netCredits: number }`

## Project Management

*   `GET /api/projects`
    *   **Description:** Fetches projects accessible to the user (Landowners see theirs, Verifiers/Admins see all).
*   `POST /api/projects`
    *   **Description:** Creates a new project draft.
*   `GET /api/projects/[id]`
    *   **Description:** Retrieves detailed project data, including tree measurements.
*   `POST /api/projects/[id]/submit`
    *   **Description:** Transitions a project from `DRAFT` to `SUBMITTED`.

## Verification & Minting

*   `POST /api/verification/[id]/approve`
    *   **Description:** (Verifier only) Approves a project, pins MRV to IPFS, and triggers the on-chain minting process via server-side wallet.
    *   **Response:** `{ success: boolean, cid: string, txHash: string }`
*   `POST /api/verification/[id]/reject`
    *   **Description:** (Verifier only) Rejects a project with feedback.
*   `POST /api/mint/[projectId]`
    *   **Description:** Internal route used by the approval process to execute the contract minting.

## Marketplace & Retirement

*   `GET /api/listings`
    *   **Description:** Fetches active listings from the database (synced with on-chain events or manually tracked).
*   `POST /api/listings`
    *   **Description:** Records a new listing created by a landowner.
*   `GET /api/retirements`
    *   **Description:** Fetches a user's retired credits for their portfolio view.
*   `POST /api/retirements`
    *   **Description:** Records a successful on-chain retirement event and generates the PDF certificate record.

## Certificates

*   `GET /api/certificates/[id]/pdf`
    *   **Description:** Generates and serves a verifiable PDF Retirement Certificate on the fly.
