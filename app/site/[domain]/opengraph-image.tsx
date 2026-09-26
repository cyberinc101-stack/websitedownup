import { ImageResponse } from "next/og";
import { normalizeDomain } from "@/lib/checkSite";
import { getCachedBadgeStatus } from "@/lib/server/badgeStatus";
import { SITE_NAME } from "@/lib/config/site";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain: rawDomain } = await params;
  const domain = normalizeDomain(rawDomain);
  const result = await getCachedBadgeStatus(domain);
  const isUp = result.status === "up";
  const color = isUp ? "#2ecc71" : "#e74c3c";

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
        <div style={{ fontSize: 28, opacity: 0.7, marginBottom: 20 }}>{SITE_NAME}</div>
        <div style={{ fontSize: 56, fontWeight: 700, marginBottom: 28 }}>{domain}</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 44,
            fontWeight: 700,
            color,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              backgroundColor: color,
              display: "flex",
            }}
          />
          {isUp ? "UP" : "DOWN"}
        </div>
        {result.responseTimeMs !== null && (
          <div style={{ fontSize: 26, opacity: 0.6, marginTop: 20 }}>
            {result.responseTimeMs} ms response time
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
