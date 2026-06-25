import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ActivityBadges (EIP-712 attestations)", () => {
  async function deploy() {
    const [owner, alice, bob, signer] = await ethers.getSigners();

    const LitPass = await ethers.getContractFactory("LitPass");
    const pass = await LitPass.deploy(owner.address, 3600);
    await pass.waitForDeployment();
    const passAddr = await pass.getAddress();

    const Activity = await ethers.getContractFactory("ActivityBadges");
    const activity = await Activity.deploy(owner.address, passAddr, signer.address);
    await activity.waitForDeployment();

    return { owner, alice, bob, signer, pass, activity };
  }

  async function signClaim(
    contract: { getAddress: () => Promise<string> },
    signer: any,
    user: string,
    badgeId: number,
    measuredValue: number,
    nonce: number,
    expiresAt: number
  ) {
    const domain = {
      name: "LitPass.ActivityBadges",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await contract.getAddress(),
    };
    const types = {
      Claim: [
        { name: "user", type: "address" },
        { name: "badgeId", type: "uint256" },
        { name: "measuredValue", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "expiresAt", type: "uint256" },
      ],
    };
    const value = { user, badgeId, measuredValue, nonce, expiresAt };
    return signer.signTypedData(domain, types, value);
  }

  it("seeds 16 default badges across 5 activity families", async () => {
    const { activity } = await deploy();
    expect(await activity.badgeCount()).to.eq(16);

    // Spot check a few
    const b1 = await activity.badges(1);
    expect(b1.name).to.eq("Newcomer");
    expect(b1.threshold).to.eq(20);

    const b5 = await activity.badges(5);
    expect(b5.name).to.eq("Builder");

    const b14 = await activity.badges(14);
    expect(b14.name).to.eq("Dedicated");
  });

  it("claims a badge with a valid signature when threshold is met", async () => {
    const { activity, signer, alice, pass } = await deploy();
    await pass.connect(alice).mint();

    const now = await time.latest();
    const expiresAt = now + 3600;
    const measuredValue = 25; // > threshold of 20

    const sig = await signClaim(activity, signer, alice.address, 1, measuredValue, 1, expiresAt);

    await expect(activity.connect(alice).claim(1, measuredValue, 1, expiresAt, sig))
      .to.emit(activity, "BadgeClaimed").withArgs(alice.address, 1, measuredValue);

    expect(await activity.balanceOf(alice.address, 1)).to.eq(1);
  });

  it("requires a LitPass to claim", async () => {
    const { activity, signer, alice } = await deploy();
    const now = await time.latest();
    const sig = await signClaim(activity, signer, alice.address, 1, 25, 1, now + 3600);
    await expect(activity.connect(alice).claim(1, 25, 1, now + 3600, sig))
      .to.be.revertedWithCustomError(activity, "NoPassport");
  });

  it("rejects insufficient measuredValue", async () => {
    const { activity, signer, alice, pass } = await deploy();
    await pass.connect(alice).mint();
    const now = await time.latest();
    const sig = await signClaim(activity, signer, alice.address, 1, 10, 1, now + 3600);
    await expect(activity.connect(alice).claim(1, 10, 1, now + 3600, sig))
      .to.be.revertedWithCustomError(activity, "InsufficientValue");
  });

  it("rejects an expired claim", async () => {
    const { activity, signer, alice, pass } = await deploy();
    await pass.connect(alice).mint();
    const now = await time.latest();
    const expiresAt = now + 100;
    const sig = await signClaim(activity, signer, alice.address, 1, 25, 1, expiresAt);
    await time.increase(200);
    await expect(activity.connect(alice).claim(1, 25, 1, expiresAt, sig))
      .to.be.revertedWithCustomError(activity, "ClaimExpired");
  });

  it("rejects a forged signature (wrong signer)", async () => {
    const { activity, alice, bob, pass } = await deploy();
    await pass.connect(alice).mint();
    const now = await time.latest();
    // bob signs instead of the trusted signer
    const sig = await signClaim(activity, bob, alice.address, 1, 25, 1, now + 3600);
    await expect(activity.connect(alice).claim(1, 25, 1, now + 3600, sig))
      .to.be.revertedWithCustomError(activity, "BadSignature");
  });

  it("rejects a tampered claim (different user)", async () => {
    const { activity, signer, alice, bob, pass } = await deploy();
    await pass.connect(alice).mint();
    await pass.connect(bob).mint();
    const now = await time.latest();
    // signature is for alice
    const sig = await signClaim(activity, signer, alice.address, 1, 25, 1, now + 3600);
    // bob tries to use it
    await expect(activity.connect(bob).claim(1, 25, 1, now + 3600, sig))
      .to.be.revertedWithCustomError(activity, "BadSignature");
  });

  it("prevents double-claim and nonce reuse", async () => {
    const { activity, signer, alice, pass } = await deploy();
    await pass.connect(alice).mint();
    const now = await time.latest();
    const sig = await signClaim(activity, signer, alice.address, 1, 25, 1, now + 3600);
    await activity.connect(alice).claim(1, 25, 1, now + 3600, sig);
    await expect(activity.connect(alice).claim(1, 25, 1, now + 3600, sig))
      .to.be.revertedWithCustomError(activity, "AlreadyClaimed");
  });

  it("badges are soulbound", async () => {
    const { activity, signer, alice, bob, pass } = await deploy();
    await pass.connect(alice).mint();
    const now = await time.latest();
    const sig = await signClaim(activity, signer, alice.address, 1, 25, 1, now + 3600);
    await activity.connect(alice).claim(1, 25, 1, now + 3600, sig);
    await expect(
      activity.connect(alice).safeTransferFrom(alice.address, bob.address, 1, 1, "0x")
    ).to.be.revertedWithCustomError(activity, "SoulboundNonTransferable");
  });

  it("owner can rotate signer", async () => {
    const { activity, owner, alice, bob, pass } = await deploy();
    await pass.connect(alice).mint();

    await activity.connect(owner).setSigner(bob.address);
    expect(await activity.signer()).to.eq(bob.address);

    const now = await time.latest();
    // bob signs as the new signer
    const sig = await signClaim(activity, bob, alice.address, 1, 25, 1, now + 3600);
    await activity.connect(alice).claim(1, 25, 1, now + 3600, sig);
    expect(await activity.balanceOf(alice.address, 1)).to.eq(1);
  });
});
