# App Worth tool (/app-worth)

Estimates what an iPhone or iPad app (Apple App Store only) is worth and
earns per day, week, month and year, from its public App Store data. Also
has a "use your own numbers" mode for owners (works for any app).

No accounts, API keys or environment variables are needed. Everything it
uses is free and public.

## Where things live

```
app/app-worth/page.tsx            Route (thin)
app/api/app-worth/route.ts        GET /api/app-worth?app=<App Store link or id>
app/api/app-search/route.ts       GET /api/app-search?q=<app name> (name search dropdown)
seo/pages/app-worth.ts            All search-facing copy for the page
components/apps/                  Tool UI (lookup, report sections, own numbers)
lib/apps/parseAppInput.ts         Link / id parsing (Google Play links get a friendly "not supported")
lib/apps/engine/estimateApp.ts    Estimate maths (runs in the browser)
lib/apps/sources/                 App Store listing + chart lookups (server-only)
lib/server/appSignals.ts          Cached entry point used by /api/app-worth
lib/server/appSearch.ts           Cached entry point used by /api/app-search
components/shared/SuggestInput.tsx  Search box with dropdown (shared with the website boxes)
data/apps/appCategories.ts        Category figures (active users, revenue per user), rating countries
```

## What one lookup does

- Reads the app's listing in 6 countries (US, UK, Canada, Australia,
  Germany, Japan) for ratings by country.
- Reads the developer's other apps.
- Checks the US Top Free, Top Paid and Top Grossing charts (top 100).

## Limits and caching

Apple's public lookup allows roughly 20 requests a minute. To stay well
under it:

- Each app is cached for 24 hours (repeat searches cost nothing).
- The three charts are cached for 3 hours and shared by every lookup.
- The API route allows 10 lookups per minute per visitor.
- Name search: the browser waits until typing pauses (350 ms) before
  asking, remembers answers for the visit, and each search term is cached
  on the server for 24 hours, so popular names hit Apple once a day.
  Searches are limited to 30 per minute per visitor.
- If search ever stops answering, the box says so and pasting a link still
  works.

Failed lookups are never cached, so a temporary error clears on retry.
The Top Grossing chart is best-effort: if it can't be read the report says
"Couldn't check" instead of "Not in top 100".

## Tuning

Edit `data/apps/appCategories.ts` to adjust active-user share and revenue
per user by category. Chart-to-downloads/revenue curves and Apple's
commission threshold are constants at the top of
`lib/apps/engine/estimateApp.ts`. The valuation multiple is shared with the
website tool (`lib/worth/engine/multiple.ts`).
