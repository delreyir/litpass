import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 8,
          color: "#05070d",
          fontSize: 22,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: -1,
        }}
      >
        L
      </div>
    ),
    { ...size }
  );
}
