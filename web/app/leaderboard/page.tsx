"use client";

import { motion } from "framer-motion";
import { useReadContract } from "wagmi";
import { ADDR, litPassAbi } from "@/lib/contracts";
import { Trophy, Flame, Users } from "lucide-react";

export default function LeaderboardPage() {
  const { data: total } = useReadContract({
    address: ADDR.LitPass,
    abi: litPassAbi,
    functionName: "totalSupply",
  });

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          <span className="text-gradient">Leaderboard</span>
        </h1>
        <p className="mt-3 max-w-2xl text-silver-300">
          The top check-in streakers across LitVM.
        </p>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat icon={<Users className="h-5 w-5" />} label="Passports minted" value={total?.toString() ?? "—"} />
        <Stat icon={<Flame className="h-5 w-5" />} label="Day length" value="1 hour" />
        <Stat icon={<Trophy className="h-5 w-5" />} label="Active badges" value="7" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="glass mt-10 overflow-hidden rounded-2xl"
      >
        <div className="grid grid-cols-12 gap-4 border-b border-white/5 bg-white/2.5 px-6 py-4 text-xs font-mono uppercase tracking-widest text-silver-400">
          <div className="col-span-1">#</div>
          <div className="col-span-6">Wallet</div>
          <div className="col-span-2 text-right">Streak</div>
          <div className="col-span-3 text-right">Check-ins</div>
        </div>

        <div className="divide-y divide-white/5">
          {/* The on-chain contract doesn't expose an enumeration, so this UI
              renders an empty state pointing builders to the indexer route. */}
          <div className="px-6 py-16 text-center text-silver-400">
            <p className="text-silver-200">Leaderboard data is computed off-chain.</p>
            <p className="mt-2 text-sm">
              Index <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">CheckedIn</code> events with{" "}
              <a
                href="https://docs.litvm.com/integrations/goldsky"
                target="_blank"
                rel="noreferrer"
                className="text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent"
              >
                Goldsky
              </a>{" "}
              or any subgraph to populate the top 100. Backend route stub is at{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">/api/leaderboard</code>.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
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
