import { NextResponse } from "next/server";
import { publicClient } from "@/lib/server";
import { ADDR, litPassAbi } from "@/lib/contracts";

// Recompute every 30 seconds. New check-ins surface quickly without hammering
// the RPC.
export const revalidate = 30;
export const dynamic = "force-dynamic";

type Entry = {
  address: `0x${string}`;
  tokenId: string;
  currentStreak: number;
  totalCheckIns: number;
  lastCheckIn: number;
};

export async function GET() {
  try {
    // Pull every CheckedIn event ever emitted by the LitPass contract.
    // For testnet volume this is fine; once data grows, swap to a subgraph.
    const logs = await publicClient.getContractEvents({
      address: ADDR.LitPass,
      abi: litPassAbi,
      eventName: "CheckedIn",
      fromBlock: 0n,
      toBlock: "latest",
    });

    // For each owner, keep the latest event (highest timestamp). Its
    // newStreak and totalCheckIns reflect the current on-chain state.
    const map = new Map<string, Entry>();
    for (const log of logs) {
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
        });
      }
    }

    const entries = Array.from(map.values()).sort((a, b) => {
      if (b.totalCheckIns !== a.totalCheckIns) return b.totalCheckIns - a.totalCheckIns;
      if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
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
          // Edge-cache for 30s so we don't re-query RPC on every hit.
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
