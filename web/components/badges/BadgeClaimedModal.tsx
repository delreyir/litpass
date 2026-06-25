"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Twitter, Copy, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export type ClaimedBadgeInfo = {
  family: "activity" | "streak";
  id: number;
  name: string;
  description: string;
  color: string;
  measuredValue?: number;
  ownerAddress: `0x${string}`;
};

export function BadgeClaimedModal({
  badge,
  onClose,
}: {
  badge: ClaimedBadgeInfo | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const url = badge
    ? typeof window !== "undefined"
      ? `${window.location.origin}/p/${badge.ownerAddress}/badge/${badge.family}/${badge.id}?ref=${badge.ownerAddress}`
      : `https://litpass.vercel.app/p/${badge.ownerAddress}/badge/${badge.family}/${badge.id}?ref=${badge.ownerAddress}`
    : "";

  const tweet = badge
    ? `I just earned the ${badge.name} badge on @LitecoinVM 🔥\n\n` +
      `${badge.description}\n\n` +
      `Mint your LitPass and start collecting:`
    : "";

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`;
  const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(tweet + " " + url)}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-700 to-ink-900 shadow-2xl"
          >
            {/* glow */}
            <div
              className="absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
              style={{ background: badge.color, opacity: 0.35 }}
            />
            <div
              className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full blur-3xl"
              style={{ background: badge.color, opacity: 0.2 }}
            />

            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-silver-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative p-8 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
                className="mx-auto mt-2 flex h-32 w-32 items-center justify-center rounded-full"
                style={{
                  background: `radial-gradient(circle, ${badge.color}88 0%, ${badge.color}22 60%, transparent 100%)`,
                  boxShadow: `0 0 60px ${badge.color}66`,
                }}
              >
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full border-2"
                  style={{ borderColor: badge.color, background: "rgba(11,16,32,0.7)" }}
                >
                  <span className="font-display text-base font-bold" style={{ color: badge.color }}>
                    {badge.name}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest text-accent">
                  badge claimed
                </div>
                <h2 className="mt-3 font-display text-3xl font-bold text-white">{badge.name}</h2>
                <p className="mt-2 text-sm text-silver-300">{badge.description}</p>
              </motion.div>

              {/* share */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6"
              >
                <div className="text-xs uppercase tracking-widest text-silver-400">share</div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/95 px-3 py-2.5 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.02]"
                  >
                    <Twitter className="h-4 w-4" /> Post on X
                  </a>
                  <a
                    href={warpcastUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8a63d2] px-3 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                  >
                    Warpcast
                  </a>
                  <button
                    onClick={onCopy}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-silver-100 transition-colors hover:bg-white/10"
                  >
                    {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="mt-5 flex items-center justify-between text-xs text-silver-400"
              >
                <Link href={`/p/${badge.ownerAddress}`} className="inline-flex items-center gap-1 hover:text-accent">
                  View profile <ExternalLink className="h-3 w-3" />
                </Link>
                <Link href={`/p/${badge.ownerAddress}/badge/${badge.family}/${badge.id}`} className="hover:text-accent">
                  badge page
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
