import { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAddress, getAddress } from "viem";
import { publicClient } from "@/lib/server";
import { ADDR, litPassAbi, badgesAbi, activityBadgesAbi, referralAbi, stampsAbi } from "@/lib/contracts";
import { ProfileClient } from "@/components/profile/ProfileClient";

type Params = Promise<{ address: string }>;

async function loadProfile(rawAddress: string) {
  if (!isAddress(rawAddress, { strict: false })) return null;
  const address = getAddress(rawAddress);

  const [hasPass, pass, streakBadgeCount, activityBadgeCount, referrals, referrer] = await Promise.all([
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
      address: ADDR.ActivityBadges,
      abi: activityBadgesAbi,
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

  type OwnedBadge = { id: number; family: "streak" | "activity"; name: string; description: string; color: string };
  const owned: OwnedBadge[] = [];

  if (hasPass) {
    // Streak badges (AchievementBadges)
    const streakIds = Array.from({ length: Number(streakBadgeCount) }, (_, i) => BigInt(i + 1));
    if (streakIds.length > 0) {
      const balances = await Promise.all(
        streakIds.map((id) =>
          publicClient.readContract({
            address: ADDR.AchievementBadges,
            abi: badgesAbi,
            functionName: "balanceOf",
            args: [address, id],
          })
        )
      );
      const heldIds = streakIds.filter((_, i) => (balances[i] as bigint) > 0n);
      if (heldIds.length > 0) {
        const metas = await Promise.all(
          heldIds.map((id) =>
            publicClient.readContract({
              address: ADDR.AchievementBadges,
              abi: badgesAbi,
              functionName: "badges",
              args: [id],
            })
          )
        );
        heldIds.forEach((id, i) => {
          const m = metas[i] as readonly [string, string, string, number, number, boolean];
          owned.push({
            id: Number(id),
            family: "streak",
            name: m[0],
            description: m[1],
            color: m[2],
          });
        });
      }
    }

    // Activity badges (ActivityBadges)
    const actIds = Array.from({ length: Number(activityBadgeCount) }, (_, i) => BigInt(i + 1));
    if (actIds.length > 0) {
      const balances = await Promise.all(
        actIds.map((id) =>
          publicClient.readContract({
            address: ADDR.ActivityBadges,
            abi: activityBadgesAbi,
            functionName: "balanceOf",
            args: [address, id],
          })
        )
      );
      const heldIds = actIds.filter((_, i) => (balances[i] as bigint) > 0n);
      if (heldIds.length > 0) {
        const metas = await Promise.all(
          heldIds.map((id) =>
            publicClient.readContract({
              address: ADDR.ActivityBadges,
              abi: activityBadgesAbi,
              functionName: "badges",
              args: [id],
            })
          )
        );
        heldIds.forEach((id, i) => {
          const m = metas[i] as readonly [string, string, string, number, number | bigint, boolean];
          owned.push({
            id: Number(id),
            family: "activity",
            name: m[0],
            description: m[1],
            color: m[2],
          });
        });
      }
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
    badges: owned,
    stamps: activeStamps,
    referrals: Number(referrals),
    referrer: referrer as `0x${string}`,
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { address } = await params;
  if (!isAddress(address, { strict: false })) return { title: "LitPass · Profile" };
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
  if (!isAddress(address, { strict: false })) notFound();
  const profile = await loadProfile(address);
  if (!profile) notFound();

  return <ProfileClient profile={profile} />;
}
