"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Flame, Award, Trophy, ExternalLink } from "lucide-react";
import { shortAddress, formatRelative } from "@/lib/utils";

type Entry = {
  address: `0x${string}`;
  tokenId: string;
  currentStreak: number;
  totalCheckIns: number;
  lastCheckIn: number;
};

export function LeaderboardClient() {
  const [data, setData] = useState<{ entries: Entry[]; total: number; loading: boolean; error?: string }>({
    entries: [],
    total: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        setData({ entries: json.entries ?? [], total: json.total ?? 0, loading: false, error: json.error });
      } catch (err) {
        if (cancelled) return;
        setData({ entries: [], total: 0, loading: false, error: (err as Error).message });
      }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <>
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat icon={<Trophy className="h-5 w-5" />} label="Active users" value={data.total.toString()} />
        <Stat icon={<Flame className="h-5 w-5" />} label="Day length" value="1 hour" />
        <Stat icon={<Award className="h-5 w-5" />} label="Top streak" value={data.entries[0]?.currentStreak?.toString() ?? "-"} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass mt-10 overflow-hidden rounded-2xl"
      >
        <div className="grid grid-cols-12 gap-4 border-b border-white/5 bg-white/[0.025] px-6 py-4 text-xs font-mono uppercase tracking-widest text-silver-400">
          <div className="col-span-1">#</div>
          <div className="col-span-6">Wallet</div>
          <div className="col-span-2 text-right">Streak</div>
          <div className="col-span-3 text-right">Check-ins</div>
        </div>

        {data.loading ? (
          <div className="px-6 py-16 text-center text-silver-400">Loading…</div>
        ) : data.entries.length === 0 ? (
          <div className="px-6 py-16 text-center text-silver-400">
            <p className="text-silver-200">No check-ins yet.</p>
            <p className="mt-2 text-sm">
              Be the first.{" "}
              <Link href="/passport" className="text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent">
                Mint your passport
              </Link>{" "}
              and check in.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {data.entries.map((e, i) => (
              <motion.li
                key={e.address}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.5) }}
                className="grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.025]"
              >
                <div className="col-span-1 flex items-center gap-2">
                  <RankBadge rank={i + 1} />
                </div>
                <div className="col-span-6">
                  <Link
                    href={`/p/${e.address}`}
                    className="group inline-flex items-center gap-2 font-mono text-sm text-silver-100 hover:text-accent"
                  >
                    {shortAddress(e.address)}
                    <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                  <div className="mt-0.5 text-[11px] text-silver-500">
                    last seen {formatRelative(e.lastCheckIn)}
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <span className="font-display text-base font-bold text-white">{e.currentStreak}</span>
                  <span className="ml-1 text-xs text-silver-400">d</span>
                </div>
                <div className="col-span-3 text-right font-display text-base font-bold text-white">
                  {e.totalCheckIns}
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>
    </>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-gold to-accent-rose font-display text-xs font-bold text-ink-950">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-silver-200 to-silver-400 font-display text-xs font-bold text-ink-950">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-rose to-accent-violet font-display text-xs font-bold text-ink-950">
        3
      </span>
    );
  }
  return <span className="font-mono text-sm text-silver-400">{rank}</span>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent ring-1 ring-accent/20">
          {icon}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-silver-400">{label}</div>
          <div className="font-display text-2xl font-bold text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}
