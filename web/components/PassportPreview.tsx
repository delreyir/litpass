"use client";

import { motion } from "framer-motion";

export function PassportPreview() {
  return (
    <div className="relative w-full max-w-md">
      {/* Glow blob behind */}
      <div className="absolute -inset-10 -z-10 rounded-[3rem] bg-accent/20 blur-3xl" />

      {/* Floating chips */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1, y: [0, -6, 0] }}
        transition={{ x: { duration: 0.6, delay: 0.6 }, y: { duration: 4, repeat: Infinity } }}
        className="absolute -left-6 top-10 z-20 rounded-xl border border-white/10 bg-ink-800/80 px-3 py-2 backdrop-blur-md shadow-card"
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent-gold" />
          <span className="text-xs font-medium text-silver-100">Spark · 3-day streak</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1, y: [0, 6, 0] }}
        transition={{ x: { duration: 0.6, delay: 0.8 }, y: { duration: 5, repeat: Infinity, delay: 0.5 } }}
        className="absolute -right-4 top-32 z-20 rounded-xl border border-white/10 bg-ink-800/80 px-3 py-2 backdrop-blur-md shadow-card"
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent-violet" />
          <span className="text-xs font-medium text-silver-100">Stamp · WheelX swap</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1, y: [0, 6, 0] }}
        transition={{ x: { duration: 0.6, delay: 1 }, y: { duration: 4.5, repeat: Infinity, delay: 1 } }}
        className="absolute -left-3 bottom-14 z-20 rounded-xl border border-white/10 bg-ink-800/80 px-3 py-2 backdrop-blur-md shadow-card"
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent-rose" />
          <span className="text-xs font-medium text-silver-100">Inferno · 30-day streak</span>
        </div>
      </motion.div>

      {/* Passport card */}
      <motion.div
        whileHover={{ rotateY: 8, rotateX: -4, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        style={{ transformStyle: "preserve-3d", perspective: 1200 }}
        className="relative aspect-[2/3] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900 p-7 shadow-2xl"
      >
        {/* Animated holographic border */}
        <div className="absolute inset-0 rounded-3xl bg-[conic-gradient(from_var(--a),#22d3ee_0deg,transparent_60deg,#a78bfa_180deg,transparent_240deg,#22d3ee_360deg)] [--a:0deg] animate-spin-slow opacity-30" style={{ filter: "blur(20px)" }} />

        <div className="relative h-full">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-widest text-silver-400">
              LITVM PASSPORT
            </span>
            <span className="font-mono text-[10px] text-silver-400">#0001</span>
          </div>

          <div className="mt-10">
            <h3 className="font-display text-4xl font-bold tracking-tight text-white">
              LitPass
            </h3>
            <p className="mt-1 font-mono text-xs text-silver-400">soulbound · chain 4441</p>
          </div>

          {/* Animated chip + dot pattern */}
          <div className="mt-12 flex h-14 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-accent-gold/80 via-accent/60 to-accent-violet/50 shadow-inner">
            <div className="grid h-9 w-14 grid-cols-3 gap-0.5 rounded-md bg-ink-900/40 p-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-[2px] bg-accent-gold/40" />
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="absolute bottom-0 left-0 right-0 grid grid-cols-2 gap-6">
            <Stat label="STREAK" value={<AnimatedCounter to={7} />} />
            <Stat label="CHECK-INS" value={<AnimatedCounter to={42} />} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-widest text-silver-400">{label}</div>
      <div className="mt-1 font-display text-4xl font-bold text-white">{value}</div>
    </div>
  );
}

function AnimatedCounter({ to }: { to: number }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.8 }}
    >
      {to}
    </motion.span>
  );
}
