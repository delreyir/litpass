import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

const NEW_DAY_LENGTH = 86400; // 24h

async function main() {
  const [deployer] = await ethers.getSigners();
  const deploymentFile = path.resolve(__dirname, "../deployments", `${network.name}.json`);
  const existing = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const passAddr: string = existing.contracts.LitPass;

  console.log("Signer  :", deployer.address);
  console.log("Network :", network.name);
  console.log("LitPass :", passAddr);

  const litPass = await ethers.getContractAt("LitPass", passAddr);

  const currentLength = await litPass.dayLength();
  console.log("Current dayLength:", currentLength.toString(), "seconds");

  if (Number(currentLength) === NEW_DAY_LENGTH) {
    console.log("Already at target. Nothing to do.");
    return;
  }

  console.log(`Updating to ${NEW_DAY_LENGTH} seconds (${NEW_DAY_LENGTH / 3600}h)...`);
  const tx = await litPass.setDayLength(NEW_DAY_LENGTH);
  console.log("tx:", tx.hash);
  await tx.wait();
  const updated = await litPass.dayLength();
  console.log("New dayLength:", updated.toString(), "seconds");

  // Persist to deployment file + mirror
  existing.dayLength = NEW_DAY_LENGTH;
  fs.writeFileSync(deploymentFile, JSON.stringify(existing, null, 2));
  const webPath = path.resolve(__dirname, "../../web/lib/deployment.json");
  if (fs.existsSync(path.dirname(webPath))) {
    fs.writeFileSync(webPath, JSON.stringify(existing, null, 2));
  }
  console.log("Updated deployment files.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
