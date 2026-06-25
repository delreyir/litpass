"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield, Flame, Activity, Stamp } from "lucide-react";
import { PassportPreview } from "./PassportPreview";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:py-24 lg:grid-cols-2 lg:py-32">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-silver-200 backdrop-blur"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Live on LitVM LiteForge Testnet · Chain 4441
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
          >
            Your <span className="text-gradient">identity</span><br />
            on Litecoin&apos;s<br />
            first EVM L2.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-silver-300"
          >
            Mint a soulbound passport. Check in daily for streaks. Earn 7 streak
            badges and 16 activity badges based on your real on-chain history.
            One reputation, used by every LitVM dApp.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/passport"
              className="group relative inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 font-semibold text-ink-950 shadow-glow transition-all hover:scale-[1.02] hover:bg-accent-soft active:scale-[0.98]"
            >
              Mint your passport
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/badges"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-silver-100 backdrop-blur transition-colors hover:bg-white/10"
            >
              View badges
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-12 grid max-w-lg grid-cols-4 gap-6 border-t border-white/5 pt-8"
          >
            <Feature icon={<Shield className="h-4 w-4" />} label="Soulbound" />
            <Feature icon={<Flame className="h-4 w-4" />} label="Daily streaks" />
            <Feature icon={<Activity className="h-4 w-4" />} label="Activity proofs" />
            <Feature icon={<Stamp className="h-4 w-4" />} label="dApp stamps" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center justify-center"
        >
          <PassportPreview />
        </motion.div>
      </div>
    </section>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent ring-1 ring-accent/20">
        {icon}
      </div>
      <span className="text-sm font-medium text-silver-200">{label}</span>
    </div>
  );
}
