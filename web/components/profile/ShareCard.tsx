"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Twitter, Share2 } from "lucide-react";
import { useAccount } from "wagmi";
import { toast } from "sonner";

export function ShareCard({ address, tokenId, streak }: { address: `0x${string}`; tokenId: bigint; streak: number }) {
  const { address: viewer } = useAccount();
  const isOwner = viewer && viewer.toLowerCase() === address.toLowerCase();
  const [copied, setCopied] = useState(false);

  // If the viewer holds a passport, embed their address as referrer when they
  // share someone else's profile - turning every share into a referral.
  const refParam = viewer && !isOwner ? `?ref=${viewer}` : isOwner ? `?ref=${address}` : "";
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${address}${refParam}`
      : `https://litpass.vercel.app/p/${address}${refParam}`;

  const tweet = isOwner
    ? `I just minted my LitPass #${tokenId.toString()} on LitVM - ${streak}-day streak and counting 🔥\n\nGet yours:`
    : `Check out this LitPass on LitVM - ${streak}-day streak 🔥`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`;
  const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(tweet + " " + url)}`;

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

  const onNativeShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) {
      onCopy();
      return;
    }
    try {
      await navigator.share({ title: "LitPass", text: tweet, url });
    } catch {
      // user cancelled - silent
    }
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs font-mono uppercase tracking-widest text-silver-400">
        {isOwner ? "Share your passport" : "Share this profile"}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-ink-950/40 px-3 py-2.5">
        <code className="flex-1 truncate font-mono text-xs text-silver-200">{url}</code>
        <button
          onClick={onCopy}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-silver-300 transition-all hover:bg-white/10 hover:text-white"
          aria-label="Copy link"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span key="ok" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }}>
                <Check className="h-3.5 w-3.5 text-accent" />
              </motion.span>
            ) : (
              <motion.span key="copy" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }}>
                <Copy className="h-3.5 w-3.5" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <a
          href={twitterUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-silver-100 transition-colors hover:bg-white/10"
        >
          <Twitter className="h-3.5 w-3.5" /> X
        </a>
        <a
          href={farcasterUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-silver-100 transition-colors hover:bg-white/10"
        >
          Warpcast
        </a>
        <button
          onClick={onNativeShare}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent/15 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/25"
        >
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
      </div>

      {isOwner && (
        <p className="mt-3 text-[11px] leading-relaxed text-silver-500">
          Every visitor who mints from your link is recorded as your referral on-chain.
        </p>
      )}
    </div>
  );
}
