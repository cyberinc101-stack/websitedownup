/**
 * Website Health Score: nine category scores (0-100) plus a weighted
 * overall score, and the "biggest opportunity" pick.
 *
 * Each category is a list of checks worth fixed points, so every score can
 * be explained line by line in the report. When the full speed test has
 * finished, its results replace (performance) or blend into (SEO, technical)
 * the quick checks.
 *
 * CLIENT-SAFE, pure functions. Contains no secrets.
 */

import { OPPORTUNITY_COPY } from "./advice";
import type {
  DetectedTech,
  HealthCategory,
  HealthCategoryId,
  HealthCheck,
  Opportunity,
  SpeedResult,
  WorthSignals,
} from "../types";
import type { TrendResult } from "./traffic";

/** Category weights in the overall score. Must add up to 100. */
export const CATEGORY_WEIGHTS: Record<HealthCategoryId, number> = {
  seo: 15,
  traffic: 14,
  performance: 12,
  content: 12,
  monetization: 10,
  technical: 10,
  security: 10,
  growth: 10,
  social: 7,
};

/** Categories a site owner can act on directly; preferred for the opportunity pick. */
const ACTIONABLE: HealthCategoryId[] = ["seo", "performance", "content", "technical", "security", "social", "monetization"];
const ACTIONABLE_GOOD_ENOUGH = 80;
const MAX_STEPS = 3;

interface ScoredCheck extends HealthCheck {
  points: number;
}

function check(label: string, pass: boolean, points: number, fix: string): ScoredCheck {
  return { label, pass, points: pass ? points : 0, fix };
}

function total(checks: ScoredCheck[]): number {
  return Math.max(0, Math.min(100, Math.round(checks.reduce((sum, c) => sum + c.points, 0))));
}

function strip(checks: ScoredCheck[]): HealthCheck[] {
  return checks.map(({ label, pass, fix }) => ({ label, pass, fix }));
}

