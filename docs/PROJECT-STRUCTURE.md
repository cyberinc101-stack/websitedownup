# Is Site Up project structure

(Code folders and storage keys still use the old working name "pulsecheck"/"pc"; the visible name comes from `SITE_NAME` in `lib/config/site.ts`.)

A map of where things live and where new things should go.

## Folder map

```
app/                              Routes (Next.js App Router). Keep these thin:
                                  fetch data, pick components, set metadata.
  page.tsx                        Homepage
  api/check/route.ts              GET /api/check?domain=...[&diagnostics=1] (also records the check)
  api/recent/route.ts             GET /api/recent: live "Recently checked" feed
  api/popular/route.ts            GET /api/popular: live statuses of the top 100 sites
  site/[domain]/page.tsx          The "Is X down?" report page
  worth/page.tsx                  Website Worth Calculator (copy lives in seo/pages/worth.ts)
  api/worth/route.ts              GET /api/worth?domain=...: raw facts for the worth report
  api/worth/speed/route.ts        GET /api/worth/speed?domain=...: mobile speed test (slow, cached 24h)
  about/, contact/, privacy/      Static pages (AdSense checks for all three)
  ads.txt/route.ts                Serves /ads.txt once the AdSense ID is set
  sitemap.ts, robots.ts           SEO files

components/                       React components
  layout/                         Page-level layout wrappers
    AdRailLayout.tsx              Main column + sticky 300px ad rail (site pages)
    RailRow.tsx                   One main + 300px rail row; stack rows to align rail boxes (homepage)
  shared/                         Small pieces used on more than one page
    SiteLogo.tsx                  Site icon with favicon / letter fallbacks
    FallbackImage.tsx             <img> with fallbacks (third-party images)
    RelativeTime.tsx              "4 min ago" that stays up to date
  home/                           Homepage sections
    PopularStatusProvider.tsx     Shares + refreshes (30s) the top-100 statuses for the homepage
    AlertBar.tsx                  Outage alert with site icons when a top-50 site is down (live)
    ProblemsBox.tsx               "Having problems right now" (right rail, 300px)
    LiveFeed.tsx                  "Recently checked", 10 sites, live (right rail)
    PopularSitesExplorer.tsx      Popular sites grid: Top 50 / Top 100 + All / Live / Down
  report/                         Pieces of the site report
    SiteOverview.tsx              Logo, preview image, key facts
    TimingBar.tsx                 Load timing graph
    DiagnosticCards.tsx           DNS / SSL / Domain / Server cards
    DetailTabs.tsx                Redirects / Headers / DNS records tabs
    format.ts                     Date and text helpers for the report
  SiteStatusPanel.tsx             Assembles the report pieces above
  worth/                          Website Worth tool UI
    WorthAnalyzer.tsx             Form + loads the report (domain lives in the URL)
    WorthReportView.tsx           Lays out the report sections and in-report ad
    ValueHero.tsx                 Headline value and range band
    PeriodTable.tsx               Visitors / pageviews / ad revenue per day, week, month, year
    HealthScore.tsx               Health score, biggest opportunity, 9 categories
    SiteFacts.tsx                 Domain age, rank, trend, speed, niche, tech
    scoreColor.ts                 Score colours
  DomainChecker.tsx, HomeChecker.tsx, Header.tsx, Footer.tsx, AdSlot.tsx, StatusBadge.tsx

lib/                              Logic, no React
  config/
    site.ts                       Domain, contact email, AdSense ID, bot User-Agent.
                                  PUBLIC values only (set via NEXT_PUBLIC_* env vars).
  checkSite.ts                    Basic up/down check. Imported by client code
                                  too (normalizeDomain), so NO Node-only imports.
  sites.ts                        Top 100 popular sites, in rank order
  worth/                          Website Worth logic
    types.ts                      Shared types (client-safe)
    collectSignals.ts             SERVER-ONLY: runs every check for one domain
    sources/                      SERVER-ONLY data sources + page parsing
      rank.ts                     Popularity rank + 90-day trend from data/worth/
      firstSeen.ts                Earliest date the site was seen online
      speedTest.ts                Mobile speed test (uses PAGESPEED_API_KEY)
      pageFacts.ts                SEO / content / social facts from the HTML
      detectTech.ts               Technology detection
    engine/                       CLIENT-SAFE pure maths, runs in the browser
      buildReport.ts              Signals -> full report (entry point)
      traffic.ts                  Rank -> visitors curve, trend
      niche.ts                    Niche + RPM detection
      health.ts                   Health score checks and weights
      advice.ts                   "Biggest opportunity" copy
      format.ts                   Money / number / date formatting
  server/                         SERVER-ONLY entry points pages/routes call
    siteReport.ts                 getSiteReport() / getCachedSiteReport() (60s cache)
    worthSignals.ts               getWorthSignals(): SSRF check + 12h cache + rank
    worthSpeed.ts                 getSpeedResult(): speed test with 24h cache
    popularStatus.ts              Popular sites snapshot (5 min cache)
  activity/                       Live check activity shared by all visitors
    checkActivity.ts              SERVER-ONLY: record checks, live monitor, read feed + most checked
    types.ts                      Shared types (client-safe)
  db/
    redis.ts                      SECURITY-SENSITIVE: Upstash Redis client (uses secret token)
  diagnostics/                    SERVER-ONLY checks, one file per check
    runDiagnostics.ts             Runs all checks in parallel
    dnsRecords.ts                 A/AAAA, MX, NS, SPF, DMARC
    sslCertificate.ts             Certificate issuer, expiry, trust problems
    httpProbe.ts                  Redirects, load timing, headers, page info
    pageMeta.ts                   Parses title/description/images from HTML
    domainExpiry.ts               Registrar + registration expiry
    portCheck.ts                  Ports 80 / 443 / 8080
    types.ts                      Shared types (client-safe)
  security/                       SECURITY-CRITICAL code
    ssrfGuard.ts                  Blocks connections to private/internal IPs
    feedFilter.ts                 Keeps adult/offensive domains out of public lists
    rateLimit.ts                  Per-visitor rate limit (hashed IPs, Redis, fails open)

seo/                              ALL search-facing content, separate from code
  types.ts                        The shape every SEO page file follows
  buildMetadata.ts                SEO file -> Next.js metadata (title, canonical, OG)
  pages/                          One file per page: title, description, H1, intro,
    worth.ts                      sections, FAQ, related links
  schema/                         Structured data builders (FAQ, breadcrumb, app)
  components/                     SeoArticle.tsx (renders sections + FAQ), JsonLd.tsx

data/worth/                       Static datasets for the worth tool
  niches.ts                       Niches, ad RPM ranges, country adjustments
  techSignatures.ts               Technology fingerprints
  rank-current.json               Popularity ranking (generated, see below)
  rank-previous.json              Same, ~90 days earlier (for the trend)

scripts/worth/buildRankData.mjs   Regenerates the rank files: npm run worth:ranks

docs/                             Notes like this one
```

