import { SITE_NAME } from "@/lib/config/site";

const FAQS = [
  {
    q: "Why does a site show up here but won't load for me?",
    a: `We connect to the site from our own servers at the moment you check. If it responds there, the fault is more likely your connection, DNS, or a local network/ISP block rather than the site itself.`,
  },
  {
    q: "How often are the top sites re-checked?",
    a: `Every couple of minutes. We poll the sites we track continuously and raise an outage alert the moment one of the top 50 stops responding.`,
  },
  {
    q: `What counts as "down" on ${SITE_NAME}?`,
    a: `Either our server couldn't establish a connection at all, or the site's own server returned an error response. Both are reported as down.`,
  },
  {
    q: "Do you store what I search?",
    a: `We log recent checks to power the live activity feed, but we don't tie searches to individual visitors or require an account to use the checker.`,
  },
  {
    q: "What's the difference between 'down' and 'slow'?",
    a: `A slow site still responded to our request, just took longer than usual. A down site either refused the connection entirely or its server returned an error.`,
  },
  {
    q: "Can I get notified if a site I care about goes down?",
    a: `Yes -- save any site with the star icon, then turn on alerts from your saved sites page to get a notification the moment we detect it's down.`,
  },
  {
    q: "Why might a site be slow from here but fast for me?",
    a: `Response time depends on network distance and routing. A site can be quick from your ISP and slower from our servers' location, or vice versa -- that's normal and doesn't mean anything is wrong.`,
  },
  {
    q: "Is this data live, or a cached snapshot?",
    a: `Popular site statuses refresh roughly every couple of minutes, and the checker performs a fresh, real-time connection every time you look up an individual domain.`,
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function FaqSection() {
  return (
    <section className="mt-10 max-w-2xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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