function blend(quick: number, full: number | null | undefined): number {
  return full === null || full === undefined ? quick : Math.round(quick * 0.5 + full * 0.5);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function scoreSeo(s: WorthSignals, speed: SpeedResult | null): HealthCategory {
  const p = s.page;
  const titleLen = p?.title?.length ?? 0;
  const descLen = p?.description?.length ?? 0;
  const checks = [
    check("Page title is 15 to 65 characters", titleLen >= 15 && titleLen <= 65, 15, "Write a page title of 15 to 65 characters that names what the site offers."),
    check("Meta description is 70 to 165 characters", descLen >= 70 && descLen <= 165, 15, "Add a meta description of 70 to 165 characters that makes people want to click."),
    check("Exactly one main heading (H1)", p?.h1Count === 1, 10, "Use exactly one H1 heading that states the page's main topic."),
    check("Search engines may index the page", p !== null && !p.noindex, 15, "Remove the noindex robots tag so search engines can list the page."),
    check("Canonical URL is set", p?.hasCanonical === true, 10, "Add a canonical link tag so search engines know the preferred URL."),
    check("Page language is declared", Boolean(p?.lang), 10, "Add a lang attribute to the <html> tag, for example lang=\"en\"."),
    check("Structured data is present", p?.hasStructuredData === true, 10, "Add structured data (JSON-LD) describing the organisation or content."),
    check("Mobile viewport is set", p?.hasViewport === true, 5, "Add a responsive viewport meta tag."),
    check("Social preview tags are set", p?.ogTitle === true && p?.ogImage === true, 5, "Add og:title and og:image tags for link previews."),
    check("Served over HTTPS", s.security.httpsFinal, 5, "Redirect all traffic to HTTPS."),
  ];
  const quick = total(checks);
  const full = speed?.ok ? speed.seo : null;
  return {
    id: "seo",
    label: "SEO",
    score: blend(quick, full),
    weight: CATEGORY_WEIGHTS.seo,
    checks: strip(checks),
    checked: s.page !== null,
    fromSpeedTest: full !== null && full !== undefined,
  };
}

export function scorePerformance(s: WorthSignals, speed: SpeedResult | null): HealthCategory {
  if (speed?.ok && speed.performance !== null) {
    const checks: HealthCheck[] = [
      { label: "Main content loads within 2.5s on mobile", pass: speed.lcpMs !== null && speed.lcpMs <= 2500, fix: "Compress and resize the largest image or block of text above the fold, and serve it from a CDN." },
      { label: "Layout stays stable while loading", pass: speed.cls !== null && speed.cls <= 0.1, fix: "Give images, ads and embeds fixed dimensions so the page doesn't jump while loading." },
      { label: "Page responds quickly to taps", pass: speed.tbtMs !== null && speed.tbtMs <= 200, fix: "Cut or defer heavy JavaScript, especially third-party scripts." },
    ];
    return { id: "performance", label: "Performance", score: speed.performance, weight: CATEGORY_WEIGHTS.performance, checks, checked: true, fromSpeedTest: true };
  }

  const wait = s.waitMs;
  const totalMs = s.totalMs;
  const kb = s.htmlBytes / 1024;
  const checks = [
    check("Server responds within 0.8s", wait !== null && wait <= 800, wait === null ? 0 : wait <= 300 ? 40 : wait <= 800 ? 28 : wait <= 1500 ? 15 : 5, "Add page caching or a CDN so the server answers faster."),
    check("Page downloads within 2.5s", totalMs !== null && totalMs <= 2500, totalMs === null ? 0 : totalMs <= 1200 ? 30 : totalMs <= 2500 ? 20 : totalMs <= 5000 ? 10 : 0, "Reduce page weight and enable compression."),
    check("HTML is under 400 KB", s.reachable && kb <= 400, !s.reachable ? 0 : kb <= 150 ? 30 : kb <= 400 ? 20 : kb <= 800 ? 10 : 0, "Trim inline scripts and styles from the HTML."),
  ];
  return { id: "performance", label: "Performance", score: total(checks), weight: CATEGORY_WEIGHTS.performance, checks: strip(checks), checked: s.page !== null, fromSpeedTest: false };
}

export function scoreContent(s: WorthSignals): HealthCategory {
  const p = s.page;
  const words = p?.wordCount ?? 0;
  const links = p?.internalLinks ?? 0;
  const altRatio = p && p.images > 0 ? p.imagesWithAlt / p.images : 0;
  const checks = [
    check("At least 500 words of content", words >= 500, words >= 1000 ? 40 : words >= 500 ? 28 : words >= 200 ? 14 : 3, "Expand the homepage with useful, original text that explains what the site offers."),
    check("3 or more subheadings", (p?.h2Count ?? 0) >= 3, 15, "Break content into sections with descriptive H2 subheadings."),
    check("15 or more internal links", links >= 15, links >= 40 ? 20 : links >= 15 ? 14 : links >= 5 ? 6 : 0, "Link to your most important pages from the homepage."),
    check("Images have descriptive alt text", altRatio >= 0.8, altRatio >= 0.8 ? 15 : Math.round(altRatio * 10), "Describe every meaningful image in its alt attribute."),
    check("Publishes an RSS or Atom feed", p?.hasFeed === true, 10, "Offer a feed so readers and aggregators can follow new content."),
  ];
  return { id: "content", label: "Content", score: total(checks), weight: CATEGORY_WEIGHTS.content, checks: strip(checks), checked: s.page !== null };
}

export function scoreTechnical(s: WorthSignals, speed: SpeedResult | null): HealthCategory {
  const checks = [
    check("Loads over HTTPS", s.security.httpsFinal, 20, "Install a certificate and redirect HTTP to HTTPS."),
    check("Homepage returns a normal response", s.finalStatus === 200, 20, "Make sure the homepage returns status 200, not an error or block page."),
    check("Two redirects or fewer", s.reachable && s.redirects <= 2, 10, "Point links straight at the final URL to avoid redirect chains."),
    check("Compression is enabled", s.compression, 15, "Turn on gzip or Brotli compression on the server or CDN."),
    check("Reachable over IPv6", s.ipv6, 10, "Add an IPv6 (AAAA) record, which most CDNs provide for free."),
    check("Fast server response", s.waitMs !== null && s.waitMs <= 800, 15, "Add caching so the server responds in under 0.8s."),
    check("HTML is a reasonable size", s.reachable && s.htmlBytes <= 400 * 1024, 10, "Keep the homepage HTML under 400 KB."),
  ];
  const quick = total(checks);
  const full = speed?.ok ? speed.bestPractices : null;
  return {
    id: "technical",
    label: "Technical",
    score: blend(quick, full),
    weight: CATEGORY_WEIGHTS.technical,
    checks: strip(checks),
    checked: s.reachable,
    fromSpeedTest: full !== null && full !== undefined,
  };
}

export function scoreSecurity(s: WorthSignals): HealthCategory {
  const sec = s.security;
  const checks = [
    check("Valid SSL certificate", sec.sslValid, 30, "Install a trusted certificate that matches the domain."),
    check("Certificate isn't about to expire", sec.sslDaysRemaining !== null && sec.sslDaysRemaining > 14, 10, "Renew the certificate, and turn on automatic renewal."),
    check("HTTPS is enforced (HSTS)", sec.hsts, 15, "Send a Strict-Transport-Security header."),
    check("Content Security Policy set", sec.csp, 10, "Add a Content-Security-Policy header to limit where scripts can load from."),
    check("Protected against framing", sec.frameProtection, 10, "Send X-Frame-Options or a frame-ancestors policy."),
    check("MIME sniffing blocked", sec.noSniff, 5, "Send X-Content-Type-Options: nosniff."),
    check("Email sender policy (SPF)", sec.spf, 10, "Publish an SPF record so others can't send email as your domain."),
    check("Email authentication (DMARC)", sec.dmarc, 10, "Publish a DMARC record for the domain."),
  ];
  return { id: "security", label: "Security", score: total(checks), weight: CATEGORY_WEIGHTS.security, checks: strip(checks), checked: s.reachable };
}

export function scoreSocial(s: WorthSignals): HealthCategory {
  const p = s.page;
  const profiles = p?.socialProfiles.length ?? 0;
  const checks = [
    check("Link preview title (og:title)", p?.ogTitle === true, 15, "Add an og:title tag."),
    check("Link preview image (og:image)", p?.ogImage === true, 20, "Add an og:image tag with a 1200x630 image."),
    check("Twitter/X card tag", p?.twitterCard === true, 15, "Add a twitter:card meta tag."),
    check("Links to social profiles", profiles >= 2, profiles >= 3 ? 50 : profiles === 2 ? 35 : profiles === 1 ? 20 : 0, "Link your social profiles from the homepage header or footer."),
  ];
  return { id: "social", label: "Social", score: total(checks), weight: CATEGORY_WEIGHTS.social, checks: strip(checks), checked: s.page !== null };
}

export function scoreTraffic(s: WorthSignals, monthlyVisits: number): HealthCategory {
  const rank = s.rank.current;
  const listSize = Math.max(s.rank.listSize, 10);
  const score =
    rank !== null
      ? clamp(Math.round(100 - (Math.log10(rank) / Math.log10(listSize)) * 65), 30, 100)
      : clamp(Math.round(10 + Math.log10(Math.max(monthlyVisits, 1)) * 4), 5, 30);
  const checks: HealthCheck[] = [
    { label: "Ranked among the most popular sites", pass: rank !== null, fix: "Publish content that targets what your audience searches for, and promote it where they already are." },
    { label: "Ranked in the top 10,000", pass: rank !== null && rank <= 10000, fix: "Double down on the pages that already bring visitors and build more like them." },
  ];
  return { id: "traffic", label: "Traffic", score, weight: CATEGORY_WEIGHTS.traffic, checks, checked: true };
}

export function scoreGrowth(trend: TrendResult): HealthCategory {
  let score = 40;
  if (trend.direction === "rising" && trend.ratio !== null) score = 50 + Math.min(45, Math.log2(trend.ratio) * 30);
  else if (trend.direction === "falling" && trend.ratio !== null) score = 50 - Math.min(45, Math.log2(1 / trend.ratio) * 30);
  else if (trend.direction === "steady") score = 55;
  else if (trend.direction === "new") score = 65;
  const checks: HealthCheck[] = [
    { label: "Popularity rising over 90 days", pass: trend.direction === "rising" || trend.direction === "new", fix: "Publish on a steady schedule and refresh your best older pages." },
  ];
  return { id: "growth", label: "Growth", score: Math.round(score), weight: CATEGORY_WEIGHTS.growth, checks, checked: true };
}

export function scoreMonetization(tech: DetectedTech[], rpm: [number, number], trafficScore: number): HealthCategory {
  const rpmMid = (rpm[0] + rpm[1]) / 2;
  const hasAds = tech.some((t) => t.category === "Advertising");
  const hasAffiliate = tech.some((t) => t.category === "Affiliate");
  const sells = tech.some((t) => t.category === "Payments" || t.category === "Store");
  const score = clamp(
    Math.round(Math.min(50, (rpmMid / 20) * 50) + trafficScore * 0.3 + (hasAds ? 10 : 0) + (hasAffiliate ? 5 : 0) + (sells ? 5 : 0)),
    0,
    100
  );
  const checks: HealthCheck[] = [
    { label: "In a well-paying advertising niche", pass: rpmMid >= 10, fix: "Add content for higher-value topics your audience cares about." },
    { label: "Runs display advertising", pass: hasAds, fix: "Apply for an ad network once the site has steady traffic and original content." },
    { label: "Uses affiliate links", pass: hasAffiliate, fix: "Recommend products you'd genuinely suggest, using affiliate links." },
    { label: "Sells products or subscriptions", pass: sells, fix: "Offer a paid product, template or premium tier that fits the audience." },
  ];
  return { id: "monetization", label: "Monetization", score, weight: CATEGORY_WEIGHTS.monetization, checks, checked: true };
}

/** Weighted average of the categories that could be checked. */
export function overallScore(categories: HealthCategory[]): number {
  const scored = categories.filter((c) => c.checked);
  const weightSum = scored.reduce((sum, c) => sum + c.weight, 0) || 1;
  return Math.round(scored.reduce((sum, c) => sum + c.score * c.weight, 0) / weightSum);
}

/**
 * The category where improvement would add the most, preferring ones the
 * owner can act on directly. Traffic and growth are only picked once every
 * actionable category is already in good shape.
 */
export function pickOpportunity(categories: HealthCategory[]): Opportunity | null {
  const gap = (c: HealthCategory) => (100 - c.score) * c.weight;
  const scored = categories.filter((c) => c.checked);
  const actionable = scored.filter((c) => ACTIONABLE.includes(c.id) && c.score < ACTIONABLE_GOOD_ENOUGH);
  const pool = actionable.length > 0 ? actionable : scored.filter((c) => c.score < 100);
  if (pool.length === 0) return null;

  const best = pool.reduce((a, b) => (gap(b) > gap(a) ? b : a));
  const copy = OPPORTUNITY_COPY[best.id];
  const steps = best.checks.filter((c) => !c.pass).slice(0, MAX_STEPS).map((c) => c.fix);
  return { category: best.id, label: copy.label, summary: copy.summary, steps };
}
