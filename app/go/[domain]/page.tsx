import { normalizeDomain } from "@/lib/checkSite";
import VisitInterstitial from "@/components/VisitInterstitial";

export const dynamic = "force-dynamic";

export default async function GoPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain: rawDomain } = await params;
  const domain = normalizeDomain(rawDomain);

  return <VisitInterstitial domain={domain} />;
}