import type { SeoPage } from "../types";

export const RPM_CALCULATOR_PAGE: SeoPage = {
  path: "/tools/rpm-calculator",
  name: "RPM Calculator",
  title: "RPM Calculator: Find Your Ad Revenue Per 1,000 Pageviews",
  description:
    "Work out your website's RPM from real earnings and pageviews, or estimate earnings from a target RPM. Free two-way calculator.",
  h1: "RPM calculator",
  intro:
    "RPM (revenue per 1,000 pageviews) is the standard way to compare ad earnings across sites of different sizes. Use your own numbers to find it, or a target RPM to estimate earnings.",
  sections: [
    {
      heading: "What RPM means",
      paragraphs: [
        "RPM strips out the effect of site size, so a small site and a huge one can be compared fairly. It's calculated as your ad earnings divided by your pageviews, multiplied by 1,000.",
        "\u201cPage RPM\u201d (pageviews) and \u201cImpression RPM\u201d (ad impressions) are the two versions you'll see reported. This calculator uses page RPM, the more commonly quoted figure, since it doesn't depend on how many ad units are on the page.",
      ],
    },
    {
      heading: "What counts as a good RPM",
      paragraphs: [
        "There's no single good number: it depends entirely on niche and visitor location. A finance site with US visitors might see $20 to $40. A general entertainment site might see $2 to $6. Compare your RPM against sites in your own niche, not against the internet as a whole.",
      ],
    },
  ],
  faqs: [
    {
      q: "What is a good RPM for AdSense?",
      a: "It varies enormously by niche: $2 to $8 for entertainment, $5 to $15 for general content, and $10 to $40+ for finance, insurance or legal content, with US and UK traffic well above the global average.",
    },
    {
      q: "How do I increase my RPM?",
      a: "The biggest levers are ad placement and count, targeting a higher-paying niche or topic, growing the share of visitors from high-value countries, and qualifying for a premium ad network once your traffic supports it.",
    },
    {
      q: "Why does my RPM change day to day?",
      a: "Advertiser demand shifts constantly, and RPM is sensitive to small changes in your visitor mix (country, device, traffic source), so day-to-day swings are normal. Look at a weekly or monthly average instead.",
    },
  ],
  related: [
    { href: "/tools/adsense-revenue-calculator", label: "AdSense revenue calculator" },
    { href: "/tools/website-revenue-calculator", label: "Website revenue calculator" },
  ],
};
