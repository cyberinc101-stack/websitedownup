# PulseCheck

A "is it down or just me" website status checker, built with Next.js
(App Router, TypeScript, Tailwind). Every check is a real, live HTTP
request made from the server at the moment you ask — nothing here is
faked or hardcoded.

## What's included

- **Live checker** (`/`) — type any domain, get a real up/down result
  with HTTP status code and response time.
- **Popular sites grid** — 18 well-known sites, each checked live when
  the homepage loads.
- **Per-site pages** (`/site/[domain]`) — shareable, SEO-indexable
  status page per domain, with a "check again" button and
  troubleshooting tips.
- **About** and **Privacy Policy** pages — written for AdSense review
  (real explanatory content + the required cookies/ads disclosure).
- **`robots.ts`** and **`sitemap.ts`** — auto-generated.
- Ad slots already placed (homepage banner, homepage sidebar, every
  site detail page) — clearly labeled "Advertisement" placeholders,
  ready for your AdSense `<ins>` tags.

## Run it locally

```
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy (your usual workflow)

```
git add .
git commit -m "Initial PulseCheck site"
git push
```

Vercel auto-deploys on push, same as your other projects. If the
GitHub webhook is ever flaky, fall back to `npx vercel --prod`.

## Before you submit for AdSense

1. **Get your AdSense publisher ID first**, then:
   - Add the AdSense site verification script to `app/layout.tsx`
     `<head>` (Next.js lets you add `<Script>` tags there).
   - In each `<AdSlot />` usage, replace the placeholder `<div>` inside
     `components/AdSlot.tsx` with your real `<ins class="adsbygoogle">`
     unit.
   - Add an `app/ads.txt` route (or static `public/ads.txt`) with the
     line Google gives you.
2. **Swap placeholder URLs for your real domain:**
   - `metadataBase` in `app/layout.tsx`
   - `BASE_URL` in `app/sitemap.ts`
   - `sitemap` URL in `app/robots.ts`
3. **Finish the Privacy Policy** (`app/privacy/page.tsx`) — fill in
   your real contact email where it says `[your contact email]`.
4. Optional: edit `lib/sites.ts` to change which sites appear in the
   "Popular sites" grid.

## How the check actually works

`lib/checkSite.ts` does a server-side `HEAD` request to
`https://<domain>` (falling back to `GET` if `HEAD` is rejected), with
a 9-second timeout. A response is "up" unless the connection fails,
times out, or the site's own server returns a 5xx error. This keeps
the tool honest — it reports real reachability rather than a
pre-baked status like the screenshots you sent.
