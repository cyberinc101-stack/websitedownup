import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — PulseCheck",
  description: "How PulseCheck handles data, cookies, and advertising.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 py-12">
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted mb-6">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="text-muted leading-relaxed space-y-5 text-sm sm:text-base">
        <p>
          This policy explains what happens when you use PulseCheck. It is a
          general-purpose template — replace the placeholders below with
          your own details before publishing.
        </p>

        <section>
          <h2 className="font-display text-lg font-bold text-ink mb-2">
            What we collect
          </h2>
          <p>
            When you check a domain, that domain name is sent to our server
            to perform the live check. We do not require an account and do
            not knowingly collect personal information through the checker
            itself. Standard server logs (such as IP address, browser type,
            and pages visited) may be recorded for security and reliability
            purposes.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink mb-2">
            Cookies and advertising
          </h2>
          <p>
            This site may display advertisements served by third-party
            advertising companies, including Google. These companies may use
            cookies or similar technologies to serve ads based on your prior
            visits to this and other websites. You can learn more about how
            Google uses data and manage your ad preferences at{" "}
            <a
              href="https://policies.google.com/technologies/ads"
              className="text-signal hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google&apos;s Ads Policy page
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink mb-2">
            Third-party links
          </h2>
          <p>
            Result pages reference third-party websites by domain name in
            order to report their status. We are not responsible for the
            content, policies, or practices of those third-party sites.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink mb-2">
            Contact
          </h2>
          <p>
            Questions about this policy can be sent to{" "}
            <span className="font-medium text-ink">[your contact email]</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
