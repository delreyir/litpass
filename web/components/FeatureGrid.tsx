"use client";

import { motion } from "framer-motion";
import { Shield, Flame, Stamp, Trophy, Activity, Users, Image as ImageIcon, Share2 } from "lucide-react";

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
    title: "7 streak badges",
    body: "Spark, Flame, Inferno, Eternal, Voyager, Pathfinder, Legend - soulbound ERC-1155 minted automatically on milestones.",
    accent: "from-accent-violet to-accent",
  },
  {
    icon: Activity,
    title: "16 activity badges",
    body: "Earned from real on-chain history: tx count, contracts deployed, wallet age, active days. EIP-712 signed by a public attestor.",
    accent: "from-accent-deep to-accent-violet",
  },
  {
    icon: Stamp,
    title: "Cross-dApp stamps",
    body: "An open registry. WheelX, MidasPredict, Forge and others can grant stamps to your passport. Permissionless once authorized.",
    accent: "from-accent-rose to-accent-violet",
  },
  {
    icon: Users,
    title: "On-chain referrals",
    body: "Every share link carries a referrer. New mints auto-bind on-chain. Track invites and climb the social leaderboard.",
    accent: "from-accent to-accent-gold",
  },
  {
    icon: ImageIcon,
    title: "Dynamic OG images",
    body: "Each public profile gets a real-time OG image. Twitter, Telegram, Warpcast all show your streak and stats inline.",
    accent: "from-accent-violet to-accent-rose",
  },
  {
    icon: Share2,
    title: "Public profiles",
    body: "Every wallet has a shareable URL at /p/[address] with passport, streaks, badges, stamps and referrer chain.",
    accent: "from-accent to-accent-soft",
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
          The missing reputation primitive for Litecoin&apos;s first EVM L2.
          Open, permissionless, and built to compose with every protocol.
        </p>
      </motion.div>

      <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
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
