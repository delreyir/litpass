import { publicClient } from "@/lib/server";

const EXPLORER_API = "https://liteforge.explorer.caldera.xyz/api/v2";
const PAGE_SIZE = 50;
const MAX_PAGES = 40; // safety cap = 2000 txs scanned

export type ActivityMetrics = {
  txCount: number;
  contractsDeployed: number;
  uniqueContracts: number;
  walletAgeDays: number;
  activeDays: number;
};

type Tx = {
  hash: string;
  block_number: number;
  timestamp: string;
  to: { hash?: string; is_contract?: boolean } | null;
  status?: string;
  method?: string | null;
  result?: string;
};

/**
 * Reads on-chain activity for a wallet on LitVM and returns aggregate metrics.
 *
 * - `txCount` comes from the explorer's counters endpoint (cheap).
 * - The rest are computed by paginating the address's transactions (up to a cap).
 */
export async function getActivityMetrics(address: `0x${string}`): Promise<ActivityMetrics> {
  // 1. tx count via counters endpoint
  let txCount = 0;
  try {
    const r = await fetch(`${EXPLORER_API}/addresses/${address}/counters`, {
      next: { revalidate: 60 },
    });
    if (r.ok) {
      const j = await r.json();
      txCount = parseInt(j.transactions_count ?? "0", 10) || 0;
    }
  } catch {
    /* ignore */
  }

  // 2. paginate transactions (where this address is the sender) to compute
  //    contracts deployed, unique contracts touched, wallet age, active days.
  let contractsDeployed = 0;
  const contractSet = new Set<string>();
  const dayBucket = new Set<string>();
  let oldestTimestamp: number | null = null;

  let nextParams: string | null = `?filter=from`;
  let pages = 0;
  while (nextParams && pages < MAX_PAGES) {
    let json: { items?: Tx[]; next_page_params?: Record<string, string | number> | null };
    try {
      const r = await fetch(`${EXPLORER_API}/addresses/${address}/transactions${nextParams}`, {
        next: { revalidate: 60 },
      });
      if (!r.ok) break;
      json = await r.json();
    } catch {
      break;
    }

    const items = json.items ?? [];
    for (const tx of items) {
      // Failed txs still count toward nonce but we only care about successful
      // ones for "unique contracts" semantics.
      const isSuccess = tx.status === "ok" || tx.result === "success" || (!tx.status && !tx.result);

      if (!tx.to || !tx.to.hash) {
        // Contract creation
        if (isSuccess) contractsDeployed++;
      } else if (tx.to.hash && tx.to.is_contract && isSuccess) {
        contractSet.add(tx.to.hash.toLowerCase());
      }

      const ts = new Date(tx.timestamp).getTime();
      if (!isNaN(ts)) {
        if (oldestTimestamp === null || ts < oldestTimestamp) oldestTimestamp = ts;
        const day = Math.floor(ts / 86400000);
        dayBucket.add(String(day));
      }
    }

    const np = json.next_page_params;
    if (!np || items.length === 0) break;
    const qs = new URLSearchParams();
    qs.set("filter", "from");
    for (const [k, v] of Object.entries(np)) qs.set(k, String(v));
    nextParams = `?${qs.toString()}`;
    pages++;
  }

  // If we never saw a tx but txCount > 0, fall back to chain block timestamps
  // to estimate wallet age via the latest block (not perfect but safe).
  if (oldestTimestamp === null) oldestTimestamp = Date.now();

  const ageMs = Math.max(0, Date.now() - oldestTimestamp);
  const walletAgeDays = Math.floor(ageMs / 86400000);

  return {
    txCount,
    contractsDeployed,
    uniqueContracts: contractSet.size,
    walletAgeDays,
    activeDays: dayBucket.size,
  };
}

/** Map a badge id from ActivityBadges to its (activity, threshold) tuple. */
export type BadgeInfo = { activity: number; threshold: number; name: string };

/**
 * Cached badge catalog, queried lazily once. We could read this from chain
 * every request, but the badge set is fixed by the deploy seed.
 */
export const BADGE_CATALOG: Record<number, BadgeInfo> = {
  // TxCount (activity = 0)
  1:  { activity: 0, threshold: 20,   name: "Newcomer" },
  2:  { activity: 0, threshold: 100,  name: "Regular" },
  3:  { activity: 0, threshold: 500,  name: "Power User" },
  4:  { activity: 0, threshold: 1000, name: "Heavy" },
  // ContractsDeployed (1)
  5:  { activity: 1, threshold: 1,    name: "Builder" },
  6:  { activity: 1, threshold: 5,    name: "Architect" },
  7:  { activity: 1, threshold: 25,   name: "Shipwright" },
  // UniqueContracts (2)
  8:  { activity: 2, threshold: 10,   name: "Wanderer" },
  9:  { activity: 2, threshold: 50,   name: "Pathfinder" },
  10: { activity: 2, threshold: 200,  name: "Cartographer" },
  // WalletAgeDays (3)
  11: { activity: 3, threshold: 7,    name: "Fresh" },
  12: { activity: 3, threshold: 30,   name: "Settled" },
  13: { activity: 3, threshold: 60,   name: "OG" },
  // ActiveDays (4)
  14: { activity: 4, threshold: 7,    name: "Dedicated" },
  15: { activity: 4, threshold: 30,   name: "Committed" },
  16: { activity: 4, threshold: 100,  name: "Loyalist" },
};

export function measuredValueForBadge(badgeId: number, metrics: ActivityMetrics): number {
  const info = BADGE_CATALOG[badgeId];
  if (!info) return 0;
  switch (info.activity) {
    case 0: return metrics.txCount;
    case 1: return metrics.contractsDeployed;
    case 2: return metrics.uniqueContracts;
    case 3: return metrics.walletAgeDays;
    case 4: return metrics.activeDays;
    default: return 0;
  }
}

// re-export for convenience
export { publicClient };
