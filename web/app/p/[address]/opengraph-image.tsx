import { ImageResponse } from "next/og";
import { isAddress, getAddress } from "viem";
import { publicClient } from "@/lib/server";
import { ADDR, litPassAbi } from "@/lib/contracts";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = Promise<{ address: string }>;

export default async function OG({ params }: { params: Params }) {
  const { address } = await params;
  const safe = isAddress(address) ? getAddress(address) : "0x0000000000000000000000000000000000000000";
  const short = `${safe.slice(0, 6)}…${safe.slice(-4)}`;

  type PassData = { tokenId: bigint; mintedAt: bigint; lastCheckIn: bigint; currentStreak: number; longestStreak: number; totalCheckIns: number };
  let pass: PassData | null = null;
  if (isAddress(address)) {
    try {
      const p = await publicClient.readContract({
        address: ADDR.LitPass,
        abi: litPassAbi,
        functionName: "getPass",
        args: [safe],
      });
      pass = p as PassData;
    } catch {
      pass = null;
    }
  }
  const hasPass = !!pass && pass.tokenId > 0n;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #05070d 0%, #0b1020 50%, #111729 100%)",
          color: "#e6eaf3",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* aurora blob */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(34,211,238,0.35) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -120,
            width: 460,
            height: 460,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(167,139,250,0.30) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "70px 80px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "linear-gradient(135deg, #22d3ee, #a78bfa, #fb7185)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: 800,
                color: "#05070d",
              }}
            >
              L
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
              Lit<span style={{ color: "#22d3ee" }}>Pass</span>
            </div>
            <div style={{ marginLeft: 12, fontSize: 18, color: "#7c8aa8" }}>· LitVM passport</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {hasPass ? (
              <>
                <div style={{ fontSize: 28, color: "#7c8aa8", marginBottom: 8 }}>
                  #{pass!.tokenId.toString()}  ·  {short}
                </div>
                <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>
                  {pass!.currentStreak}-day streak
                </div>
                <div style={{ marginTop: 32, display: "flex", gap: 64 }}>
                  <Stat label="LONGEST STREAK" value={`${pass!.longestStreak}d`} />
                  <Stat label="CHECK-INS"      value={pass!.totalCheckIns.toString()} />
                  <Stat label="TOKEN"          value={`#${pass!.tokenId.toString()}`} />
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 28, color: "#7c8aa8", marginBottom: 8 }}>{short}</div>
                <div style={{ fontSize: 80, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1 }}>
                  No passport yet.
                </div>
                <div style={{ marginTop: 28, fontSize: 28, color: "#a4afc7" }}>
                  Mint one — daily streaks, badges, and stamps on LitVM.
                </div>
              </>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#566280", fontSize: 18 }}>
            <span>litpass.vercel.app</span>
            <span>chain 4441 · LiteForge</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 14, color: "#7c8aa8", letterSpacing: 2, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 44, fontWeight: 700, color: "#ffffff", lineHeight: 1 }}>{value}</div>
    </div>
  );
}
