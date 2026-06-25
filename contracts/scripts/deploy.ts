import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

// On LitVM testnet a "day" is 1 hour so users can test streaks quickly.
// Set to 86400 (1 day) for mainnet.
const TESTNET_DAY_LENGTH = 3600;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Network:", network.name, "chainId:", (await ethers.provider.getNetwork()).chainId);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "zkLTC");

  // 1. LitPass
  const LitPass = await ethers.getContractFactory("LitPass");
  const pass = await LitPass.deploy(deployer.address, TESTNET_DAY_LENGTH);
  await pass.waitForDeployment();
  const passAddr = await pass.getAddress();
  const passDeployTx = pass.deploymentTransaction();
  const passDeployBlock = passDeployTx?.blockNumber ?? null;
  console.log("LitPass:           ", passAddr, "block:", passDeployBlock);

  // 2. AchievementBadges
  const Badges = await ethers.getContractFactory("AchievementBadges");
  const badges = await Badges.deploy(deployer.address, passAddr);
  await badges.waitForDeployment();
  const badgesAddr = await badges.getAddress();
  console.log("AchievementBadges: ", badgesAddr);

  // 3. StampRegistry
  const Stamps = await ethers.getContractFactory("StampRegistry");
  const stamps = await Stamps.deploy(deployer.address, passAddr);
  await stamps.waitForDeployment();
  const stampsAddr = await stamps.getAddress();
  console.log("StampRegistry:     ", stampsAddr);

  // 4. ReferralTracker
  const Refs = await ethers.getContractFactory("ReferralTracker");
  const refs = await Refs.deploy(passAddr);
  await refs.waitForDeployment();
  const refsAddr = await refs.getAddress();
  console.log("ReferralTracker:   ", refsAddr);

  // Persist addresses for the frontend.
  const out = {
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    network: network.name,
    deployer: deployer.address,
    dayLength: TESTNET_DAY_LENGTH,
    deploymentBlock: passDeployBlock,
    contracts: {
      LitPass: passAddr,
      AchievementBadges: badgesAddr,
      StampRegistry: stampsAddr,
      ReferralTracker: refsAddr,
    },
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.resolve(__dirname, "../deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${network.name}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log("Saved:", file);

  // Also drop a copy into the frontend lib if it exists.
  const webPath = path.resolve(__dirname, "../../web/lib/deployment.json");
  if (fs.existsSync(path.resolve(__dirname, "../../web"))) {
    fs.mkdirSync(path.dirname(webPath), { recursive: true });
    fs.writeFileSync(webPath, JSON.stringify(out, null, 2));
    console.log("Mirrored to:", webPath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
