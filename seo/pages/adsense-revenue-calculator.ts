import type { SeoPage } from "../types";

export const ADSENSE_REVENUE_CALCULATOR_PAGE: SeoPage = {
  path: "/tools/adsense-revenue-calculator",
  name: "AdSense Revenue Calculator",
  title: "AdSense Revenue Calculator: Estimate Your Earnings",
  description:
    "Estimate AdSense earnings from your pageviews, ad units, click-through rate and cost per click. Free calculator with a full monthly breakdown.",
  h1: "AdSense revenue calculator",
  intro:
    "Work out likely AdSense earnings from the settings that actually drive them: how many ad units you show, your click-through rate, and your cost per click.",
  sections: [
    {
      heading: "How AdSense earnings are actually calculated",
      paragraphs: [
        "AdSense earnings come from three numbers multiplied together: how many ad impressions your pageviews generate, what share of those get clicked, and what each click is worth.",
      ],
      bullets: [
        "Impressions = pageviews \u00d7 ad units shown per page",
        "Clicks = impressions \u00d7 click-through rate",
        "Earnings = clicks \u00d7 cost per click",
      ],
      after: [
        "The result also shows the page RPM this implies, since that's the figure most people compare across sites and ad networks.",
      ],
    },
    {
      heading: "Typical ranges to start from",
      bullets: [
        "Click-through rate: most sites see 0.5% to 2%, with well-placed, relevant ads at the higher end",
        "Cost per click: commonly $0.10 to $0.50 for general content, and $1 to $5 or more for finance, legal or insurance topics",
        "Ad units per page: 2 to 4 is typical; more can raise revenue but also raises the chance of hurting the reader experience and your rankings",
      ],
      paragraphs: [],
    },
  ],
  faqs: [
    {
      q: "What's a good AdSense CTR?",
      a: "Most sites see 0.5% to 2%. Above 2% is strong; consistently above 5% often means ads are placed in a way that risks policy problems rather than genuine relevance.",
    },
    {
      q: "How many AdSense units should I show per page?",
      a: "2 to 4 well-placed units usually earns close to the maximum without hurting the reader experience. Beyond that, extra units tend to add little revenue while pushing visitors away.",
    },
    {
      q: "Does this account for AdSense's cut?",
      a: "No. Enter your cost per click as what you're actually paid per click (after AdSense's share), which is what your AdSense reports show, and the earnings figure will match.",
    },
  ],
  related: [
    { href: "/tools/rpm-calculator", label: "RPM calculator" },
    { href: "/tools/website-revenue-calculator", label: "Website revenue calculator" },
    { href: "/worth", label: "Check what any website is worth automatically" },
  ],
};
