import { NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import { isAddress, getAddress } from "viem";
import { ADDR } from "@/lib/contracts";
import { BADGE_CATALOG, getActivityMetrics, measuredValueForBadge } from "@/lib/activity";
import { litvmTestnet } from "@/lib/chain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNER_KEY = process.env.ATTESTATION_SIGNER_KEY as `0x${string}` | undefined;

const DOMAIN = {
  name: "LitPass.ActivityBadges",
  version: "1",
  chainId: litvmTestnet.id,
  verifyingContract: ADDR.ActivityBadges,
} as const;

const TYPES = {
  Claim: [
    { name: "user", type: "address" },
    { name: "badgeId", type: "uint256" },
    { name: "measuredValue", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "expiresAt", type: "uint256" },
  ],
} as const;

const VALIDITY_SECONDS = 30 * 60; // 30 minutes

export async function POST(req: NextRequest) {
  try {
    if (!SIGNER_KEY) {
      return NextResponse.json({ error: "Server not configured: ATTESTATION_SIGNER_KEY missing" }, { status: 500 });
    }
    if (!ADDR.ActivityBadges) {
      return NextResponse.json({ error: "ActivityBadges contract not deployed" }, { status: 500 });
    }

    const body = await req.json();
    const { address: rawAddress, badgeId } = body as { address?: string; badgeId?: number };

    if (!rawAddress || !isAddress(rawAddress)) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }
    if (!badgeId || !BADGE_CATALOG[badgeId]) {
      return NextResponse.json({ error: "Unknown badge id" }, { status: 400 });
    }

    const user = getAddress(rawAddress);
    const metrics = await getActivityMetrics(user);
    const measuredValue = measuredValueForBadge(badgeId, metrics);
    const info = BADGE_CATALOG[badgeId];

    if (measuredValue < info.threshold) {
      return NextResponse.json({
        ok: false,
        eligible: false,
        measuredValue,
        threshold: info.threshold,
        metric: info.name,
        metrics,
      });
    }

    const nonce = Math.floor(Date.now() / 1000) ^ Math.floor(Math.random() * 0xffffffff);
    const expiresAt = Math.floor(Date.now() / 1000) + VALIDITY_SECONDS;

    const account = privateKeyToAccount(SIGNER_KEY);
    const signature = await account.signTypedData({
      domain: DOMAIN,
      types: TYPES,
      primaryType: "Claim",
      message: {
        user,
        badgeId: BigInt(badgeId),
        measuredValue: BigInt(measuredValue),
        nonce: BigInt(nonce),
        expiresAt: BigInt(expiresAt),
      },
    });

    return NextResponse.json({
      ok: true,
      eligible: true,
      claim: {
        badgeId,
        measuredValue,
        nonce,
        expiresAt,
        signature,
      },
      metrics,
      threshold: info.threshold,
      signer: account.address,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Convenience: GET /api/attest?address=0x... → returns metrics only (no signature)
  const address = req.nextUrl.searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "Provide ?address=0x..." }, { status: 400 });
  }
  try {
    const metrics = await getActivityMetrics(getAddress(address));
    return NextResponse.json({ address: getAddress(address), metrics });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
