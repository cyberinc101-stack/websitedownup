/**
 * GET /badge/worth/{domain} — embeddable "est. site value" badge (SVG).
 * All logic lives in lib/server/worthBadge.ts. Contains no secrets.
 */

import { worthBadgeResponse } from "@/lib/server/worthBadge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: Request, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  return worthBadgeResponse(request, domain, "worth");
}
