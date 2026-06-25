import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Deploys only the ActivityBadges contract. Reuses the LitPass address from
 * the existing deployment file so we don't redeploy everything.
 *
 * Requires ATTESTATION_SIGNER_ADDRESS in .env.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Network:", network.name);

  const deploymentFile = path.resolve(__dirname, "../deployments", `${network.name}.json`);
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Missing deployment file: ${deploymentFile}. Run scripts/deploy.ts first.`);
  }
  const existing = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  // Preserve the original deploymentBlock if present
  existing.deploymentBlock = existing.deploymentBlock ?? null;
  const passAddr: string = existing.contracts.LitPass;

  const signerAddr = process.env.ATTESTATION_SIGNER_ADDRESS;
  if (!signerAddr || signerAddr === "0x0000000000000000000000000000000000000000") {
    throw new Error("Missing ATTESTATION_SIGNER_ADDRESS in .env");
  }

  console.log("Reusing LitPass:    ", passAddr);
  console.log("Signer:             ", signerAddr);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "zkLTC");

  const Activity = await ethers.getContractFactory("ActivityBadges");
  const activity = await Activity.deploy(deployer.address, passAddr, signerAddr);
  await activity.waitForDeployment();
  const activityAddr = await activity.getAddress();
  const tx = activity.deploymentTransaction();
  console.log("ActivityBadges:     ", activityAddr, "block:", tx?.blockNumber);

  existing.contracts.ActivityBadges = activityAddr;
  existing.deployedAt = new Date().toISOString();
  fs.writeFileSync(deploymentFile, JSON.stringify(existing, null, 2));
  console.log("Updated:", deploymentFile);

  // Mirror to frontend
  const webPath = path.resolve(__dirname, "../../web/lib/deployment.json");
  if (fs.existsSync(path.dirname(webPath))) {
    fs.writeFileSync(webPath, JSON.stringify(existing, null, 2));
    console.log("Mirrored to:", webPath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
