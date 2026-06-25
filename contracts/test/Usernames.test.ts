import { expect } from "chai";
import { ethers } from "hardhat";

describe("Usernames", () => {
  async function deploy() {
    const [owner, alice, bob] = await ethers.getSigners();
    const U = await ethers.getContractFactory("Usernames");
    const u = await U.deploy();
    await u.waitForDeployment();
    return { u, owner, alice, bob };
  }

  it("claims and resolves a username", async () => {
    const { u, alice } = await deploy();
    await expect(u.connect(alice).setUsername("Alice_01"))
      .to.emit(u, "NameSet").withArgs(alice.address, "alice_01");
    expect(await u.usernameOf(alice.address)).to.eq("alice_01");
    expect(await u.ownerOf("ALICE_01")).to.eq(alice.address);
  });

  it("rejects duplicates (case-insensitive)", async () => {
    const { u, alice, bob } = await deploy();
    await u.connect(alice).setUsername("nicekid");
    await expect(u.connect(bob).setUsername("NICEKID"))
      .to.be.revertedWithCustomError(u, "AlreadyTaken");
  });

  it("rejects invalid lengths and chars", async () => {
    const { u, alice } = await deploy();
    await expect(u.connect(alice).setUsername("ab"))
      .to.be.revertedWithCustomError(u, "InvalidLength");
    await expect(u.connect(alice).setUsername("a".repeat(21)))
      .to.be.revertedWithCustomError(u, "InvalidLength");
    await expect(u.connect(alice).setUsername("has space"))
      .to.be.revertedWithCustomError(u, "InvalidChar");
    await expect(u.connect(alice).setUsername("emoji😀a"))
      .to.be.revertedWithCustomError(u, "InvalidChar");
  });

  it("a wallet cannot hold two names; clear then re-claim works", async () => {
    const { u, alice } = await deploy();
    await u.connect(alice).setUsername("first");
    await expect(u.connect(alice).setUsername("second"))
      .to.be.revertedWithCustomError(u, "AlreadyHasName");
    await u.connect(alice).clear();
    await u.connect(alice).setUsername("second");
    expect(await u.usernameOf(alice.address)).to.eq("second");
  });

  it("isAvailable returns false for taken, true otherwise, false for invalid", async () => {
    const { u, alice } = await deploy();
    await u.connect(alice).setUsername("taken");
    expect(await u.isAvailable("taken")).to.eq(false);
    expect(await u.isAvailable("TAKEN")).to.eq(false);
    expect(await u.isAvailable("freename")).to.eq(true);
    expect(await u.isAvailable("ab")).to.eq(false); // too short
    expect(await u.isAvailable("has space")).to.eq(false); // invalid char
  });
});
