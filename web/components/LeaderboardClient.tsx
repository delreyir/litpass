"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Flame, Award, Trophy, ExternalLink, Calendar, Users } from "lucide-react";
import { shortAddress, formatRelative } from "@/lib/utils";

type Entry = {
  address: `0x${string}`;
  tokenId: string;
  currentStreak: number;
  totalCheckIns: number;
  lastCheckIn: number;
  badges: number;
  referrals: number;
};

export function LeaderboardClient() {
  const [data, setData] = useState<{
    entries: Entry[];
    total: number;
    loading: boolean;
    error?: string;
  }>({ entries: [], total: 0, loading: true });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        setData({
          entries: json.entries ?? [],
          total: json.total ?? 0,
          loading: false,
          error: json.error,
        });
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

  const topBadges = Math.max(0, ...data.entries.map((e) => e.badges));
  const totalRefs = data.entries.reduce((a, e) => a + e.referrals, 0);

  return (
    <>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Trophy className="h-4 w-4" />} label="Active users" value={data.total.toString()} color="text-accent" />
        <Stat icon={<Flame className="h-4 w-4" />} label="Top streak" value={(data.entries[0]?.currentStreak ?? 0).toString() + "d"} color="text-accent-rose" />
        <Stat icon={<Award className="h-4 w-4" />} label="Most badges" value={topBadges.toString()} color="text-accent-gold" />
        <Stat icon={<Users className="h-4 w-4" />} label="Total refs" value={totalRefs.toString()} color="text-accent-violet" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass mt-8 overflow-hidden rounded-2xl"
      >
        {/* Desktop header */}
        <div className="hidden grid-cols-12 gap-3 border-b border-white/5 bg-white/[0.025] px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-silver-400 md:grid">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Wallet</div>
          <div className="col-span-2 text-right">Streak</div>
          <div className="col-span-2 text-right">Check-ins</div>
          <div className="col-span-2 text-right">Badges</div>
          <div className="col-span-1 text-right">Refs</div>
        </div>

        {data.loading ? (
          <div className="px-6 py-16 text-center text-silver-400">Loading...</div>
        ) : data.entries.length === 0 ? (
          <div className="px-6 py-16 text-center text-silver-400">
            <p className="text-silver-200">No active wallets yet.</p>
            <p className="mt-2 text-sm">
              Be the first.{" "}
              <Link
                href="/passport"
                className="text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent"
              >
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
                className="transition-colors hover:bg-white/[0.025]"
              >
                {/* Desktop row */}
                <div className="hidden grid-cols-12 items-center gap-3 px-5 py-3 md:grid">
                  <div className="col-span-1">
                    <RankBadge rank={i + 1} />
                  </div>
                  <div className="col-span-4">
                    <Link
                      href={`/p/${e.address}`}
                      className="group inline-flex items-center gap-2 font-mono text-sm text-silver-100 hover:text-accent"
                    >
                      {shortAddress(e.address)}
                      <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                    {e.lastCheckIn > 0 && (
                      <div className="mt-0.5 text-[10px] text-silver-500">
                        {formatRelative(e.lastCheckIn)}
                      </div>
                    )}
                  </div>
                  <Cell color={e.currentStreak >= 7 ? "text-accent-rose" : "text-white"}>{e.currentStreak}d</Cell>
                  <Cell>{e.totalCheckIns}</Cell>
                  <Cell color={e.badges > 0 ? "text-accent-gold" : "text-silver-500"}>{e.badges}</Cell>
                  <Cell color={e.referrals > 0 ? "text-accent-violet" : "text-silver-500"} colSpan={1}>
                    {e.referrals}
                  </Cell>
                </div>

                {/* Mobile row */}
                <Link href={`/p/${e.address}`} className="block px-4 py-3 md:hidden">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <RankBadge rank={i + 1} />
                      <span className="font-mono text-sm text-silver-100">
                        {shortAddress(e.address)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-base font-bold text-white">
                        {e.currentStreak}
                        <span className="text-xs text-silver-400">d</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-widest text-silver-400">
                    <Pill label="check-ins" value={e.totalCheckIns} accent="text-white" />
                    <Pill label="badges" value={e.badges} accent={e.badges > 0 ? "text-accent-gold" : "text-silver-400"} />
                    <Pill label="refs" value={e.referrals} accent={e.referrals > 0 ? "text-accent-violet" : "text-silver-400"} />
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>
    </>
  );
}

function Cell({
  children,
  color = "text-white",
  colSpan = 2,
}: {
  children: React.ReactNode;
  color?: string;
  colSpan?: number;
}) {
  return (
    <div
      className={`text-right font-display text-base font-bold ${color}`}
      style={{ gridColumn: `span ${colSpan} / span ${colSpan}` }}
    >
      {children}
    </div>
  );
}

function Pill({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1">
      <span>{label}</span>
      <span className={`font-display text-sm font-bold ${accent}`}>{value}</span>
    </div>
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
  return <span className="inline-flex h-7 w-7 items-center justify-center font-mono text-sm text-silver-400">{rank}</span>;
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest ${color}`}>
        {icon}
        <span className="text-silver-400">{label}</span>
      </div>
      <div className="mt-1.5 font-display text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
