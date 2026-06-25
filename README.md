# LitPass

The first soulbound passport, daily streak protocol, and cross-dApp stamp registry on LitVM.

Think gm.xyz + Gitcoin Passport + zkSync Passport — but native to Litecoin's first EVM Layer-2.

## What is LitPass?

LitPass is the identity & reputation layer for LitVM. Users mint a non-transferable passport NFT, check in daily to build streaks, earn achievement badges, and collect stamps from other LitVM dApps. Over time, every wallet's LitPass becomes a verifiable on-chain reputation that any application can read.

## Why it matters

- **For users** — A visible, gamified identity on LitVM. Daily check-ins, streaks, badges, leaderboards.
- **For builders** — A neutral on-chain reputation primitive. Grant stamps to your users, read other dApps' stamps, build trust.
- **For the ecosystem** — Native identity infrastructure that's missing from LitVM today.

## Architecture

```
contracts/         Hardhat project (Solidity)
  LitPass.sol           Soulbound passport NFT + daily check-in + streak
  StampRegistry.sol     Open stamp registry — any dApp can issue
  AchievementBadges.sol ERC-1155 milestone badges
  ReferralTracker.sol   On-chain referrals

web/               Next.js 15 frontend
  Pro animated UI with Framer Motion, Tailwind, wagmi/viem
```

## Network

- **LitVM LiteForge Testnet**
- Chain ID: `4441`
- RPC: `https://liteforge.rpc.caldera.xyz/http`
- Explorer: `https://liteforge.explorer.caldera.xyz`

## Quick start

```bash
# Contracts
cd contracts
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network litvmTestnet

# Frontend
cd web
npm install
npm run dev
```
