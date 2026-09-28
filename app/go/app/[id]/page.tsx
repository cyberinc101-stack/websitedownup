import { notFound } from "next/navigation";
import VisitInterstitial from "@/components/VisitInterstitial";

export const dynamic = "force-dynamic";

export default async function GoAppPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,15}$/.test(id)) notFound();
  return <VisitInterstitial label="the App Store" destination={"https://apps.apple.com/app/id" + id} />;
}