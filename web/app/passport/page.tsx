"use client";

import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ADDR, litPassAbi, referralAbi, DAY_LENGTH } from "@/lib/contracts";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PassportCard } from "@/components/PassportCard";
import { StreakRing } from "@/components/StreakRing";
import { Countdown } from "@/components/Countdown";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Flame, Sparkles, Calendar, Award, ExternalLink, Share2 } from "lucide-react";
import { shortAddress, formatRelative } from "@/lib/utils";
import { useReferrer } from "@/lib/useReferrer";
import Link from "next/link";

export default function PassportPage() {
  const { address, isConnected } = useAccount();
  const { referrer, clear: clearRef } = useReferrer();
  const [autoBindAttempted, setAutoBindAttempted] = useState(false);

  const { data: hasPass, refetch: refetchHasPass } = useReadContract({
    address: ADDR.LitPass,
    abi: litPassAbi,
    functionName: "hasPass",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: pass, refetch: refetchPass } = useReadContract({
    address: ADDR.LitPass,
    abi: litPassAbi,
    functionName: "getPass",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!hasPass },
  });

  const { data: canCheckIn, refetch: refetchCanCheckIn } = useReadContract({
    address: ADDR.LitPass,
    abi: litPassAbi,
    functionName: "canCheckIn",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!hasPass },
  });

  const { data: currentReferrer, refetch: refetchReferrer } = useReadContract({
    address: ADDR.ReferralTracker,
    abi: referralAbi,
    functionName: "referrerOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!hasPass },
  });

  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isMining, isSuccess: isMined } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!isMined) return;
    refetchHasPass();
    refetchPass();
    refetchCanCheckIn();
    refetchReferrer();
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.4 },
      colors: ["#22d3ee", "#a78bfa", "#fb7185", "#fbbf24"],
    });
    toast.success("Confirmed on LitVM");
    reset();
  }, [isMined, refetchHasPass, refetchPass, refetchCanCheckIn, refetchReferrer, reset]);

  useEffect(() => {
    if (error) toast.error(error.message.split("\n")[0]);
  }, [error]);

  useEffect(() => {
    if (isMined) toast.dismiss("tx");
  }, [isMined]);

  // Auto-bind referrer once the user has a passport and a stored ?ref= exists.
  useEffect(() => {
    if (!hasPass || !address || !referrer || autoBindAttempted) return;
    // skip if already bound or self-referral
    if (currentReferrer && currentReferrer !== "0x0000000000000000000000000000000000000000") return;
    if (referrer.toLowerCase() === address.toLowerCase()) {
      clearRef();
      return;
    }
    setAutoBindAttempted(true);
    writeContract({
      address: ADDR.ReferralTracker,
      abi: referralAbi,
      functionName: "bindReferrer",
      args: [referrer],
    });
    toast.loading("Binding referrer…", { id: "tx" });
  }, [hasPass, address, referrer, currentReferrer, autoBindAttempted, clearRef, writeContract]);

  useEffect(() => {
    if (isMined && referrer && autoBindAttempted) clearRef();
  }, [isMined, referrer, autoBindAttempted, clearRef]);

  const onMint = () => {
    writeContract({ address: ADDR.LitPass, abi: litPassAbi, functionName: "mint" });
    toast.loading("Minting passport…", { id: "tx" });
  };

  const onCheckIn = () => {
    writeContract({ address: ADDR.LitPass, abi: litPassAbi, functionName: "checkIn" });
    toast.loading("Checking in…", { id: "tx" });
  };

  const streak = pass ? Number(pass.currentStreak) : 0;
  const longest = pass ? Number(pass.longestStreak) : 0;
  const checkIns = pass ? Number(pass.totalCheckIns) : 0;
  const tokenId = pass ? pass.tokenId : undefined;
  const lastCheckIn = pass ? Number(pass.lastCheckIn) : 0;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Your <span className="text-gradient">passport</span>
        </h1>
        <p className="mt-3 max-w-2xl text-silver-300">
          Mint once. Check in daily. Your streak, badges, and stamps live on-chain forever.
        </p>
      </motion.div>

      {referrer && !hasPass && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span className="text-silver-200">
            Invited by{" "}
            <Link href={`/p/${referrer}`} className="font-mono text-accent hover:underline">
              {shortAddress(referrer)}
            </Link>
          </span>
        </motion.div>
      )}

      {!isConnected ? (
        <div className="mt-16 flex flex-col items-center gap-6">
          <div className="glass rounded-2xl p-10 text-center">
            <p className="text-silver-200">Connect your wallet to continue</p>
            <div className="mt-6 flex justify-center">
              <ConnectButton />
            </div>
          </div>
        </div>
      ) : !hasPass ? (
        <MintPanel onMint={onMint} pending={isPending || isMining} />
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="flex justify-center lg:justify-end">
            <PassportCard
              tokenId={tokenId}
              streak={streak}
              longest={longest}
              checkIns={checkIns}
            />
          </div>

          <div className="space-y-6">
            <div className="glass rounded-2xl p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-silver-300">
                  <Flame className="h-4 w-4 text-accent-rose" />
                  Today&apos;s check-in
                </div>
                <span className="font-mono text-xs text-silver-400">{shortAddress(address)}</span>
              </div>

              <div className="mt-6 flex items-center justify-between gap-6">
                <StreakRing value={streak} max={Math.max(streak, 30)} label="day streak" />

                <div className="flex-1 space-y-3">
                  <Row icon={<Award className="h-4 w-4" />} label="Longest" value={`${longest}d`} />
                  <Row icon={<Calendar className="h-4 w-4" />} label="Total" value={`${checkIns}`} />
                  <Row
                    icon={<Sparkles className="h-4 w-4" />}
                    label="Last check-in"
                    value={lastCheckIn === 0 ? "never" : formatRelative(lastCheckIn)}
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {canCheckIn ? (
                  <motion.button
                    key="ready"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onClick={onCheckIn}
                    disabled={isPending || isMining}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 font-semibold text-ink-950 shadow-glow transition-all hover:scale-[1.01] hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending || isMining ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
                        Confirming…
                      </>
                    ) : (
                      <>
                        <Flame className="h-4 w-4" />
                        Check in now
                      </>
                    )}
                  </motion.button>
                ) : (
                  <motion.div
                    key="cooling"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-silver-200"
                  >
                    Already checked in. Next in <Countdown until={nextCheckInTimestamp(Number(pass?.lastCheckIn ?? 0))} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {address && (
              <Link
                href={`/p/${address}`}
                className="glass flex items-center justify-between rounded-xl px-5 py-4 text-sm transition-colors hover:bg-white/5"
              >
                <span className="inline-flex items-center gap-2 text-silver-200">
                  <Share2 className="h-4 w-4 text-accent" />
                  View & share your public profile
                </span>
                <ExternalLink className="h-4 w-4 text-silver-400" />
              </Link>
            )}

            {txHash && (
              <a
                href={`https://liteforge.explorer.caldera.xyz/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="glass flex items-center justify-between rounded-xl px-5 py-4 text-sm text-silver-200 transition-colors hover:bg-white/5"
              >
                <span className="font-mono text-xs">{txHash.slice(0, 18)}…{txHash.slice(-6)}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-silver-400">
        {icon}
        {label}
      </div>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}

function MintPanel({ onMint, pending }: { onMint: () => void; pending: boolean }) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
      <div className="flex justify-center lg:justify-end">
        <PassportCard streak={0} longest={0} checkIns={0} />
      </div>
      <div className="space-y-6">
        <div className="glass rounded-2xl p-8">
          <h2 className="font-display text-2xl font-bold text-white">Claim your passport</h2>
          <p className="mt-2 text-silver-300">
            One soulbound passport per wallet. Gets you a unique on-chain identity,
            a daily check-in loop, and access to every LitPass feature.
          </p>

          <ul className="mt-6 space-y-3 text-sm">
            <Bullet>Free to mint - pay only LitVM gas</Bullet>
            <Bullet>Lower IDs are minted first - be early</Bullet>
            <Bullet>100% on-chain SVG art, no IPFS</Bullet>
            <Bullet>Compatible with every LitVM dApp</Bullet>
          </ul>

          <button
            onClick={onMint}
            disabled={pending}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 font-semibold text-ink-950 shadow-glow transition-all hover:scale-[1.01] hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
                Minting…
              </>
            ) : (
              "Mint passport"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-silver-200">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
      <span>{children}</span>
    </li>
  );
}

// The next check-in is the start of the next "day window".
// Matches the contract logic: floor(lastCheckIn / DAY_LENGTH + 1) * DAY_LENGTH.
function nextCheckInTimestamp(lastCheckIn: number): number {
  if (lastCheckIn === 0) return 0;
  return (Math.floor(lastCheckIn / DAY_LENGTH) + 1) * DAY_LENGTH;
}
