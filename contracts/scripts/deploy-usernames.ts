import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Usernames = await ethers.getContractFactory("Usernames");
  const u = await Usernames.deploy();
  await u.waitForDeployment();
  const addr = await u.getAddress();
  console.log("Usernames:", addr);

  const file = path.resolve(__dirname, "../deployments", `${network.name}.json`);
  const existing = JSON.parse(fs.readFileSync(file, "utf8"));
  existing.contracts.Usernames = addr;
  existing.deployedAt = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(existing, null, 2));

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