## Where new things go

| Adding...                              | Put it in                          |
|----------------------------------------|------------------------------------|
| A new page or tool                     | `app/<name>/page.tsx` (tools: `app/tools/<name>/page.tsx`) |
| A new check (e.g. keyword, API test)   | `lib/diagnostics/<checkName>.ts`, then add it to `runDiagnostics.ts` and `types.ts` |
| Anything that opens a connection       | Must use `safeLookup` from `lib/security/ssrfGuard.ts` |
| A new report section                   | `components/report/<SectionName>.tsx` |
| A tool's interactive UI                | `components/tools/<ToolName>.tsx`  |
| A new SEO page's copy                  | `seo/pages/<page-name>.ts` (follows `seo/types.ts`); the route only imports it |
| Structured data for a page             | `seo/schema/<type>.ts`, rendered with `seo/components/JsonLd.tsx` |
| A worth-report section                 | `components/worth/<SectionName>.tsx` |
| Worth scoring / valuation rules        | `lib/worth/engine/` (weights in `health.ts`, traffic curve in `traffic.ts`) |
| A detectable technology or niche       | `data/worth/techSignatures.ts` or `data/worth/niches.ts` |
| Database / storage clients             | `lib/db/`                          |
| A new cached server data source        | `lib/server/<name>.ts` using `unstable_cache` |
| Browser-only helpers (localStorage...) | `lib/client/<name>.ts`             |
| Public settings (domain, IDs)          | `lib/config/site.ts` via `NEXT_PUBLIC_*` env vars |
| Secrets / API keys                     | Server-only env vars (no `NEXT_PUBLIC_` prefix) in `.env.local` and Vercel, never in code or git |

