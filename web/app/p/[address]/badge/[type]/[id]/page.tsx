import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAddress, getAddress } from "viem";
import { publicClient } from "@/lib/server";
import { ADDR, badgesAbi, activityBadgesAbi, litPassAbi } from "@/lib/contracts";
import { ArrowRight, ArrowLeft, Trophy } from "lucide-react";
import { shortAddress } from "@/lib/utils";

type Params = Promise<{ address: string; type: string; id: string }>;

type BadgeMeta = {
  name: string;
  description: string;
  color: string;
  family: "streak" | "activity";
};

async function loadBadge(address: `0x${string}`, type: "streak" | "activity", badgeId: bigint) {
  const contract = type === "activity" ? ADDR.ActivityBadges : ADDR.AchievementBadges;
  const abi = type === "activity" ? activityBadgesAbi : badgesAbi;

  const [meta, balance, pass] = await Promise.all([
    publicClient
      .readContract({ address: contract, abi, functionName: "badges", args: [badgeId] })
      .catch(() => null),
    publicClient
      .readContract({ address: contract, abi, functionName: "balanceOf", args: [address, badgeId] })
      .catch(() => 0n),
    publicClient
      .readContract({ address: ADDR.LitPass, abi: litPassAbi, functionName: "getPass", args: [address] })
      .catch(() => null),
  ]);

  if (!meta) return null;
  // meta tuple shape:
  // streak  : [name, desc, color, metric(uint8), threshold(uint32), exists]
  // activity: [name, desc, color, activity(uint8), threshold(uint256), exists]
  const tuple = meta as readonly [string, string, string, number, number | bigint, boolean];
  if (!tuple[5]) return null;

  return {
    name: tuple[0],
    description: tuple[1],
    color: tuple[2],
    threshold: typeof tuple[4] === "bigint" ? Number(tuple[4]) : tuple[4],
    family: type,
    owned: (balance as bigint) > 0n,
    pass: pass as { tokenId: bigint; currentStreak: number; totalCheckIns: number } | null,
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { address, type, id } = await params;
  if (!isAddress(address)) return { title: "LitPass · Badge" };
  if (type !== "streak" && type !== "activity") return { title: "LitPass · Badge" };

  const data = await loadBadge(getAddress(address), type, BigInt(id)).catch(() => null);
  const short = shortAddress(address);
  const title = data ? `${data.name} · ${short}` : `Badge · ${short}`;
  const description = data
    ? `${short} earned the ${data.name} badge on LitPass. ${data.description}`
    : "Earn soulbound badges on LitVM with LitPass.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [`/p/${address}/badge/${type}/${id}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/p/${address}/badge/${type}/${id}/opengraph-image`],
    },
  };
}

export default async function BadgeSharePage({ params }: { params: Params }) {
  const { address, type, id } = await params;
  if (!isAddress(address)) notFound();
  if (type !== "streak" && type !== "activity") {
    redirect(`/p/${address}`);
  }
  const data = await loadBadge(getAddress(address), type as "streak" | "activity", BigInt(id));
  if (!data) notFound();

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <Link href={`/p/${address}`} className="inline-flex items-center gap-1.5 text-sm text-silver-400 transition-colors hover:text-accent">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to profile
      </Link>

      <div className="glass relative mt-6 overflow-hidden rounded-3xl p-10 text-center">
        <div
          className="absolute -right-10 -top-10 h-64 w-64 rounded-full blur-3xl"
          style={{ background: data.color, opacity: 0.3 }}
        />
        <div className="relative">
          <div className="flex justify-center">
            <div
              className="relative flex h-36 w-36 items-center justify-center rounded-full"
              style={{
                background: `radial-gradient(circle, ${data.color}88 0%, ${data.color}22 60%, transparent 100%)`,
                boxShadow: `0 0 60px ${data.color}55`,
              }}
            >
              <div
                className="flex h-28 w-28 items-center justify-center rounded-full border-2"
                style={{ borderColor: data.color, background: "rgba(11,16,32,0.7)" }}
              >
                <span className="font-display text-xl font-bold" style={{ color: data.color }}>
                  {data.name}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-widest text-silver-300">
            <Trophy className="h-3 w-3" />
            {data.family} badge
          </div>

          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">{data.name}</h1>
          <p className="mt-3 text-silver-300">{data.description}</p>

          <div className="mt-2 font-mono text-xs text-silver-400">
            owned by{" "}
            <Link href={`/p/${address}`} className="text-accent hover:underline">
              {shortAddress(address)}
            </Link>
          </div>

          {data.owned ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent ring-1 ring-accent/20">
              ✓ Verified on-chain
            </div>
          ) : (
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-silver-400">
              Not yet claimed
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/passport"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-semibold text-ink-950 shadow-glow transition-all hover:scale-[1.02] hover:bg-accent-soft"
            >
              Mint your passport
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/badges"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 font-semibold text-silver-100 transition-colors hover:bg-white/10"
            >
              See all badges
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
