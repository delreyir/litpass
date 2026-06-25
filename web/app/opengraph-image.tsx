import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "LitPass - Soulbound passport for LitVM";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          background: "linear-gradient(135deg, #05070d 0%, #0b1020 50%, #111729 100%)",
          color: "#e6eaf3",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
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
            background: "rgba(34,211,238,0.35)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            display: "flex",
            bottom: -150,
            left: -150,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: "rgba(167,139,250,0.30)",
            filter: "blur(60px)",
          }}
        />

        {/* brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "linear-gradient(135deg, #22d3ee, #a78bfa, #fb7185)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 800,
              color: "#05070d",
            }}
          >
            L
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.5, display: "flex" }}>
            LitPass
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 22, color: "#22d3ee", letterSpacing: 4, marginBottom: 18 }}>
            LIVE ON LITVM LITEFORGE
          </div>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>
            Your identity on
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1,
              marginTop: 6,
              backgroundImage: "linear-gradient(90deg, #ffffff 0%, #67e8f9 40%, #a78bfa 80%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Litecoin's first EVM L2.
          </div>
          <div style={{ display: "flex", marginTop: 32, fontSize: 28, color: "#a4afc7", maxWidth: 900 }}>
            Soulbound passports. Daily streaks. 23 on-chain badges. Cross-dApp stamps.
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#566280", fontSize: 18 }}>
          <span style={{ display: "flex" }}>litpass.vercel.app</span>
          <span style={{ display: "flex" }}>chain 4441 - zkLTC</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
