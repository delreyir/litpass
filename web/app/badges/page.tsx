"use client";

import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { StreakBadgesPanel } from "@/components/badges/StreakBadgesPanel";
import { ActivityBadgesPanel } from "@/components/badges/ActivityBadgesPanel";
import { cn } from "@/lib/utils";
import { Award, Activity } from "lucide-react";

type Tab = "streak" | "activity";

export default function BadgesPage() {
  const { isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("activity");

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Achievement <span className="text-gradient">badges</span>
        </h1>
        <p className="mt-3 max-w-2xl text-silver-300">
          Soulbound badges that mark your activity on LitVM. Two families: in-app streaks and pure on-chain history.
        </p>
      </motion.div>

      <div className="mt-8 inline-flex rounded-xl border border-white/5 bg-ink-900/40 p-1 backdrop-blur">
        <TabButton active={tab === "activity"} onClick={() => setTab("activity")} icon={<Activity className="h-3.5 w-3.5" />}>
          Activity
        </TabButton>
        <TabButton active={tab === "streak"} onClick={() => setTab("streak")} icon={<Award className="h-3.5 w-3.5" />}>
          Streak
        </TabButton>
      </div>

      {!isConnected ? (
        <div className="mt-16 glass mx-auto max-w-md rounded-2xl p-10 text-center">
          <p className="text-silver-200">Connect your wallet to see your badges</p>
          <div className="mt-6 flex justify-center">
            <ConnectButton />
          </div>
        </div>
      ) : tab === "activity" ? (
        <ActivityBadgesPanel />
      ) : (
        <StreakBadgesPanel />
      )}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
        active ? "bg-accent/10 text-white ring-1 ring-accent/30" : "text-silver-300 hover:text-white"
      )}
    >
      {icon}
      {children}
    </button>
  );
}
