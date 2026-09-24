/**
 * Contact page. AdSense reviewers look for a way to reach the site owner,
 * alongside About and Privacy.
 * The address comes from lib/config/site.ts (NEXT_PUBLIC_CONTACT_EMAIL).
 * It's public by design, so no security concerns.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Contact \u2014 " + SITE_NAME,
  description: "Get in touch with the " + SITE_NAME + " team: report a wrong result, suggest a site, or ask a question.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink mb-3">Contact us</h1>
      <p className="text-muted leading-relaxed mb-8">
        Questions, feedback or a result that looks wrong? Email us and we&apos;ll get back to you.
      </p>

      <a
        href={"mailto:" + CONTACT_EMAIL}
        className="inline-flex items-center rounded-xl bg-signal px-5 py-3 font-semibold text-white hover:bg-signal-dark transition-colors"
      >
        {CONTACT_EMAIL}
      </a>

      <section className="mt-10 text-sm text-muted leading-relaxed space-y-4">
        <h2 className="font-display text-lg font-bold text-ink">What to include</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <span className="text-ink font-medium">Wrong result:</span> the domain, roughly
            when you checked, and what you expected to see.
          </li>
          <li>
            <span className="text-ink font-medium">Add a site:</span> the domain you&apos;d like
            listed on the homepage.
          </li>
          <li>
            <span className="text-ink font-medium">Your own site:</span> if you run a site and
            want to ask how we check it, include the domain.
          </li>
          <li>
            <span className="text-ink font-medium">Privacy requests:</span> see our{" "}
            <Link href="/privacy" className="text-signal hover:underline">privacy policy</Link> first,
            then email us with your request.
          </li>
        </ul>
      </section>
    </div>
  );
}
