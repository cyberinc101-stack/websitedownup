import { SITE_NAME } from "@/lib/config/site";

const FAQS = [
  {
    q: "Why does a site show up here but won't load for me?",
    a: `We connect to the site from our own servers at the moment you check. If it responds there, the fault is more likely your connection, DNS, or a local network/ISP block rather than the site itself.`,
  },
  {
    q: "How often are the top sites re-checked?",
    a: `Every couple of minutes. We poll the top sites we track continuously and raise an outage alert the moment one of the top 50 stops responding.`,
  },
  {
    q: `What counts as "down" on ${SITE_NAME}?`,
    a: `Either our server couldn't establish a connection at all, or the site's own server returned an error response. Both are reported as down.`,
  },
  {
    q: "Do you store what I search?",
    a: `We log recent checks to power the live activity feed, but we don't tie searches to individual visitors or require an account to use the checker.`,
  },
];

export default function FaqSection() {
  return (
    <section className="mt-10 max-w-2xl">
      <h2 className="font-display text-lg font-bold text-ink mb-4">
        Frequently asked questions
      </h2>
      <div className="space-y-5">
        {FAQS.map((item) => (
          <div key={item.q}>
            <h3 className="font-display text-sm font-semibold text-ink mb-1">
              {item.q}
            </h3>
            <p className="text-sm text-muted leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}