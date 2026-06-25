import { NextResponse } from "next/server";
import { parseAbiItem } from "viem";
import { publicClient } from "@/lib/server";
import { ADDR, litPassAbi, DEPLOYMENT_BLOCK } from "@/lib/contracts";

// Recompute every 30 seconds.
export const revalidate = 30;
export const dynamic = "force-dynamic";

const STREAK_BADGE_CLAIMED = parseAbiItem(
  "event BadgeClaimed(address indexed user, uint256 indexed id)"
);
const ACTIVITY_BADGE_CLAIMED = parseAbiItem(
  "event BadgeClaimed(address indexed user, uint256 indexed id, uint256 measuredValue)"
);
const REFERRED = parseAbiItem(
  "event Referred(address indexed referrer, address indexed user, uint64 timestamp)"
);

type Entry = {
  address: `0x${string}`;
  tokenId: string;
  currentStreak: number;
  totalCheckIns: number;
  lastCheckIn: number;
  badges: number;
  referrals: number;
};

export async function GET() {
  try {
    const [checkInLogs, streakClaims, activityClaims, refLogs] = await Promise.all([
      publicClient.getContractEvents({
        address: ADDR.LitPass,
        abi: litPassAbi,
        eventName: "CheckedIn",
        fromBlock: DEPLOYMENT_BLOCK,
        toBlock: "latest",
      }),
      publicClient.getLogs({
        address: ADDR.AchievementBadges,
        event: STREAK_BADGE_CLAIMED,
        fromBlock: DEPLOYMENT_BLOCK,
        toBlock: "latest",
      }),
      publicClient.getLogs({
        address: ADDR.ActivityBadges,
        event: ACTIVITY_BADGE_CLAIMED,
        fromBlock: DEPLOYMENT_BLOCK,
        toBlock: "latest",
      }),
      publicClient.getLogs({
        address: ADDR.ReferralTracker,
        event: REFERRED,
        fromBlock: DEPLOYMENT_BLOCK,
        toBlock: "latest",
      }),
    ]);

    // Per-wallet aggregate state from the latest CheckedIn event
    const map = new Map<string, Entry>();
    for (const log of checkInLogs) {
      const args = log.args as {
        owner?: `0x${string}`;
        tokenId?: bigint;
        newStreak?: number;
        totalCheckIns?: number;
        timestamp?: bigint;
      };
      if (!args.owner) continue;
      const ts = Number(args.timestamp ?? 0);
      const prev = map.get(args.owner);
      if (!prev || ts > prev.lastCheckIn) {
        map.set(args.owner, {
          address: args.owner,
          tokenId: String(args.tokenId ?? 0n),
          currentStreak: Number(args.newStreak ?? 0),
          totalCheckIns: Number(args.totalCheckIns ?? 0),
          lastCheckIn: ts,
          badges: prev?.badges ?? 0,
          referrals: prev?.referrals ?? 0,
        });
      }
    }

    // Helper to ensure an entry exists even if a wallet has badges/referrals
    // but never checked in.
    const ensure = (addr: `0x${string}`) => {
      let e = map.get(addr);
      if (!e) {
        e = {
          address: addr,
          tokenId: "0",
          currentStreak: 0,
          totalCheckIns: 0,
          lastCheckIn: 0,
          badges: 0,
          referrals: 0,
        };
        map.set(addr, e);
      }
      return e;
    };

    // Badges across both contracts
    for (const log of streakClaims) {
      const user = log.args.user as `0x${string}` | undefined;
      if (!user) continue;
      ensure(user).badges += 1;
    }
    for (const log of activityClaims) {
      const user = log.args.user as `0x${string}` | undefined;
      if (!user) continue;
      ensure(user).badges += 1;
    }

    // Referrals
    for (const log of refLogs) {
      const referrer = log.args.referrer as `0x${string}` | undefined;
      if (!referrer) continue;
      ensure(referrer).referrals += 1;
    }

    // Final sort: by total check-ins, then current streak, then badges, then referrals.
    const entries = Array.from(map.values()).sort((a, b) => {
      if (b.totalCheckIns !== a.totalCheckIns) return b.totalCheckIns - a.totalCheckIns;
      if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
      if (b.badges !== a.badges) return b.badges - a.badges;
      if (b.referrals !== a.referrals) return b.referrals - a.referrals;
      return b.lastCheckIn - a.lastCheckIn;
    });

    return NextResponse.json(
      {
        total: entries.length,
        entries: entries.slice(0, 100),
        updatedAt: Math.floor(Date.now() / 1000),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, entries: [], total: 0 },
      { status: 500 }
    );
  }
}
