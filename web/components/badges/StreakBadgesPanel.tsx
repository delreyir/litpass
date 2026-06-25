"use client";

import { useAccount, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ADDR, badgesAbi } from "@/lib/contracts";
import { BadgeCard } from "@/components/BadgeCard";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

/**
 * The original "Achievement" badges driven by LitPass streak/check-in state.
 */
export function StreakBadgesPanel() {
  const { address } = useAccount();
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const { data: count } = useReadContract({
    address: ADDR.AchievementBadges,
    abi: badgesAbi,
    functionName: "badgeCount",
  });

  const ids = count ? Array.from({ length: Number(count) }, (_, i) => i + 1) : [];

  const metaReads = useReadContracts({
    contracts: ids.map((id) => ({
      address: ADDR.AchievementBadges,
      abi: badgesAbi,
      functionName: "badges",
      args: [BigInt(id)],
    })),
    query: { enabled: ids.length > 0 },
  });

  const balanceReads = useReadContracts({
    contracts: address
      ? ids.map((id) => ({
          address: ADDR.AchievementBadges,
          abi: badgesAbi,
          functionName: "balanceOf",
          args: [address, BigInt(id)],
        }))
      : [],
    query: { enabled: !!address && ids.length > 0 },
  });

  const eligibleReads = useReadContracts({
    contracts: address
      ? ids.map((id) => ({
          address: ADDR.AchievementBadges,
          abi: badgesAbi,
          functionName: "isEligible",
          args: [address, BigInt(id)],
        }))
      : [],
    query: { enabled: !!address && ids.length > 0 },
  });

  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isSuccess: isMined } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!isMined) return;
    balanceReads.refetch();
    confetti({ particleCount: 160, spread: 100, origin: { y: 0.5 }, colors: ["#22d3ee", "#a78bfa", "#fbbf24"] });
    toast.success("Badge claimed");
    setClaimingId(null);
    reset();
  }, [isMined, balanceReads, reset]);

  useEffect(() => {
    if (error) {
      toast.error(error.message.split("\n")[0]);
      setClaimingId(null);
    }
  }, [error]);

  const onClaim = (id: number) => {
    setClaimingId(id);
    writeContract({ address: ADDR.AchievementBadges, abi: badgesAbi, functionName: "claim", args: [BigInt(id)] });
  };

  if (ids.length === 0) {
    return <div className="mt-16 text-center text-silver-400">Loading badges…</div>;
  }

  return (
    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {ids.map((id, i) => {
        const meta = metaReads.data?.[i]?.result as
          | readonly [string, string, string, number, number, boolean]
          | undefined;
        if (!meta || !meta[5]) return null;
        const [name, description, color] = meta;

        const bal = balanceReads.data?.[i]?.result as bigint | undefined;
        const owned = (bal ?? 0n) > 0n;
        const eligible = (eligibleReads.data?.[i]?.result as boolean | undefined) ?? false;

        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <BadgeCard
              id={id}
              name={name}
              description={description}
              color={color}
              owned={owned}
              eligible={eligible}
              onClaim={() => onClaim(id)}
              pending={claimingId === id && (isPending || (!!txHash && !isMined))}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
