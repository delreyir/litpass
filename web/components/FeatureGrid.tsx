"use client";

import { motion } from "framer-motion";
import { Shield, Flame, Stamp, Trophy, Network, Sparkles } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Soulbound by design",
    body: "One pass per wallet. Non-transferable. Your reputation is yours, not a tradable asset.",
    accent: "from-accent to-accent-deep",
  },
  {
    icon: Flame,
    title: "Daily streaks",
    body: "Check in every day to grow your streak. Miss a day, lose it all. Pure incentive design.",
    accent: "from-accent-gold to-accent-rose",
  },
  {
    icon: Trophy,
    title: "Achievement badges",
    body: "Hit 3-day, 7-day, 30-day, 100-day streaks. Earn permanent soulbound badges on-chain.",
    accent: "from-accent-violet to-accent",
  },
  {
    icon: Stamp,
    title: "Cross-dApp stamps",
    body: "Any LitVM dApp can grant you stamps. Use WheelX, MidasPredict, Forge — collect them all.",
    accent: "from-accent-rose to-accent-violet",
  },
  {
    icon: Network,
    title: "Composable on-chain",
    body: "Any contract can read your reputation. Used by lending, gaming, and AI apps.",
    accent: "from-accent-deep to-accent-violet",
  },
  {
    icon: Sparkles,
    title: "100% on-chain art",
    body: "Your passport SVG is generated and stored on LitVM. No IPFS, no servers, just chain.",
    accent: "from-accent to-accent-gold",
  },
];

export function FeatureGrid() {
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
          Why LitPass
        </div>
        <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
          One identity. <span className="text-gradient">Every dApp.</span>
        </h2>
        <p className="mt-4 text-silver-300">
          LitPass is the missing reputation primitive for Litecoin&apos;s first EVM L2.
          Open, permissionless, and built to be used by every protocol.
        </p>
      </motion.div>

      <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="glass group relative overflow-hidden rounded-2xl p-6 transition-shadow hover:shadow-glow"
          >
            <div
              className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-ink-950 shadow-lg`}
            >
              <f.icon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-silver-300">{f.body}</p>

            <div
              className={`pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r ${f.accent} opacity-0 transition-opacity group-hover:opacity-100`}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