## Naming rules

- React components: `PascalCase.tsx`, one component per file, named after what it shows (`TimingBar.tsx`).
- Logic and helpers: `camelCase.ts`, named after what it does (`dnsRecords.ts`, `siteReport.ts`).
- Route folders: lowercase with hyphens (`uptime-calculator`), because they become URLs.
- Types shared between server and client go in a `types.ts` next to the code that produces them.

## Comment markers

Every file starts with a header comment saying what it does. Search the project for these markers:

- `SECURITY` or `SECURITY-CRITICAL`: code that protects the server or visitors. Change carefully; only ever tighten these rules.
- `SERVER-ONLY`: uses Node APIs. These files also `import "server-only"`, so the build fails if one is imported into a client component by mistake.
- `UNTRUSTED DATA`: handles content from third-party sites (HTML, headers, registry data). Render it as text only, never with `dangerouslySetInnerHTML`.
- `CLIENT-SAFE`: may be imported by client components.
- `CLIENT-ONLY`: uses browser APIs; call only from client components.
- `PRIVACY`: stores or handles visitor data. Keep the privacy policy in sync.
- `Contains no secrets`: confirms there are no keys or credentials in the file. No file in this project currently contains secrets.

## Checks before pushing

```
npx tsc --noEmit
git add .
git commit -m "..."
git push
```

## Environment variables (set in Vercel > Project > Settings)

| Variable                            | Example                   | Notes |
|-------------------------------------|---------------------------|-------|
| `NEXT_PUBLIC_SITE_URL`              | `https://yourdomain.com`  | No trailing slash |
| `NEXT_PUBLIC_CONTACT_EMAIL`         | `hello@yourdomain.com`    | Shown on /contact |
| `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`  | `pub-1234567890123456`    | Turns on /ads.txt |

All three are public. Redeploy after changing them.

**Secret (server-only) variables.** Never add a `NEXT_PUBLIC_` prefix to these:

| Variable              | Set by                                   | Used in |
|-----------------------|------------------------------------------|---------|
| `KV_REST_API_URL`     | Vercel > Storage > Upstash Redis (auto)  | `lib/db/redis.ts` |
| `KV_REST_API_TOKEN`   | Vercel > Storage > Upstash Redis (auto)  | `lib/db/redis.ts` |
| `PAGESPEED_API_KEY`   | Google Cloud console (PageSpeed Insights API), optional | `lib/worth/sources/speedTest.ts` |

For local dev, copy them into `.env.local` (git-ignored). `.env.example` lists every variable name with no values.
Without them the site still works: the live feed runs from server memory instead (per server instance, resets on redeploy). Connect Redis for one shared, persistent feed across all visitors.

Without `PAGESPEED_API_KEY` the speed test still runs on a small shared quota; when it fails, the worth report falls back to its quick speed check.

## Keeping the Website Worth data fresh

The popularity ranking is bundled in `data/worth/`. Refresh it every month or so:

```
npm run worth:ranks
git add data/worth
git commit -m "Update rank data"
git push
```

Until it has been run once, every site is reported as unranked (low confidence).
UI rule: the worth tool never names its data providers in user-facing text.
