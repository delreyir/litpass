"use client";

import { motion } from "framer-motion";
import { Lock, Check } from "lucide-react";

type Props = {
  id: number;
  name: string;
  description: string;
  color: string;
  owned: boolean;
  eligible: boolean;
  onClaim: () => void;
  pending: boolean;
};

export function BadgeCard({ id, name, description, color, owned, eligible, onClaim, pending }: Props) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="glass relative overflow-hidden rounded-2xl p-6"
    >
      {/* glow */}
      <div
        className="absolute -right-10 -top-10 h-44 w-44 rounded-full blur-3xl"
        style={{ background: owned ? color : "rgba(255,255,255,0.04)", opacity: owned ? 0.35 : 1 }}
      />

      <div className="relative">
        <div className="flex h-28 w-28 items-center justify-center">
          <div
            className="relative flex h-24 w-24 items-center justify-center rounded-full"
            style={{
              background: `radial-gradient(circle, ${color}88 0%, ${color}22 60%, transparent 100%)`,
            }}
          >
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full border"
              style={{
                borderColor: owned ? color : "rgba(255,255,255,0.1)",
                background: "rgba(11,16,32,0.6)",
              }}
            >
              <span className="font-display text-base font-bold" style={{ color: owned ? color : "#566280" }}>
                {name}
              </span>
            </div>
            {owned && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-ink-950"
              >
                <Check className="h-4 w-4" strokeWidth={3} />
              </motion.div>
            )}
          </div>
        </div>

        <h3 className="mt-4 font-display text-lg font-semibold text-white">{name}</h3>
        <p className="mt-1 text-sm text-silver-400">{description}</p>

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
              {pending ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
              ) : (
                "Claim"
              )}
            </button>
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
