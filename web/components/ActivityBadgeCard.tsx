"use client";

import { motion } from "framer-motion";
import { Lock, Check, Loader2 } from "lucide-react";

type Props = {
  id: number;
  name: string;
  description: string;
  color: string;
  threshold: number;
  measured?: number;
  owned: boolean;
  pending: boolean;
  loading?: boolean;
  onClaim: () => void;
};

export function ActivityBadgeCard({
  name,
  description,
  color,
  threshold,
  measured,
  owned,
  pending,
  loading,
  onClaim,
}: Props) {
  const known = typeof measured === "number";
  const eligible = known && (measured as number) >= threshold;
  const pct = known ? Math.min((measured as number) / threshold, 1) : 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="glass relative overflow-hidden rounded-2xl p-6"
    >
      <div
        className="absolute -right-10 -top-10 h-44 w-44 rounded-full blur-3xl"
        style={{ background: owned ? color : "rgba(255,255,255,0.03)", opacity: owned ? 0.35 : 1 }}
      />

      <div className="relative">
        <div className="flex items-center gap-4">
          <div
            className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: `radial-gradient(circle, ${color}55 0%, ${color}11 60%, transparent 100%)`,
              border: `1px solid ${owned ? color : "rgba(255,255,255,0.08)"}`,
            }}
          >
            <span className="font-display text-sm font-bold" style={{ color: owned ? color : "#566280" }}>
              {name.slice(0, 3).toUpperCase()}
            </span>
            {owned && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-ink-950"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </motion.div>
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-display text-base font-semibold text-white">{name}</h3>
            <p className="mt-0.5 text-xs text-silver-400">{description}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-[11px] font-mono text-silver-400">
            <span>
              {loading ? "scanning…" : known ? `${measured} / ${threshold}` : `target ${threshold}`}
            </span>
            {known && !loading && (
              <span className="text-silver-300">{Math.round(pct * 100)}%</span>
            )}
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full"
              style={{ background: color }}
              initial={{ width: 0 }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        <div className="mt-5">
          {owned ? (
            <div className="inline-flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent ring-1 ring-accent/20">
              <Check className="h-3.5 w-3.5" /> Owned
            </div>
          ) : eligible ? (
            <button
              onClick={onClaim}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink-950 transition-all hover:scale-[1.02] hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify & claim"}
            </button>
          ) : loading ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-silver-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading chain…
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-silver-400">
              <Lock className="h-3.5 w-3.5" /> Locked
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
