"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { ADDR, usernamesAbi } from "@/lib/contracts";
import {
  ExternalLink,
  Award,
  Stamp,
  Users,
  Flame,
  Trophy,
  Calendar,
  ArrowLeft,
  AtSign,
  Edit3,
} from "lucide-react";
import { PassportCard } from "@/components/PassportCard";
import { ShareCard } from "@/components/profile/ShareCard";
import { UsernameDialog } from "@/components/profile/UsernameDialog";
import { shortAddress, formatRelative } from "@/lib/utils";

type Badge = { id: number; name: string; description: string; color: string };
type StampLite = { id: `0x${string}`; issuer: `0x${string}`; name: string; description: string };

type Profile = {
  address: `0x${string}`;
  hasPass: boolean;
  tokenId: bigint;
  mintedAt: number;
  lastCheckIn: number;
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  badges: Badge[];
  stamps: StampLite[];
  referrals: number;
  referrer: `0x${string}`;
};

export function ProfileClient({ profile }: { profile: Profile }) {
  const { address: viewer } = useAccount();
  const isOwner = viewer && viewer.toLowerCase() === profile.address.toLowerCase();
  const explorer = `https://liteforge.explorer.caldera.xyz/address/${profile.address}`;
  const [usernameOpen, setUsernameOpen] = useState(false);

  const { data: username, refetch: refetchUsername } = useReadContract({
    address: ADDR.Usernames,
    abi: usernamesAbi,
    functionName: "usernameOf",
    args: [profile.address],
  });

  const displayName =
    username && typeof username === "string" && username.length > 0
      ? `@${username}`
      : shortAddress(profile.address);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-1.5 text-sm text-silver-400 transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Leaderboard
      </Link>

      {/* --- Identity header card --- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass relative mt-6 overflow-hidden rounded-3xl p-7"
      >
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent via-accent-violet to-accent-rose text-xl font-display font-bold text-ink-950 shadow-glow">
              {displayName.charAt(displayName.startsWith("@") ? 1 : 0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
                  {displayName}
                </h1>
                {isOwner && (
                  <button
                    onClick={() => setUsernameOpen(true)}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[11px] font-medium text-silver-300 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {username && (username as string).length > 0 ? (
                      <>
                        <Edit3 className="h-3 w-3" /> change
                      </>
                    ) : (
                      <>
                        <AtSign className="h-3 w-3" /> claim handle
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-silver-400">
                <code className="font-mono">{shortAddress(profile.address)}</code>
                <a
                  href={explorer}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-silver-500 transition-colors hover:text-accent"
                >
                  explorer <ExternalLink className="h-3 w-3" />
                </a>
                {profile.hasPass && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent ring-1 ring-accent/20">
                    LitPass #{profile.tokenId.toString()}
                  </span>
                )}
                {isOwner && (
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-silver-300 ring-1 ring-white/10">
                    you
                  </span>
                )}
              </div>
            </div>
          </div>

          {!profile.hasPass && (
            <Link
              href="/passport"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:scale-[1.02] hover:bg-accent-soft"
            >
              Mint passport
            </Link>
          )}
        </div>
      </motion.div>

      {profile.hasPass ? (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: passport + share (5 cols on large) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="flex justify-center lg:justify-start">
              <PassportCard
                tokenId={profile.tokenId}
                streak={profile.currentStreak}
                longest={profile.longestStreak}
                checkIns={profile.totalCheckIns}
              />
            </div>
            <ShareCard
              address={profile.address}
              tokenId={profile.tokenId}
              streak={profile.currentStreak}
            />
          </div>

          {/* Right: stats + sections (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat
                icon={<Flame className="h-3.5 w-3.5" />}
                label="Streak"
                value={`${profile.currentStreak}d`}
                color="text-accent-rose"
              />
              <Stat
                icon={<Trophy className="h-3.5 w-3.5" />}
                label="Best"
                value={`${profile.longestStreak}d`}
                color="text-accent-gold"
              />
              <Stat
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Total"
                value={profile.totalCheckIns.toString()}
                color="text-accent"
              />
              <Stat
                icon={<Users className="h-3.5 w-3.5" />}
                label="Refs"
                value={profile.referrals.toString()}
                color="text-accent-violet"
              />
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-silver-300">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-silver-400" />
                  <span>
                    Minted <span className="text-white">{formatRelative(profile.mintedAt)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-silver-400">
                  <span className="hidden sm:inline">·</span>
                  last seen{" "}
                  <span className="text-white">
                    {profile.lastCheckIn === 0 ? "never" : formatRelative(profile.lastCheckIn)}
                  </span>
                </div>
              </div>
            </div>

            <Section title="Badges" icon={<Award className="h-4 w-4" />} count={profile.badges.length}>
              {profile.badges.length === 0 ? (
                <EmptyState>
                  {isOwner ? (
                    <>
                      No badges yet.{" "}
                      <Link
                        href="/badges"
                        className="text-accent underline decoration-accent/50 underline-offset-4"
                      >
                        Claim some
                      </Link>
                    </>
                  ) : (
                    "No badges yet."
                  )}
                </EmptyState>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {profile.badges.map((b) => (
                    <Link
                      key={b.id}
                      href={`/p/${profile.address}/badge/streak/${b.id}`}
                      className="group flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.04]"
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full text-[10px] font-display font-bold transition-transform group-hover:scale-105"
                        style={{
                          background: `radial-gradient(circle, ${b.color}88 0%, ${b.color}22 60%, transparent 100%)`,
                          color: b.color,
                          boxShadow: `0 0 20px ${b.color}33`,
                        }}
                      >
                        {b.name.slice(0, 3).toUpperCase()}
                      </div>
                      <span className="text-center text-[11px] font-medium text-silver-200">{b.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </Section>

            <Section title="dApp stamps" icon={<Stamp className="h-4 w-4" />} count={profile.stamps.length}>
              {profile.stamps.length === 0 ? (
                <EmptyState>No stamps yet. Use other LitVM dApps to collect them.</EmptyState>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {profile.stamps.map((s) => (
                    <div key={s.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <div className="font-semibold text-white">{s.name}</div>
                      <div className="mt-1 text-xs text-silver-400">{s.description}</div>
                      <div className="mt-2 font-mono text-[10px] text-silver-500">
                        by {shortAddress(s.issuer)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {profile.referrer &&
              profile.referrer !== "0x0000000000000000000000000000000000000000" && (
                <div className="glass flex items-center justify-between rounded-xl px-5 py-3 text-sm">
                  <span className="text-silver-400">Invited by</span>
                  <Link
                    href={`/p/${profile.referrer}`}
                    className="font-mono text-silver-200 transition-colors hover:text-accent"
                  >
                    {shortAddress(profile.referrer)}
                  </Link>
                </div>
              )}
          </div>
        </div>
      ) : (
        <div className="mt-12 glass rounded-2xl p-12 text-center">
          <p className="text-silver-300">This wallet hasn&apos;t minted a LitPass yet.</p>
          {isOwner && (
            <Link
              href="/passport"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-semibold text-ink-950 shadow-glow transition-all hover:scale-[1.02] hover:bg-accent-soft"
            >
              Mint yours now
            </Link>
          )}
        </div>
      )}

      {isOwner && (
        <UsernameDialog
          open={usernameOpen}
          onClose={() => setUsernameOpen(false)}
          currentName={(username as string) ?? ""}
          onSuccess={() => refetchUsername()}
        />
      )}
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-silver-400 ${color}`}>
        {icon}
        <span className="text-silver-400">{label}</span>
      </div>
      <div className="mt-1.5 font-display text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          {icon}
          {title}
        </div>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-silver-300">{count}</span>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-silver-400">
      {children}
    </div>
  );
}
