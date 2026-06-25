"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ExternalLink, Award, Stamp, Users, Flame, Trophy, Calendar, ArrowLeft } from "lucide-react";
import { PassportCard } from "@/components/PassportCard";
import { ShareCard } from "@/components/profile/ShareCard";
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

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <Link href="/leaderboard" className="inline-flex items-center gap-1.5 text-sm text-silver-400 transition-colors hover:text-accent">
        <ArrowLeft className="h-3.5 w-3.5" /> Leaderboard
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-4 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {profile.hasPass ? (
              <>LitPass <span className="text-gradient">#{profile.tokenId.toString()}</span></>
            ) : (
              <span className="text-silver-300">No passport yet</span>
            )}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-silver-400">
            <code className="font-mono text-sm">{shortAddress(profile.address)}</code>
            <a href={explorer} target="_blank" rel="noreferrer" className="text-silver-500 hover:text-accent">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {isOwner && (
              <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent ring-1 ring-accent/20">
                you
              </span>
            )}
          </div>
        </div>

        {!profile.hasPass && (
          <Link
            href="/passport"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:scale-[1.02] hover:bg-accent-soft"
          >
            Mint your passport
          </Link>
        )}
      </motion.div>

      {profile.hasPass ? (
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[auto_1fr]">
          {/* Left column: passport card + share */}
          <div className="space-y-6">
            <PassportCard
              tokenId={profile.tokenId}
              streak={profile.currentStreak}
              longest={profile.longestStreak}
              checkIns={profile.totalCheckIns}
            />
            <ShareCard address={profile.address} tokenId={profile.tokenId} streak={profile.currentStreak} />
          </div>

          {/* Right column: stats, badges, stamps, referrals */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatTile icon={<Flame className="h-4 w-4 text-accent-rose" />} label="Current streak" value={`${profile.currentStreak}d`} />
              <StatTile icon={<Trophy className="h-4 w-4 text-accent-gold" />} label="Longest" value={`${profile.longestStreak}d`} />
              <StatTile icon={<Calendar className="h-4 w-4 text-accent" />} label="Check-ins" value={profile.totalCheckIns.toString()} />
              <StatTile icon={<Users className="h-4 w-4 text-accent-violet" />} label="Referrals" value={profile.referrals.toString()} />
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 text-sm text-silver-300">
                <Calendar className="h-4 w-4 text-silver-400" />
                Minted {formatRelative(profile.mintedAt)} · last seen {profile.lastCheckIn === 0 ? "never" : formatRelative(profile.lastCheckIn)}
              </div>
            </div>

            {/* Badges */}
            <Section title="Achievement badges" icon={<Award className="h-4 w-4" />} count={profile.badges.length}>
              {profile.badges.length === 0 ? (
                <EmptyState>
                  {isOwner ? (
                    <>
                      No badges yet. <Link href="/badges" className="text-accent underline decoration-accent/50 underline-offset-4">View badges</Link>
                    </>
                  ) : (
                    "No badges yet."
                  )}
                </EmptyState>
              ) : (
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
                  {profile.badges.map((b) => (
                    <div key={b.id} className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/5 p-4">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-full text-xs font-display font-bold"
                        style={{
                          background: `radial-gradient(circle, ${b.color}88 0%, ${b.color}22 60%, transparent 100%)`,
                          color: b.color,
                          boxShadow: `0 0 24px ${b.color}33`,
                        }}
                      >
                        {b.name.slice(0, 3).toUpperCase()}
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-white">{b.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Stamps */}
            <Section title="dApp stamps" icon={<Stamp className="h-4 w-4" />} count={profile.stamps.length}>
              {profile.stamps.length === 0 ? (
                <EmptyState>No stamps yet. Use other LitVM dApps to collect them.</EmptyState>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {profile.stamps.map((s) => (
                    <div key={s.id} className="rounded-xl border border-white/5 bg-white/5 p-4">
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

            {/* Referrer chip */}
            {profile.referrer && profile.referrer !== "0x0000000000000000000000000000000000000000" && (
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
    </section>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-silver-400">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function Section({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-6">
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
  return <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-silver-400">{children}</div>;
}
