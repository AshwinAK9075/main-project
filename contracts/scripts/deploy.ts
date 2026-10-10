import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address} on network: ${network.name}`);

  // 1. Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`MockUSDC deployed to: ${usdcAddress}`);

  // 2. Deploy EcoCarbonCredit (deployer is admin & minter)
  const EcoCarbonCredit = await ethers.getContractFactory("EcoCarbonCredit");
  const credit = await EcoCarbonCredit.deploy(deployer.address);
  await credit.waitForDeployment();
  const creditAddress = await credit.getAddress();
  console.log(`EcoCarbonCredit deployed to: ${creditAddress}`);

  // 3. Deploy CarbonMarketplace (0% platform fee for initial testnet launch)
  const CarbonMarketplace = await ethers.getContractFactory("CarbonMarketplace");
  const marketplace = await CarbonMarketplace.deploy(deployer.address, 0n);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log(`CarbonMarketplace deployed to: ${marketplaceAddress}`);

  const chainId = (await ethers.provider.getNetwork()).chainId;

  const deploymentData = {
    network: network.name,
    chainId: Number(chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      MockUSDC: usdcAddress,
      EcoCarbonCredit: creditAddress,
      CarbonMarketplace: marketplaceAddress,
    },
  };

  // Write to contracts/deployments/<network>.json
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  const deploymentFilePath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentData, null, 2));
  console.log(`Saved deployment info to: ${deploymentFilePath}`);

  // Also write to apps/web/src/lib/web3/deployments.json for the front-end
  const webDeploymentsDir = path.join(__dirname, "../../apps/web/src/lib/web3");
  if (!fs.existsSync(webDeploymentsDir)) {
    fs.mkdirSync(webDeploymentsDir, { recursive: true });
  }
  const webDeploymentFilePath = path.join(webDeploymentsDir, "deployments.json");
  fs.writeFileSync(webDeploymentFilePath, JSON.stringify(deploymentData, null, 2));
  console.log(`Synced deployment info to frontend: ${webDeploymentFilePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
