import type { SeoPage } from "../types";

export const TRAFFIC_VALUE_CALCULATOR_PAGE: SeoPage = {
  path: "/tools/website-traffic-value-calculator",
  name: "Website Traffic Value Calculator",
  title: "Website Traffic Value Calculator: What Is Your Traffic Worth?",
  description:
    "Estimate what your organic traffic would cost if you had to buy it through paid search instead. Free calculator by niche and visitor volume.",
  h1: "Website traffic value calculator",
  intro:
    "This estimates what your monthly organic visitors would cost if you had to pay for every one of them as a paid search click instead of ranking for them for free.",
  sections: [
    {
      heading: "Why this is a useful number",
      paragraphs: [
        "\u201cTraffic value\u201d is a standard SEO metric for putting a dollar figure on organic search rankings, separate from any ads you actually run. It answers: if this traffic disappeared tomorrow, what would it cost to replace through paid search?",
        "It's commonly used to justify SEO spend, since it turns rankings into a number that's easy to compare against a marketing budget, and to compare the relative value of different pages or keywords on a site.",
      ],
    },
    {
      heading: "How it differs from ad revenue",
      paragraphs: [
        "The revenue calculators on this site estimate what you could earn by showing ads to your traffic. Traffic value instead estimates what that same traffic would cost you to acquire. A site with no ads at all can still have a high traffic value if it ranks for expensive keywords, because the value is in the visit itself, not in monetizing it with display ads.",
      ],
    },
  ],
  faqs: [
    {
      q: "What is website traffic value?",
      a: "It's the estimated cost of replacing your organic search traffic with paid search ads, calculated as your monthly visitors multiplied by the average cost per click for your keywords.",
    },
    {
      q: "How do I find my actual average CPC?",
      a: "A keyword research or paid-search planning tool for the search engine you rank in will show CPC by keyword. This calculator suggests a starting figure by niche, but your real keywords may cost more or less.",
    },
    {
      q: "Does traffic value include social or referral traffic?",
      a: "It's meant for organic search traffic specifically, since that's the traffic with a direct paid-search equivalent. Social and referral visitors don't have a clean CPC comparison in the same way.",
    },
  ],
  related: [
    { href: "/tools/website-revenue-calculator", label: "Website revenue calculator" },
    { href: "/worth", label: "Check what any website is worth automatically" },
  ],
};
