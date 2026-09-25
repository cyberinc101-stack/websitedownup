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
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink mb-3">Contact Us</h1>
      <p className="text-muted leading-relaxed mb-8">
        We welcome questions, feedback, and correspondence regarding {SITE_NAME}.
        For all inquiries, including reports of inaccurate results, business
        correspondence, or general questions about our service, please reach
        us using the information below.
      </p>

      <div className="rounded-xl border border-line bg-surface p-5 sm:p-6 mb-10">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted mb-2">
          Email
        </h2>
        
          href={"mailto:" + CONTACT_EMAIL}
          className="inline-flex items-center rounded-xl bg-signal px-5 py-3 font-semibold text-white hover:bg-signal-dark transition-colors"
        >
          {CONTACT_EMAIL}
        </a>
        <p className="text-xs text-muted mt-3">
          We aim to respond to all correspondence within two to three
          business days.
        </p>
      </div>

      <section className="text-sm text-muted leading-relaxed space-y-4">
        <h2 className="font-display text-lg font-bold text-ink">
          When contacting us, please include
        </h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <span className="text-ink font-medium">Inaccurate result:</span> the
            domain in question, the approximate date and time you checked it,
            and the result you expected to see.
          </li>
          <li>
            <span className="text-ink font-medium">Site suggestion:</span> the
            domain you would like added to our homepage listing.
          </li>
          <li>
            <span className="text-ink font-medium">Site owner inquiry:</span> if
            you operate a website and have questions about how we perform our
            checks, please include your domain for reference.
          </li>
          <li>
            <span className="text-ink font-medium">Privacy-related requests:</span>{" "}
            please review our{" "}
            <Link href="/privacy" className="text-signal hover:underline">Privacy Policy</Link>{" "}
            beforehand, then submit your request by email.
          </li>
        </ul>
        <p>
          {SITE_NAME} is an independently operated service. We do not offer
          telephone support at this time; email remains the fastest and most
          reliable way to reach our team.
        </p>
      </section>
    </div>
  );
}