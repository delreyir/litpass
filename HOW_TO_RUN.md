# How to run LitPass

## 1. Deploy contracts to LitVM Testnet

```bash
cd contracts
cp .env.example .env       # then edit .env and add your PRIVATE_KEY (0x-prefixed)
npm install
npx hardhat compile
npx hardhat test           # 11 tests, all should pass
npx hardhat run scripts/deploy.ts --network litvmTestnet
```

The deploy script:
- Deploys all 4 contracts (`LitPass`, `AchievementBadges`, `StampRegistry`, `ReferralTracker`)
- Writes addresses to `contracts/deployments/litvmTestnet.json`
- Auto-mirrors them to `web/lib/deployment.json` so the frontend picks them up

Make sure your deployer wallet has some testnet zkLTC from https://testnet.litvm.com.
Deployment cost is small (4 transactions).

## 2. Run the frontend

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000

## What you get

- `/` — Animated landing page with passport preview, hero, features, CTA
- `/passport` — Mint your passport + daily check-in with streak ring + confetti
- `/badges` — All achievement badges, claim when eligible
- `/leaderboard` — Stats + placeholder for indexer-based leaderboard

## Verify a contract on the explorer

```bash
cd contracts
npx hardhat verify --network litvmTestnet <ADDRESS> <CONSTRUCTOR_ARGS...>
```

For LitPass: `npx hardhat verify --network litvmTestnet 0x... <deployer> 3600`

## Common issues

- **"insufficient funds"** — top up the deployer wallet from the testnet faucet.
- **"nonce too low"** — wait for prior tx confirmation or reset the account.
- **MetaMask warning about @react-native-async-storage** — harmless on web, ignore.

## Day length

On testnet the deploy script uses a 1-hour "day" (3600s) so you can build and
test multi-day streaks fast. On mainnet pass `86400` to `LitPass` constructor.
The owner can call `setDayLength(seconds)` at any time.
