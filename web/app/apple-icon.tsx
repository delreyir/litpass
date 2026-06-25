import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 60%, #fb7185 100%)",
          color: "#05070d",
          fontSize: 120,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: -3,
        }}
      >
        L
      </div>
    ),
    { ...size }
  );
}
