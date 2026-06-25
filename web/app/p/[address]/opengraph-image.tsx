import { ImageResponse } from "next/og";
import { isAddress, getAddress } from "viem";
import { publicClient } from "@/lib/server";
import { ADDR, litPassAbi, usernamesAbi } from "@/lib/contracts";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = Promise<{ address: string }>;

export default async function OG({ params }: { params: Params }) {
  const { address } = await params;
  const safe = isAddress(address, { strict: false }) ? getAddress(address) : "0x0000000000000000000000000000000000000000";
  const shortAddr = `${safe.slice(0, 6)}…${safe.slice(-4)}`;

  type PassData = { tokenId: bigint; mintedAt: bigint; lastCheckIn: bigint; currentStreak: number; longestStreak: number; totalCheckIns: number };
  let pass: PassData | null = null;
  let username = "";
  if (isAddress(address, { strict: false })) {
    try {
      const [p, u] = await Promise.all([
        publicClient.readContract({
          address: ADDR.LitPass,
          abi: litPassAbi,
          functionName: "getPass",
          args: [safe],
        }),
        publicClient.readContract({
          address: ADDR.Usernames,
          abi: usernamesAbi,
          functionName: "usernameOf",
          args: [safe],
        }),
      ]);
      pass = p as PassData;
      username = (u as string) || "";
    } catch {
      pass = null;
    }
  }
  const hasPass = !!pass && pass.tokenId > 0n;
  const displayName = username ? `@${username}` : shortAddr;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #05070d 0%, #0b1020 50%, #111729 100%)",
          color: "#e6eaf3",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          padding: "70px 80px",
        }}
      >
        {/* aurora blobs */}
        <div
          style={{
            position: "absolute",
            display: "flex",
            top: -120,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: "rgba(34,211,238,0.30)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            display: "flex",
            bottom: -120,
            left: -120,
            width: 460,
            height: 460,
            borderRadius: 9999,
            background: "rgba(167,139,250,0.25)",
            filter: "blur(60px)",
          }}
        />

        {/* top brand bar */}
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
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5, display: "flex" }}>
            LitPass
          </div>
          <div style={{ marginLeft: 12, fontSize: 18, color: "#7c8aa8", display: "flex" }}>
            · LitVM passport
          </div>
        </div>

        {/* main content */}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
          {hasPass ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 28, color: "#7c8aa8", marginBottom: 8 }}>
                #{pass!.tokenId.toString()} · {shortAddr}
              </div>
              <div style={{ display: "flex", fontSize: 96, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>
                {displayName}
              </div>
              <div style={{ display: "flex", marginTop: 14, fontSize: 32, color: "#22d3ee" }}>
                {pass!.currentStreak}-day streak
              </div>
              <div style={{ marginTop: 40, display: "flex", gap: 64 }}>
                <Stat label="LONGEST STREAK" value={`${pass!.longestStreak}d`} />
                <Stat label="CHECK-INS" value={pass!.totalCheckIns.toString()} />
                <Stat label="TOKEN" value={`#${pass!.tokenId.toString()}`} />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 28, color: "#7c8aa8", marginBottom: 8 }}>
                {shortAddr}
              </div>
              <div style={{ display: "flex", fontSize: 80, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1 }}>
                No passport yet.
              </div>
              <div style={{ display: "flex", marginTop: 28, fontSize: 28, color: "#a4afc7" }}>
                Mint one. Daily streaks, badges, and stamps on LitVM.
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#566280", fontSize: 18 }}>
          <span style={{ display: "flex" }}>litpass.vercel.app</span>
          <span style={{ display: "flex" }}>chain 4441 · LiteForge</span>
        </div>
      </div>
    ),
    { ...size }
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: 14, color: "#7c8aa8", letterSpacing: 2, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#ffffff", lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}
