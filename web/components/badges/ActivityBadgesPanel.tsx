"use client";

import { useAccount, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ADDR, activityBadgesAbi } from "@/lib/contracts";
import { ActivityBadgeCard } from "@/components/ActivityBadgeCard";
import { BadgeClaimedModal, type ClaimedBadgeInfo } from "@/components/badges/BadgeClaimedModal";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

type Metrics = {
  txCount: number;
  contractsDeployed: number;
  uniqueContracts: number;
  walletAgeDays: number;
  activeDays: number;
};

const ACTIVITY_LABEL = ["Transactor", "Builder", "Explorer", "Wallet age", "Active days"] as const;

export function ActivityBadgesPanel() {
  const { address } = useAccount();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [claimedBadge, setClaimedBadge] = useState<ClaimedBadgeInfo | null>(null);
  const pendingClaim = useRef<{ id: number; name: string; description: string; color: string; measuredValue: number } | null>(null);

  const { data: count } = useReadContract({
    address: ADDR.ActivityBadges,
    abi: activityBadgesAbi,
    functionName: "badgeCount",
  });

  const ids = count ? Array.from({ length: Number(count) }, (_, i) => i + 1) : [];

  const metaReads = useReadContracts({
    contracts: ids.map((id) => ({
      address: ADDR.ActivityBadges,
      abi: activityBadgesAbi,
      functionName: "badges",
      args: [BigInt(id)],
    })),
    query: { enabled: ids.length > 0 },
  });

  const balanceReads = useReadContracts({
    contracts: address
      ? ids.map((id) => ({
          address: ADDR.ActivityBadges,
          abi: activityBadgesAbi,
          functionName: "balanceOf",
          args: [address, BigInt(id)],
        }))
      : [],
    query: { enabled: !!address && ids.length > 0 },
  });

  // Fetch on-chain activity metrics for the connected wallet
  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setMetricsLoading(true);
    fetch(`/api/attest?address=${address}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.metrics) setMetrics(j.metrics);
        setMetricsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setMetricsLoading(false);
        toast.error("Could not read activity metrics");
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isSuccess: isMined } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!isMined) return;
    balanceReads.refetch();
    confetti({ particleCount: 200, spread: 110, origin: { y: 0.5 }, colors: ["#22d3ee", "#a78bfa", "#fbbf24", "#fb7185"] });
    toast.success("Activity badge claimed");
    if (pendingClaim.current && address) {
      const p = pendingClaim.current;
      setClaimedBadge({
        family: "activity",
        id: p.id,
        name: p.name,
        description: p.description,
        color: p.color,
        measuredValue: p.measuredValue,
        ownerAddress: address,
      });
      pendingClaim.current = null;
    }
    setClaimingId(null);
    reset();
  }, [isMined, balanceReads, reset, address]);

  useEffect(() => {
    if (error) {
      toast.error(error.message.split("\n")[0]);
      setClaimingId(null);
    }
  }, [error]);

  const onClaim = async (badgeId: number) => {
    if (!address) return;
    setClaimingId(badgeId);
    try {
      const res = await fetch("/api/attest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, badgeId }),
      });
      const j = await res.json();
      if (!j.ok) {
        toast.error(
          j.eligible === false
            ? `Need ${j.threshold} ${j.metric ?? "?"}, you have ${j.measuredValue}`
            : j.error ?? "Attestation failed"
        );
        setClaimingId(null);
        return;
      }
      const c = j.claim as { badgeId: number; measuredValue: number; nonce: number; expiresAt: number; signature: `0x${string}` };

      // capture badge metadata to show in modal after the tx is mined
      const idxBadge = ids.indexOf(badgeId);
      const meta = metaReads.data?.[idxBadge]?.result as readonly [string, string, string, number, number | bigint, boolean] | undefined;
      if (meta) {
        pendingClaim.current = {
          id: badgeId,
          name: meta[0],
          description: meta[1],
          color: meta[2],
          measuredValue: c.measuredValue,
        };
      }

      writeContract({
        address: ADDR.ActivityBadges,
        abi: activityBadgesAbi,
        functionName: "claim",
        args: [BigInt(c.badgeId), BigInt(c.measuredValue), BigInt(c.nonce), BigInt(c.expiresAt), c.signature],
      });
      toast.loading("Submitting claim…", { id: "claim-tx" });
    } catch (err) {
      toast.error((err as Error).message);
      setClaimingId(null);
    }
  };

  useEffect(() => {
    if (isMined) toast.dismiss("claim-tx");
  }, [isMined]);

  // Group badges by activity family
  type Group = { label: string; activity: number; items: { idx: number; id: number; meta: readonly [string, string, string, number, number, boolean] }[] };
  const groups: Group[] = [];
  ids.forEach((id, idx) => {
    const meta = metaReads.data?.[idx]?.result as readonly [string, string, string, number, number, boolean] | undefined;
    if (!meta || !meta[5]) return;
    const activity = Number(meta[3]);
    const g = groups.find((x) => x.activity === activity);
    const item = { idx, id, meta };
    if (g) g.items.push(item);
    else groups.push({ label: ACTIVITY_LABEL[activity] ?? `Family ${activity}`, activity, items: [item] });
  });

  if (ids.length === 0) {
    return <div className="mt-16 text-center text-silver-400">Loading badges…</div>;
  }

  return (
    <div className="mt-10">
      <MetricsHeader metrics={metrics} loading={metricsLoading} />

      <div className="mt-10 space-y-10">
        {groups.map((g) => (
          <div key={g.activity}>
            <div className="mb-4 flex items-center gap-2">
              <span className="font-display text-lg font-semibold text-white">{g.label}</span>
              <span className="text-xs text-silver-500">· family</span>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {g.items.map(({ idx, id, meta }, j) => {
                const [name, description, color, , threshold] = meta;
                const bal = balanceReads.data?.[idx]?.result as bigint | undefined;
                const owned = (bal ?? 0n) > 0n;
                const measured = metrics ? metricValueFor(g.activity, metrics) : undefined;

                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: j * 0.05 }}
                  >
                    <ActivityBadgeCard
                      id={id}
                      name={name}
                      description={description}
                      color={color}
                      threshold={Number(threshold)}
                      measured={measured}
                      loading={metricsLoading}
                      owned={owned}
                      onClaim={() => onClaim(id)}
                      pending={claimingId === id && (isPending || (!!txHash && !isMined))}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <BadgeClaimedModal badge={claimedBadge} onClose={() => setClaimedBadge(null)} />
    </div>
  );
}

function metricValueFor(activity: number, m: Metrics): number {
  switch (activity) {
    case 0: return m.txCount;
    case 1: return m.contractsDeployed;
    case 2: return m.uniqueContracts;
    case 3: return m.walletAgeDays;
    case 4: return m.activeDays;
    default: return 0;
  }
}

function MetricsHeader({ metrics, loading }: { metrics: Metrics | null; loading: boolean }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="text-xs uppercase tracking-wider text-silver-400">Your LitVM activity</div>
      <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-5">
        <MetricTile label="Total TX" value={metrics?.txCount} loading={loading} color="#22d3ee" />
        <MetricTile label="Contracts deployed" value={metrics?.contractsDeployed} loading={loading} color="#fbbf24" />
        <MetricTile label="Unique contracts" value={metrics?.uniqueContracts} loading={loading} color="#10b981" />
        <MetricTile label="Wallet age (days)" value={metrics?.walletAgeDays} loading={loading} color="#fb7185" />
        <MetricTile label="Active days" value={metrics?.activeDays} loading={loading} color="#a78bfa" />
      </div>
    </div>
  );
}

function MetricTile({ label, value, loading, color }: { label: string; value?: number; loading: boolean; color: string }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-widest text-silver-400">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold" style={{ color: typeof value === "number" ? color : "#566280" }}>
        {loading ? "…" : (typeof value === "number" ? value.toLocaleString() : "-")}
      </div>
    </div>
  );
}
