import { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAddress, getAddress } from "viem";
import { publicClient } from "@/lib/server";
import { ADDR, litPassAbi, badgesAbi, referralAbi, stampsAbi } from "@/lib/contracts";
import { ProfileClient } from "@/components/profile/ProfileClient";

type Params = Promise<{ address: string }>;

async function loadProfile(rawAddress: string) {
  if (!isAddress(rawAddress)) return null;
  const address = getAddress(rawAddress);

  const [hasPass, pass, badgeCount, referrals, referrer] = await Promise.all([
    publicClient.readContract({
      address: ADDR.LitPass,
      abi: litPassAbi,
      functionName: "hasPass",
      args: [address],
    }),
    publicClient.readContract({
      address: ADDR.LitPass,
      abi: litPassAbi,
      functionName: "getPass",
      args: [address],
    }),
    publicClient.readContract({
      address: ADDR.AchievementBadges,
      abi: badgesAbi,
      functionName: "badgeCount",
    }),
    publicClient.readContract({
      address: ADDR.ReferralTracker,
      abi: referralAbi,
      functionName: "referralsOf",
      args: [address],
    }),
    publicClient.readContract({
      address: ADDR.ReferralTracker,
      abi: referralAbi,
      functionName: "referrerOf",
      args: [address],
    }),
  ]);

  const badgeIds = Array.from({ length: Number(badgeCount) }, (_, i) => BigInt(i + 1));
  let ownedBadges: { id: bigint; name: string; color: string; description: string }[] = [];
  if (hasPass && badgeIds.length > 0) {
    const balances = await Promise.all(
      badgeIds.map((id) =>
        publicClient.readContract({
          address: ADDR.AchievementBadges,
          abi: badgesAbi,
          functionName: "balanceOf",
          args: [address, id],
        })
      )
    );
    const owned = badgeIds.filter((_, i) => (balances[i] as bigint) > 0n);
    if (owned.length > 0) {
      const metas = await Promise.all(
        owned.map((id) =>
          publicClient.readContract({
            address: ADDR.AchievementBadges,
            abi: badgesAbi,
            functionName: "badges",
            args: [id],
          })
        )
      );
      ownedBadges = owned.map((id, i) => {
        const m = metas[i] as readonly [string, string, string, number, number, boolean];
        return { id, name: m[0], description: m[1], color: m[2] };
      });
    }
  }

  // Stamps (open list, may include revoked entries; filter via holds())
  let activeStamps: { id: `0x${string}`; name: string; description: string; issuer: `0x${string}` }[] = [];
  if (hasPass) {
    const ids = (await publicClient.readContract({
      address: ADDR.StampRegistry,
      abi: stampsAbi,
      functionName: "userStamps",
      args: [address],
    })) as readonly `0x${string}`[];

    if (ids.length > 0) {
      const [holds, metas] = await Promise.all([
        Promise.all(
          ids.map((id) =>
            publicClient.readContract({
              address: ADDR.StampRegistry,
              abi: stampsAbi,
              functionName: "holds",
              args: [id, address],
            })
          )
        ),
        Promise.all(
          ids.map((id) =>
            publicClient.readContract({
              address: ADDR.StampRegistry,
              abi: stampsAbi,
              functionName: "stamps",
              args: [id],
            })
          )
        ),
      ]);
      activeStamps = ids
        .map((id, i) => ({ id, holds: holds[i] as boolean, meta: metas[i] as readonly [string, string, string, string, boolean] }))
        .filter((s) => s.holds && s.meta[4])
        .map(({ id, meta }) => ({ id, issuer: meta[0] as `0x${string}`, name: meta[1], description: meta[2] }));
    }
  }

  return {
    address,
    hasPass: hasPass as boolean,
    tokenId: (pass as { tokenId: bigint }).tokenId,
    mintedAt: Number((pass as { mintedAt: bigint }).mintedAt),
    lastCheckIn: Number((pass as { lastCheckIn: bigint }).lastCheckIn),
    currentStreak: Number((pass as { currentStreak: number }).currentStreak),
    longestStreak: Number((pass as { longestStreak: number }).longestStreak),
    totalCheckIns: Number((pass as { totalCheckIns: number }).totalCheckIns),
    badges: ownedBadges.map((b) => ({ id: Number(b.id), name: b.name, description: b.description, color: b.color })),
    stamps: activeStamps,
    referrals: Number(referrals),
    referrer: referrer as `0x${string}`,
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { address } = await params;
  if (!isAddress(address)) return { title: "LitPass · Profile" };
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

  const profile = await loadProfile(address).catch(() => null);
  const description = profile?.hasPass
    ? `LitPass #${profile.tokenId} · ${profile.currentStreak}-day streak · ${profile.totalCheckIns} check-ins · ${profile.badges.length} badges`
    : "Soulbound passport for LitVM. Mint yours, check in daily, earn badges.";

  return {
    title: `${short} · LitPass profile`,
    description,
    openGraph: {
      title: `${short} · LitPass`,
      description,
      type: "profile",
      images: [`/p/${address}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${short} · LitPass`,
      description,
      images: [`/p/${address}/opengraph-image`],
    },
  };
}

export default async function ProfilePage({ params }: { params: Params }) {
  const { address } = await params;
  if (!isAddress(address)) notFound();
  const profile = await loadProfile(address);
  if (!profile) notFound();

  return <ProfileClient profile={profile} />;
}
