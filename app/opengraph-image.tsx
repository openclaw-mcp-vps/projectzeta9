import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0d1117",
          color: "#e5edf8",
          padding: "64px",
          fontFamily: "sans-serif",
          border: "1px solid #1e293b",
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#67e8f9",
          }}
        >
          ProjectZeta9
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.05 }}>
            Milestone tracking and deadline alerts for engineering teams.
          </div>
          <div style={{ fontSize: 30, color: "#94a6c3" }}>
            Spot blockers early across GitHub, Linear, and Notion.
          </div>
        </div>
        <div style={{ fontSize: 28, color: "#38bdf8" }}>$15/mo • Micro SaaS</div>
      </div>
    ),
    {
      ...size,
    },
  );
}
