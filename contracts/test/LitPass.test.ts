import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const HOUR = 3600;

describe("LitPass + Badges + Stamps + Referrals", () => {
  async function deploy() {
    const [owner, alice, bob, carol, issuer] = await ethers.getSigners();
    const dayLength = HOUR; // 1h day for testing

    const LitPass = await ethers.getContractFactory("LitPass");
    const pass = await LitPass.deploy(owner.address, dayLength);
    await pass.waitForDeployment();

    const Badges = await ethers.getContractFactory("AchievementBadges");
    const badges = await Badges.deploy(owner.address, await pass.getAddress());
    await badges.waitForDeployment();

    const Stamps = await ethers.getContractFactory("StampRegistry");
    const stamps = await Stamps.deploy(owner.address, await pass.getAddress());
    await stamps.waitForDeployment();

    const Refs = await ethers.getContractFactory("ReferralTracker");
    const refs = await Refs.deploy(await pass.getAddress());
    await refs.waitForDeployment();

    return { owner, alice, bob, carol, issuer, pass, badges, stamps, refs, dayLength };
  }

  describe("LitPass core", () => {
    it("mints exactly one soulbound pass per wallet", async () => {
      const { pass, alice } = await deploy();
      await expect(pass.connect(alice).mint())
        .to.emit(pass, "PassportMinted").withArgs(alice.address, 1n, anyVal);
      expect(await pass.passOf(alice.address)).to.eq(1n);
      expect(await pass.totalSupply()).to.eq(1n);
      await expect(pass.connect(alice).mint()).to.be.revertedWithCustomError(pass, "AlreadyMinted");
    });

    it("blocks transfers and approvals", async () => {
      const { pass, alice, bob } = await deploy();
      await pass.connect(alice).mint();
      await expect(pass.connect(alice).transferFrom(alice.address, bob.address, 1n))
        .to.be.revertedWithCustomError(pass, "SoulboundNonTransferable");
      await expect(pass.connect(alice).approve(bob.address, 1n))
        .to.be.revertedWithCustomError(pass, "SoulboundNonTransferable");
      await expect(pass.connect(alice).setApprovalForAll(bob.address, true))
        .to.be.revertedWithCustomError(pass, "SoulboundNonTransferable");
    });

    it("tracks streak: 1 → 2 → reset → 1", async () => {
      const { pass, alice, dayLength } = await deploy();
      await pass.connect(alice).mint();

      await pass.connect(alice).checkIn();
      expect((await pass.getPass(alice.address)).currentStreak).to.eq(1);

      // double check-in same day window: blocked
      await expect(pass.connect(alice).checkIn())
        .to.be.revertedWithCustomError(pass, "AlreadyCheckedInToday");

      // wait exactly 1 day → streak = 2
      await time.increase(dayLength);
      await pass.connect(alice).checkIn();
      expect((await pass.getPass(alice.address)).currentStreak).to.eq(2);

      // wait more than 2 days → streak resets to 1
      await time.increase(dayLength * 3);
      await pass.connect(alice).checkIn();
      const p = await pass.getPass(alice.address);
      expect(p.currentStreak).to.eq(1);
      expect(p.longestStreak).to.eq(2);
      expect(p.totalCheckIns).to.eq(3);
    });

    it("canCheckIn reflects state", async () => {
      const { pass, alice, dayLength } = await deploy();
      expect(await pass.canCheckIn(alice.address)).to.eq(false);
      await pass.connect(alice).mint();
      expect(await pass.canCheckIn(alice.address)).to.eq(true);
      await pass.connect(alice).checkIn();
      expect(await pass.canCheckIn(alice.address)).to.eq(false);
      await time.increase(dayLength);
      expect(await pass.canCheckIn(alice.address)).to.eq(true);
    });

    it("returns valid base64 tokenURI", async () => {
      const { pass, alice } = await deploy();
      await pass.connect(alice).mint();
      const uri = await pass.tokenURI(1n);
      expect(uri.startsWith("data:application/json;base64,")).to.eq(true);
    });
  });

  describe("AchievementBadges", () => {
    it("seeds default badges and claims when eligible", async () => {
      const { pass, badges, alice, dayLength } = await deploy();
      await pass.connect(alice).mint();

      // not eligible yet
      await expect(badges.connect(alice).claim(1n))
        .to.be.revertedWithCustomError(badges, "NotEligible");

      // build a 3-day streak: check-ins at day 0, 1, 2
      await pass.connect(alice).checkIn();
      await time.increase(dayLength);
      await pass.connect(alice).checkIn();
      await time.increase(dayLength);
      await pass.connect(alice).checkIn();

      expect((await pass.getPass(alice.address)).currentStreak).to.eq(3);
      expect(await badges.isEligible(alice.address, 1n)).to.eq(true);
      await expect(badges.connect(alice).claim(1n))
        .to.emit(badges, "BadgeClaimed").withArgs(alice.address, 1n);
      expect(await badges.balanceOf(alice.address, 1n)).to.eq(1n);

      // can't double-claim
      await expect(badges.connect(alice).claim(1n))
        .to.be.revertedWithCustomError(badges, "AlreadyClaimed");
    });

    it("badges are soulbound", async () => {
      const { pass, badges, alice, bob, dayLength } = await deploy();
      await pass.connect(alice).mint();
      await pass.connect(alice).checkIn();
      await time.increase(dayLength);
      await pass.connect(alice).checkIn();
      await time.increase(dayLength);
      await pass.connect(alice).checkIn();
      await badges.connect(alice).claim(1n);
      await expect(
        badges.connect(alice).safeTransferFrom(alice.address, bob.address, 1n, 1n, "0x")
      ).to.be.revertedWithCustomError(badges, "SoulboundNonTransferable");
    });
  });

  describe("StampRegistry", () => {
    it("only owner adds issuers; only issuers define and grant", async () => {
      const { stamps, owner, alice, issuer } = await deploy();
      await expect(
        stamps.connect(alice).addIssuer(issuer.address, "Demo")
      ).to.be.revertedWithCustomError(stamps, "OwnableUnauthorizedAccount");
      await stamps.connect(owner).addIssuer(issuer.address, "Demo");
      expect(await stamps.isIssuer(issuer.address)).to.eq(true);

      const stampId = await stamps.stampIdOf(issuer.address, "first-tx");
      await expect(
        stamps.connect(alice).defineStamp("first-tx", "First TX", "first tx", "")
      ).to.be.revertedWithCustomError(stamps, "NotIssuer");
      await stamps.connect(issuer).defineStamp("first-tx", "First TX", "first tx", "");
      const meta = await stamps.stamps(stampId);
      expect(meta.exists).to.eq(true);
    });

    it("requires recipient to hold a pass", async () => {
      const { pass, stamps, owner, alice, issuer } = await deploy();
      await stamps.connect(owner).addIssuer(issuer.address, "Demo");
      await stamps.connect(issuer).defineStamp("k", "n", "d", "");
      const id = await stamps.stampIdOf(issuer.address, "k");
      await expect(stamps.connect(issuer).issue(id, alice.address))
        .to.be.revertedWithCustomError(stamps, "PassRequired");

      await pass.connect(alice).mint();
      await stamps.connect(issuer).issue(id, alice.address);
      expect(await stamps.holds(id, alice.address)).to.eq(true);

      // no double-issue
      await expect(stamps.connect(issuer).issue(id, alice.address))
        .to.be.revertedWithCustomError(stamps, "AlreadyHolder");
    });

    it("revoke clears holder flag", async () => {
      const { pass, stamps, owner, alice, issuer } = await deploy();
      await stamps.connect(owner).addIssuer(issuer.address, "Demo");
      await stamps.connect(issuer).defineStamp("k", "n", "d", "");
      const id = await stamps.stampIdOf(issuer.address, "k");
      await pass.connect(alice).mint();
      await stamps.connect(issuer).issue(id, alice.address);
      await stamps.connect(issuer).revoke(id, alice.address);
      expect(await stamps.holds(id, alice.address)).to.eq(false);
    });
  });

  describe("ReferralTracker", () => {
    it("binds once, both must hold pass, no self", async () => {
      const { pass, refs, alice, bob } = await deploy();
      await expect(refs.connect(alice).bindReferrer(bob.address))
        .to.be.revertedWithCustomError(refs, "PassRequired");
      await pass.connect(alice).mint();
      await expect(refs.connect(alice).bindReferrer(bob.address))
        .to.be.revertedWithCustomError(refs, "ReferrerNeedsPass");
      await pass.connect(bob).mint();
      await expect(refs.connect(alice).bindReferrer(alice.address))
        .to.be.revertedWithCustomError(refs, "SelfReferral");
      await refs.connect(alice).bindReferrer(bob.address);
      expect(await refs.referrerOf(alice.address)).to.eq(bob.address);
      expect(await refs.referralsOf(bob.address)).to.eq(1);
      await expect(refs.connect(alice).bindReferrer(bob.address))
        .to.be.revertedWithCustomError(refs, "AlreadyBound");
    });
  });
});

const anyVal = (v: any) => true;
