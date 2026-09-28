/**
 * SEO content for /app-worth, the App Worth Calculator (App Store apps).
 * Everything search-facing on that page lives here; the route
 * (app/app-worth/page.tsx) only imports it.
 *
 * UI RULE: never name the data providers behind the estimates.
 * CLIENT-SAFE. Contains no secrets.
 */

import type { SeoPage } from "../types";

export const APP_WORTH_PAGE: SeoPage = {
  path: "/app-worth",
  name: "App Worth Calculator",
  title: "App Worth Calculator: How Much Is My iPhone App Worth?",
  description:
    "Estimate what any iPhone or iPad app is worth and makes per day, week, month and year: revenue, profit, downloads, active users and chart ranks.",
  h1: "App worth calculator",
  intro:
    "Paste an App Store link to see what an iPhone or iPad app is worth, how much it earns per day, week, month and year, and how many people use it. Works for App Store apps only.",

  sections: [
    {
      id: "how-it-works",
      heading: "How we estimate an app's worth",
      paragraphs: [
        "Apps are bought and sold on a multiple of their monthly profit, like websites. Nobody outside the developer can see an app's real sales, so the estimate is built from what the App Store shows publicly.",
        "Apple doesn't publish download numbers, so we start from ratings. We count the app's ratings in six of the biggest App Store countries, scale that up to a worldwide total, and estimate downloads from it, since apps collect ratings at a fairly steady rate. If the app is in the US Top Free, Top Paid or Top Grossing chart, its position anchors the estimate and the confidence goes up.",
        "From downloads we estimate how many people use the app each month and each day, based on its category and how recently it was updated. Monthly users times typical revenue per user for the category gives revenue. We show what customers spend, Apple's commission (15% for developers earning under $1M a year, 30% above), the developer's revenue and the profit after running costs. The value is monthly profit times a multiple of 18 to 48 months, based on the app's age, health and trend.",
      ],
    },
    {
      heading: "What's in the report",
      paragraphs: ["Every report is free and includes:"],
      bullets: [
        "Estimated value with a likely range",
        "Customer spending, Apple's cut, revenue and profit per day, week, month and year",
        "New downloads and new ratings per day, week, month and year",
        "Lifetime downloads, monthly and daily active users, and lifetime revenue",
        "Revenue per download, revenue per user and value per user",
        "US Top Free, Top Paid and Top Grossing chart positions",
        "Ratings and stars in the US, UK, Canada, Australia, Germany and Japan",
        "An app health score across six areas, with the biggest opportunity and how to fix each issue",
        "Every public listing fact, from version and size to languages and age rating",
        "The developer's other apps, each with its own report",
      ],
    },
    {
      heading: "Why the estimate is a range",
      paragraphs: [
        "Two apps with the same downloads can earn wildly different amounts: a meditation app with subscriptions might make 50 times more per user than a free flashlight app. That's why the report shows a range and marks its confidence. If you own the app, use your own numbers for a much tighter figure.",
      ],
    },
    {
      heading: "What makes an app worth more",
      paragraphs: ["Buyers pay more for apps that are:"],
      bullets: [
        "Earning from subscriptions, which recur every month, rather than one-off sales",
        "Growing, with downloads and revenue rising rather than flat",
        "Well rated, usually 4.5 stars or higher",
        "Updated regularly, so they keep working on new iOS versions",
        "Available in several languages and on iPad as well as iPhone",
        "Not dependent on a single paid ad channel for their installs",
      ],
    },
    {
      heading: "Estimates for the biggest apps",
      paragraphs: [
        "For household-name apps, a revenue-per-user estimate says little about the business behind them. The report flags these apps so the figure isn't mistaken for a company valuation.",
      ],
    },
  ],

  faqs: [
    {
      q: "How much is my app worth?",
      a: "Most profitable apps sell for 18 to 48 months of profit, with 24 to 36 months typical. An app making $1,000 a month in profit might sell for $24,000 to $36,000, more if most of that is subscription revenue.",
    },
    {
      q: "How much does an app make per day?",
      a: "Paste its App Store link and the report estimates revenue and profit per day, week, month and year. For most apps it's a few dollars a day or less; apps in the US Top Grossing chart make tens of thousands to millions.",
    },
    {
      q: "How much does an app make per download?",
      a: "It varies hugely by category and business model. Many free apps earn a few cents per download over their lifetime from ads, while subscription apps can earn several dollars. The report shows an estimate for the app you check.",
    },
    {
      q: "Does this work for Android apps?",
      a: "No, it works for iPhone and iPad apps on the App Store only. If you own an Android app, switch to your own numbers to value it from its revenue.",
    },
    {
      q: "How much does Apple take from app sales?",
      a: "Apple keeps 30% of app sales and in-app purchases, or 15% for developers who earn under $1 million a year through the Small Business Program. The report shows Apple's cut separately.",
    },
    {
      q: "Can you see an app's real revenue?",
      a: "No. Apple doesn't publish an app's downloads or revenue, so every outside estimate is a model. Only the developer's own dashboard shows real figures.",
    },
    {
      q: "Are subscription apps worth more?",
      a: "Usually, yes. Subscription revenue repeats every month, so buyers pay a higher multiple for it than for ad revenue or one-off purchases.",
    },
  ],

  related: [
    { href: "/worth", label: "Website worth calculator" },
    { href: "/tools/website-value-calculator", label: "Website value calculator" },
    { href: "/tools/adsense-revenue-calculator", label: "AdSense revenue calculator" },
  ],
};
