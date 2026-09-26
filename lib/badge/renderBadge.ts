/**
 * Renders a small shields.io-style status badge as an SVG string.
 * Pure function, no data or security logic. CLIENT-SAFE.
 */

const CHAR_WIDTH = 6.5;
const PAD = 10;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textWidth(text: string): number {
  return Math.round(text.length * CHAR_WIDTH + PAD);
}

export function renderStatusBadge(label: string, status: "up" | "down" | "unknown"): string {
  const displayLabel = escapeXml(label.length > 28 ? label.slice(0, 25) + "..." : label);
  const statusText = status === "up" ? "up" : status === "down" ? "down" : "unknown";
  const color = status === "up" ? "#2ecc71" : status === "down" ? "#e74c3c" : "#9e9e9e";

  const leftWidth = textWidth(displayLabel);
  const rightWidth = textWidth(statusText);
  const totalWidth = leftWidth + rightWidth;

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + totalWidth + '" height="20" role="img" aria-label="' + displayLabel + ': ' + statusText + '">' +
    '<linearGradient id="s" x2="0" y2="100%">' +
    '<stop offset="0" stop-color="#bbb" stop-opacity=".1"/>' +
    '<stop offset="1" stop-opacity=".1"/>' +
    '</linearGradient>' +
    '<clipPath id="r"><rect width="' + totalWidth + '" height="20" rx="3" fill="#fff"/></clipPath>' +
    '<g clip-path="url(#r)">' +
    '<rect width="' + leftWidth + '" height="20" fill="#555"/>' +
    '<rect x="' + leftWidth + '" width="' + rightWidth + '" height="20" fill="' + color + '"/>' +
    '<rect width="' + totalWidth + '" height="20" fill="url(#s)"/>' +
    '</g>' +
    '<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">' +
    '<text x="' + leftWidth / 2 + '" y="14">' + displayLabel + '</text>' +
    '<text x="' + (leftWidth + rightWidth / 2) + '" y="14">' + statusText + '</text>' +
    '</g>' +
    '</svg>'
  );
}
