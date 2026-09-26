import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/config/site";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b0f14",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700 }}>{SITE_NAME}</div>
        <div style={{ fontSize: 28, opacity: 0.7, marginTop: 20 }}>
          Check if any website is down — live, in seconds
        </div>
      </div>
    ),
    { ...size }
  );
}
