"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Mint your passport",
    body: "Connect your wallet to LitVM LiteForge. Mint a soulbound passport in one transaction - your unique token ID is forever yours.",
  },
  {
    n: "02",
    title: "Check in daily",
    body: "Open LitPass once a day, click Check in. Your streak grows. Miss a day and it resets. Streak milestones mint badges automatically.",
  },
  {
    n: "03",
    title: "Prove your activity",
    body: "Claim activity badges based on real on-chain history: tx count, contracts deployed, unique contracts touched, wallet age, active days.",
  },
  {
    n: "04",
    title: "Share & grow",
    body: "Your profile at /p/[wallet] has dynamic OG images. Share on X or Warpcast, every link auto-binds a referrer when someone mints.",
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
          From <span className="text-gradient">zero to reputation</span> in 4 steps
        </h2>
      </motion.div>

      <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className="relative"
          >
            <div className="glass relative h-full rounded-2xl p-7">
              <div className="font-mono text-sm text-accent">{s.n}</div>
              <h3 className="mt-3 font-display text-xl font-bold text-white">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-silver-300">{s.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
