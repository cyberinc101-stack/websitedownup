import type { SeoPage } from "../types";

export const WEBSITE_VALUE_CALCULATOR_PAGE: SeoPage = {
  path: "/tools/website-value-calculator",
  name: "Website Value Calculator",
  title: "Website Value Calculator: What's Your Site Worth?",
  description:
    "Work out what your website could sell for from its own monthly profit. Free calculator using the same valuation multiple buyers use.",
  h1: "Website value calculator",
  intro:
    "If you already know your site's monthly profit, this gives a more accurate estimate than any tool that has to guess your traffic and revenue from the outside.",
  sections: [
    {
      heading: "How this is calculated",
      paragraphs: [
        "Websites sell for a multiple of their monthly profit, typically 18 to 48 months' worth. Where a site sits in that range depends mainly on its age and whether its traffic is growing, steady or declining.",
        "A brand-new site earns a lower multiple because buyers can't yet tell if its income is stable. A site over 5 years old with growing traffic earns a higher one, because it has a track record and the buyer is paying for future growth rather than hoping for it.",
      ],
    },
    {
      heading: "What buyers look at beyond profit",
      paragraphs: ["The profit number matters most, but these also move the price a buyer will actually offer:"],
      bullets: [
        "How the traffic arrives: mostly search is worth more than mostly one social platform, which can disappear overnight",
        "How many income sources there are: a site earning from ads and affiliate links is safer than one relying on a single source",
        "How much ongoing work it needs: a site that runs itself sells for more than one needing daily attention",
        "Verified numbers: screenshots from your ad network and analytics speed up a sale and support your asking price",
      ],
    },
  ],
  faqs: [
    {
      q: "What multiple do websites sell for?",
      a: "Most content sites sell for 18 to 48 months of profit, with 24 to 36 months being typical. Newer or declining sites sit at the low end; older, growing sites with several income sources sit at the high end.",
    },
    {
      q: "Does niche affect the multiple?",
      a: "Niche mainly affects how much a site earns, which affects profit rather than the multiple directly. A stable, well-established niche can support a slightly higher multiple than one prone to sudden algorithm or policy changes.",
    },
    {
      q: "Should I use my average profit or my best month?",
      a: "Use your average over the last 6 to 12 months. A buyer will do the same, and a valuation based on one unusually good month won't hold up in a real sale.",
    },
  ],
  related: [
    { href: "/worth", label: "Check what any website is worth automatically" },
    { href: "/tools/website-revenue-calculator", label: "Website revenue calculator" },
  ],
};
