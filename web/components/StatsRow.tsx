"use client";

import { motion } from "framer-motion";
import { useReadContract } from "wagmi";
import { ADDR, litPassAbi } from "@/lib/contracts";
import { Users, Trophy, Activity } from "lucide-react";

export function StatsRow() {
  const { data: total } = useReadContract({
    address: ADDR.LitPass,
    abi: litPassAbi,
    functionName: "totalSupply",
  });

  const stats = [
    {
      icon: Users,
      label: "Total passports",
      value: total ? total.toString() : "-",
      color: "text-accent",
    },
    {
      icon: Trophy,
      label: "Streak badges",
      value: "7",
      color: "text-accent-gold",
    },
    {
      icon: Activity,
      label: "Activity badges",
      value: "16",
      color: "text-accent-violet",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wider text-silver-400">
                  {s.label}
                </div>
                <div className="font-display text-2xl font-bold text-white">
                  {s.value}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
