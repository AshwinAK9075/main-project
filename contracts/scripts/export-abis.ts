import * as fs from "fs";
import * as path from "path";

async function main() {
  const artifactsBase = path.join(__dirname, "../artifacts/contracts");
  const targetDir = path.join(__dirname, "../../apps/web/src/lib/web3/abis");

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const contractsToExport = [
    {
      name: "EcoCarbonCredit",
      artifactPath: path.join(artifactsBase, "EcoCarbonCredit.sol/EcoCarbonCredit.json"),
    },
    {
      name: "CarbonMarketplace",
      artifactPath: path.join(artifactsBase, "CarbonMarketplace.sol/CarbonMarketplace.json"),
    },
    {
      name: "MockUSDC",
      artifactPath: path.join(artifactsBase, "mocks/MockUSDC.sol/MockUSDC.json"),
    },
  ];

  for (const contract of contractsToExport) {
    if (!fs.existsSync(contract.artifactPath)) {
      console.warn(`Artifact not found at ${contract.artifactPath}`);
      continue;
    }

    const artifactJson = JSON.parse(fs.readFileSync(contract.artifactPath, "utf8"));
    const abiOnly = {
      contractName: contract.name,
      abi: artifactJson.abi,
    };

    const targetFile = path.join(targetDir, `${contract.name}.json`);
    fs.writeFileSync(targetFile, JSON.stringify(abiOnly, null, 2));
    console.log(`Exported ABI for ${contract.name} to ${targetFile}`);
  }

  console.log("ABI export complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
