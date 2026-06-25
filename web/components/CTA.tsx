"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-700/60 via-ink-800/60 to-ink-900/60 p-12 backdrop-blur-xl md:p-20"
      >
        {/* glow */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent-violet/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Be one of the <span className="text-gradient">first 10,000</span>
          </h2>
          <p className="mt-5 text-lg text-silver-300">
            Low passport numbers are minted once. Stake your spot in LitVM history before mainnet.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/passport"
              className="group inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 font-semibold text-ink-950 shadow-glow transition-all hover:scale-[1.02] hover:bg-accent-soft active:scale-[0.98]"
            >
              Mint your passport
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="https://testnet.litvm.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-silver-100 transition-colors hover:bg-white/10"
            >
              Get testnet zkLTC
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
