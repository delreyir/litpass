"use client";

import { motion } from "framer-motion";

type Props = {
  tokenId?: bigint;
  streak: number;
  longest: number;
  checkIns: number;
};

export function PassportCard({ tokenId, streak, longest, checkIns }: Props) {
  const id = tokenId ? `#${tokenId.toString().padStart(4, "0")}` : "#----";

  return (
    <motion.div
      whileHover={{ rotateY: 6, rotateX: -3 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      style={{ transformStyle: "preserve-3d", perspective: 1200 }}
      className="relative aspect-[2/3] w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900 p-6 shadow-2xl"
    >
      <div className="absolute inset-0 rounded-3xl bg-[conic-gradient(from_0deg,#22d3ee_0deg,transparent_60deg,#a78bfa_180deg,transparent_240deg,#22d3ee_360deg)] animate-spin-slow opacity-25" style={{ filter: "blur(24px)" }} />

      <div className="relative h-full">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest text-silver-400">LITVM PASSPORT</span>
          <span className="font-mono text-[10px] text-silver-400">{id}</span>
        </div>

        <div className="mt-8">
          <h3 className="font-display text-3xl font-bold tracking-tight text-white">LitPass</h3>
          <p className="mt-1 font-mono text-[11px] text-silver-400">soulbound · chain 4441</p>
        </div>

        <div className="mt-10 flex h-12 w-16 items-center justify-center rounded-md bg-gradient-to-br from-accent-gold/80 via-accent/60 to-accent-violet/50">
          <div className="grid h-8 w-12 grid-cols-3 gap-0.5 rounded-sm bg-ink-900/40 p-0.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-[1px] bg-accent-gold/40" />
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 grid grid-cols-3 gap-3">
          <Stat label="STREAK" value={streak} />
          <Stat label="BEST" value={longest} />
          <Stat label="CHECK-INS" value={checkIns} />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-widest text-silver-400">{label}</div>
      <motion.div
        key={value}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className="font-display text-2xl font-bold text-white"
      >
        {value}
      </motion.div>
    </div>
  );
}
