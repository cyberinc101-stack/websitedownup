import type { Metadata } from "next";
import SavedPageClient from "@/components/SavedPageClient";
import { SITE_NAME } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Alerts/Saved \u2014 " + SITE_NAME,
  description: "Sites you have saved, with live status and optional down alerts.",
};

export default function SavedPage() {
  return <SavedPageClient />;
}