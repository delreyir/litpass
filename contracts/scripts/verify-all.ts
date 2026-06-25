import { run } from "hardhat";
import fs from "fs";
import path from "path";

async function tryVerify(address: string, args: unknown[], name: string) {
  process.stdout.write(`Verifying ${name} (${address})... `);
  try {
    await run("verify:verify", {
      address,
      constructorArguments: args,
      force: true,
    });
    console.log("OK");
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("Already Verified") || msg.includes("already verified")) {
      console.log("already verified");
    } else {
      console.log("FAILED");
      console.log("  ", msg.split("\n")[0]);
    }
  }
}

async function main() {
  const file = path.resolve(__dirname, "../deployments/litvmTestnet.json");
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  const deployer = d.deployer;
  const signer = process.env.ATTESTATION_SIGNER_ADDRESS;
  const dayLength = d.dayLength ?? 86400;

  if (!signer) throw new Error("ATTESTATION_SIGNER_ADDRESS not set in .env");

  await tryVerify(d.contracts.LitPass,           [deployer, dayLength],                  "LitPass");
  await tryVerify(d.contracts.AchievementBadges, [deployer, d.contracts.LitPass],        "AchievementBadges");
  await tryVerify(d.contracts.StampRegistry,     [deployer, d.contracts.LitPass],        "StampRegistry");
  await tryVerify(d.contracts.ReferralTracker,   [d.contracts.LitPass],                  "ReferralTracker");
  await tryVerify(d.contracts.ActivityBadges,    [deployer, d.contracts.LitPass, signer],"ActivityBadges");
  await tryVerify(d.contracts.Usernames,         [],                                     "Usernames");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
