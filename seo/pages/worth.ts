/**
 * SEO content for /worth, the Website Worth Calculator.
 * Everything search-facing on that page lives here. Edit freely; the route
 * (app/worth/page.tsx) only imports it.
 *
 * UI RULE: never name the data providers behind the estimates.
 * CLIENT-SAFE. Contains no secrets.
 */

import type { SeoPage } from "../types";

export const WORTH_PAGE: SeoPage = {
  path: "/worth",
  name: "Website Worth Calculator",
  title: "Website Worth Calculator: How Much Is a Website Worth?",
  description:
    "Estimate what any website is worth, its daily and monthly visitors, and its ad revenue potential. Free, with a 9-part health score and clear next steps.",
  h1: "Website worth calculator",
  intro:
    "Enter any website to estimate what it's worth, how many people visit it and how much its traffic could earn from advertising. You'll also get a health score showing what's holding its value back.",

  sections: [
    {
      id: "how-it-works",
      heading: "How we estimate a website's worth",
      paragraphs: [
        "Websites are bought and sold on a multiple of their monthly profit, so the estimate works the same way. First we estimate traffic, then what that traffic could earn, then apply the kind of multiple a buyer would pay.",
        "Traffic comes from the site's position in public rankings of the world's most popular websites, mapped against publicly reported visitor numbers for sites at similar positions. We then work out the site's niche from its content, since an advertiser pays very different amounts per visitor for finance content than for memes. That gives estimated pageviews, and pageviews times the niche's typical earnings per 1,000 pageviews gives ad revenue.",
        "Finally, we take a typical profit margin for content sites and multiply by 18 to 48 months, adjusted for how old the domain is, how healthy the site is and whether its popularity is rising or falling.",
      ],
      bullets: [
        "Homepage content, headings, links and images, read live when you run a check",
        "Search engine tags, structured data and social preview tags",
        "Technology, analytics and ad networks detected on the page",
        "SSL certificate, security headers and email records",
        "Domain registration date and the earliest record of the site online",
        "A full mobile speed test, which finishes a few seconds after the rest of the report",
      ],
    },
    {
      heading: "Why you see a range, not one number",
      paragraphs: [
        "No outside tool can see a website's real analytics or bank account, so any single figure would claim more precision than the data allows. The range shows where the true value most likely sits, and the confidence level tells you how much weight to put on it.",
        "Sites in the public popularity rankings get medium confidence. Smaller sites outside those rankings get a wider range and low confidence, because their traffic has to be estimated from on-site signals such as domain age, content depth and SEO. If you own the site, your real traffic and revenue figures will always beat an estimate.",
      ],
    },
    {
      heading: "What the health score measures",
      paragraphs: [
        "The health score rates the site out of 100 across nine areas, weighted by how much each affects value. Open any area in the report to see exactly which checks passed and what to fix.",
      ],
      bullets: [
        "SEO: whether search engines can find, understand and index the page",
        "Traffic: how popular the site is compared with the rest of the web",
        "Monetization: how well the niche pays and whether the site already earns",
        "Performance: how fast the site loads on a mobile phone",
        "Content: how much useful, well-structured content the homepage offers",
        "Social: link preview tags and linked social profiles",
        "Technical: HTTPS, redirects, compression and server response",
        "Security: certificate, security headers and email protection",
        "Growth: whether the site's popularity rose or fell over 90 days",
      ],
      after: [
        "The report also picks out your biggest opportunity: the single area where improvement would add the most value, with the first steps to take.",
      ],
    },
    {
      heading: "What makes a website worth more",
      paragraphs: [
        "Two sites with the same traffic can sell for very different prices. Buyers pay more for sites that are:",
      ],
      bullets: [
        "Growing, with steady traffic rather than one-off spikes",
        "Old enough to have a track record, usually two years or more",
        "In a niche where advertisers pay well, such as finance, insurance or software",
        "Earning from more than one source, like ads plus affiliate links",
        "Built on search traffic rather than a single social channel",
        "Easy to run, without the owner doing hours of work each week",
      ],
    },
    {
      heading: "Estimates for the biggest websites",
      paragraphs: [
        "For household names, an advertising-based estimate says little about what the business is worth. Companies like these earn from subscriptions, sales and services, and are valued by the stock market rather than by site buyers. The report flags these sites so the figure isn't mistaken for a company valuation.",
      ],
    },
  ],

  faqs: [
    {
      q: "How much is my website worth?",
      a: "Most content websites sell for 25 to 45 times their monthly profit. A site making $1,000 a month in profit might sell for $25,000 to $45,000, depending on its age, traffic trend, niche and how much work it takes to run. Enter your domain above for an estimate based on its public signals.",
    },
    {
      q: "How is website value calculated?",
      a: "Estimated monthly visitors are turned into pageviews, pageviews into ad revenue using typical earnings for the site's niche, revenue into profit using a typical margin, and profit into value using a multiple of 18 to 48 months.",
    },
    {
      q: "Where does the traffic estimate come from?",
      a: "From the site's position in public rankings of the world's most popular websites. For sites outside those rankings, traffic is estimated from on-site signals and marked as low confidence.",
    },
    {
      q: "How much can a website earn from ads?",
      a: "Display ads typically earn between $2 and $40 for every 1,000 pageviews, depending on the niche and where visitors are located. Finance, insurance and legal content earn the most; entertainment and forums earn the least.",
    },
    {
      q: "Why is my site marked as low confidence?",
      a: "Your site isn't in the public popularity rankings yet, which usually means it gets fewer than a few hundred thousand visits a month. We can still check its health, but the traffic and value figures are rougher estimates.",
    },
    {
      q: "Does this tool see my analytics?",
      a: "No. It only uses public information and what anyone can see on your homepage. Buyers value sites on verified analytics and revenue, so treat this as a starting point.",
    },
    {
      q: "How often is the data updated?",
      a: "Each report is refreshed at least every 12 hours, and the speed test every 24 hours. Popularity rankings are refreshed regularly, and the traffic trend compares today with 90 days ago.",
    },
    {
      q: "Is the website worth calculator free?",
      a: "Yes. There's no sign-up and no limit beyond a short pause if you run a lot of checks in a row.",
    },
  ],

  related: [{ href: "/", label: "Check if a website is down right now" }],
};
