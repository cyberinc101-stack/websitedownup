import type { SeoPage } from "../types";

export const WEBSITE_REVENUE_CALCULATOR_PAGE: SeoPage = {
  path: "/tools/website-revenue-calculator",
  name: "Website Revenue Calculator",
  title: "Website Revenue Calculator: Estimate Ad Earnings",
  description:
    "Estimate how much a website could earn from display ads based on its pageviews and niche. Free calculator with day, week, month and year figures.",
  h1: "Website revenue calculator",
  intro:
    "Enter your monthly pageviews and pick the niche that best matches your content to estimate what display advertising could earn.",
  sections: [
    {
      heading: "How this is calculated",
      paragraphs: [
        "Advertisers pay very different amounts depending on who is reading. Finance and insurance content earns far more per pageview than entertainment or forums, because the advertisers bidding on those pages sell higher-value products.",
        "This estimate multiplies your pageviews by a typical earnings-per-1,000-pageviews range for the niche you pick. Your actual RPM depends on your specific ad setup, visitor country and ad placement, so treat this as a starting range rather than a guarantee.",
      ],
    },
    {
      heading: "What changes your actual RPM",
      bullets: [
        "Visitor location: visitors from the US, UK, Australia and similar markets earn more per pageview than visitors from lower-advertising-spend countries",
        "Ad placement and count: more ad units generally means more revenue, up to the point where it starts pushing visitors away",
        "Ad network: some networks pay noticeably more than others for the same traffic, especially once a site qualifies for a premium network",
        "Device mix: this varies by niche, but many niches see different pageview RPM between mobile and desktop visitors",
      ],
      paragraphs: [],
    },
  ],
  faqs: [
    {
      q: "How much does a website earn per 1,000 pageviews?",
      a: "It depends heavily on niche: roughly $2 to $8 for entertainment or forums, $5 to $15 for general content, and $10 to $40 for finance, insurance or legal content. Pick your niche above for a tighter range.",
    },
    {
      q: "Is this the same as an AdSense calculator?",
      a: "It's related but answers a different question. This estimates revenue from your niche's typical earnings per pageview. The AdSense revenue calculator instead works from ad units, click-through rate and cost per click, which is closer to how AdSense actually bills.",
    },
    {
      q: "Why is my real revenue different from this estimate?",
      a: "This uses a broad niche average. Your actual earnings depend on your specific ad network, how many ad units you show, where your visitors are located, and how well your content matches high-value advertiser categories.",
    },
  ],
  related: [
    { href: "/tools/adsense-revenue-calculator", label: "AdSense revenue calculator" },
    { href: "/tools/rpm-calculator", label: "RPM calculator" },
    { href: "/worth", label: "Check what any website is worth automatically" },
  ],
};
