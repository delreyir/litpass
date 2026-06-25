"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Connect & mint",
    body: "Connect your wallet to LitVM. Mint your soulbound passport in one transaction.",
  },
  {
    n: "02",
    title: "Check in daily",
    body: "Open LitPass once a day, click check-in, and your on-chain streak grows.",
  },
  {
    n: "03",
    title: "Collect & build",
    body: "Earn badges automatically. Collect stamps from every dApp. Climb the leaderboard.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-2xl text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-silver-300">
          How it works
        </div>
        <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
          From <span className="text-gradient">zero to reputation</span> in 3 steps
        </h2>
      </motion.div>

      <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="relative"
          >
            <div className="glass relative rounded-2xl p-8">
              <div className="font-mono text-sm text-accent">{s.n}</div>
              <h3 className="mt-3 font-display text-2xl font-bold text-white">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-silver-300">{s.body}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden md:absolute md:left-full md:top-1/2 md:flex md:h-px md:w-12 md:-translate-y-1/2 md:items-center">
                <div className="h-px w-full bg-gradient-to-r from-accent/40 to-transparent" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
