import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — PulseCheck",
  description: "What PulseCheck is, how the live status checks work, and their limits.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 py-12 prose-content">
      <h1 className="font-display text-3xl font-bold text-ink mb-4">About PulseCheck</h1>
      <div className="text-muted leading-relaxed space-y-4">
        <p>
          PulseCheck is a small tool for one job: telling you whether a
          website is actually down, or just having trouble on your end.
          Type in any domain and we connect to it right then and report what
          happened.
        </p>
        <h2 className="font-display text-lg font-bold text-ink pt-2">How the check works</h2>
        <p>
          When you submit a domain, our server sends a request directly to
          that site and times how long it takes to respond. If we get a
          response, the site is marked &ldquo;up&rdquo; along with its
          response time and HTTP status code. If the request times out, the
          connection is refused, or the site&apos;s own server returns an
          error, we mark it &ldquo;down.&rdquo;
        </p>
        <h2 className="font-display text-lg font-bold text-ink pt-2">What it can&apos;t tell you</h2>
        <p>
          A check from our server reflects reachability from where our
          server sits on the internet at that moment — it can&apos;t see
          your specific connection, your ISP, or anything blocked by a local
          firewall. If PulseCheck says a site is up but it still
          won&apos;t load for you, the cause is more often local: a stale
          DNS cache, a network block, or a browser issue. Each site&apos;s
          page includes a short troubleshooting list for exactly that
          situation.
        </p>
        <h2 className="font-display text-lg font-bold text-ink pt-2">Independence</h2>
        <p>
          PulseCheck is not affiliated with, sponsored by, or endorsed by
          any of the websites it checks. All trademarks and site names
          belong to their respective owners and are used only to identify
          which site is being checked.
        </p>
      </div>
    </div>
  );
}
