import { ImageResponse } from "next/og";
import { isAddress, getAddress } from "viem";
import { publicClient } from "@/lib/server";
import { ADDR, badgesAbi, activityBadgesAbi, litPassAbi } from "@/lib/contracts";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "LitPass achievement badge";

type Params = Promise<{ address: string; type: string; id: string }>;

export default async function OG({ params }: { params: Params }) {
  const { address, type, id } = await params;
  const safe = isAddress(address) ? getAddress(address) : "0x0000000000000000000000000000000000000000";
  const short = `${safe.slice(0, 6)}…${safe.slice(-4)}`;
  const isActivity = type === "activity";

  let badge: { name: string; description: string; color: string; threshold: number } | null = null;
  let pass: { tokenId: bigint; currentStreak: number; totalCheckIns: number } | null = null;

  try {
    const contract = isActivity ? ADDR.ActivityBadges : ADDR.AchievementBadges;
    const abi = isActivity ? activityBadgesAbi : badgesAbi;
    const [metaRes, passRes] = await Promise.all([
      publicClient.readContract({ address: contract, abi, functionName: "badges", args: [BigInt(id)] }),
      isAddress(address)
        ? publicClient.readContract({ address: ADDR.LitPass, abi: litPassAbi, functionName: "getPass", args: [safe] })
        : Promise.resolve(null),
    ]);
    const tuple = metaRes as readonly [string, string, string, number, number | bigint, boolean];
    if (tuple[5]) {
      badge = {
        name: tuple[0],
        description: tuple[1],
        color: tuple[2],
        threshold: typeof tuple[4] === "bigint" ? Number(tuple[4]) : tuple[4],
      };
    }
    if (passRes) {
      pass = passRes as { tokenId: bigint; currentStreak: number; totalCheckIns: number };
    }
  } catch {
    badge = null;
  }

  const color = badge?.color ?? "#22d3ee";
  const name = badge?.name ?? "Badge";
  const description = badge?.description ?? "Soulbound badge on LitVM.";

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
          padding: "60px 70px",
        }}
      >
        {/* aurora using badge color */}
        <div
          style={{
            position: "absolute",
            display: "flex",
            top: -180,
            right: -180,
            width: 700,
            height: 700,
            borderRadius: 9999,
            background: color,
            opacity: 0.3,
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            display: "flex",
            bottom: -180,
            left: -180,
            width: 540,
            height: 540,
            borderRadius: 9999,
            background: "rgba(167,139,250,0.22)",
            filter: "blur(80px)",
          }}
        />

        {/* top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, #22d3ee, #a78bfa, #fb7185)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 800,
                color: "#05070d",
              }}
            >
              L
            </div>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>LitPass</div>
            <div
              style={{
                display: "flex",
                marginLeft: 12,
                padding: "4px 12px",
                borderRadius: 9999,
                fontSize: 14,
                color: color,
                background: `${color}22`,
                border: `1px solid ${color}55`,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {isActivity ? "Activity badge" : "Streak badge"}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 18, color: "#7c8aa8", fontFamily: "ui-monospace, monospace" }}>
            {short}
          </div>
        </div>

        {/* main: badge medallion + name */}
        <div style={{ display: "flex", flexGrow: 1, alignItems: "center", justifyContent: "space-between", gap: 60 }}>
          {/* medallion */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 320,
              height: 320,
              borderRadius: 9999,
              background: `radial-gradient(circle at center, ${color}AA 0%, ${color}33 50%, transparent 80%)`,
              flexShrink: 0,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 220,
                height: 220,
                borderRadius: 9999,
                background: "rgba(11,16,32,0.85)",
                border: `2px solid ${color}`,
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 60px ${color}55`,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ display: "flex", fontSize: 56, fontWeight: 800, color: color, lineHeight: 1, letterSpacing: -1 }}>
                  {name}
                </div>
              </div>
            </div>
          </div>

          {/* label */}
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <div style={{ display: "flex", fontSize: 24, color: "#a4afc7", marginBottom: 8 }}>just earned</div>
            <div
              style={{
                display: "flex",
                fontSize: 92,
                fontWeight: 800,
                letterSpacing: -2,
                lineHeight: 1.02,
                color: "#ffffff",
              }}
            >
              {name}
            </div>
            <div style={{ display: "flex", fontSize: 24, marginTop: 18, color: "#cdd4e3", maxWidth: 560 }}>
              {description}
            </div>

            {/* stats row, only when we have pass data */}
            {pass ? (
              <div style={{ display: "flex", gap: 40, marginTop: 30 }}>
                <Stat label="PASSPORT"  value={`#${pass.tokenId.toString()}`} color={color} />
                <Stat label="STREAK"    value={`${pass.currentStreak}d`}        color={color} />
                <Stat label="CHECK-INS" value={pass.totalCheckIns.toString()}   color={color} />
              </div>
            ) : null}
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#566280", fontSize: 16 }}>
          <span style={{ display: "flex" }}>litpass.vercel.app/p/{short}</span>
          <span style={{ display: "flex" }}>chain 4441 · LiteForge</span>
        </div>
      </div>
    ),
    { ...size }
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: 13, color: "#7c8aa8", letterSpacing: 2, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}
