$ErrorActionPreference = "Stop"

# 1. Update lib/config/site.ts - SITE_NAME
$siteConfig = @"
/**
 * Site-wide settings: domain, contact email, AdSense publisher ID.
 * Change these in ONE place (or better, set the env vars in Vercel:
 * Project > Settings > Environment Variables) and every page, the sitemap,
 * robots.txt, ads.txt and the bot User-Agent pick them up.
 *
 * CLIENT-SAFE. SECURITY NOTE: every value here is PUBLIC. Anything named
 * NEXT_PUBLIC_* is bundled into the browser JavaScript, so never put a
 * secret (API key, password, token) in a NEXT_PUBLIC_ variable or this file.
 * An AdSense publisher ID is public by design, so it's fine here.
 */

/** Your live domain, no trailing slash. e.g. https://pulsecheck.app */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://example.com").replace(/\/+`$/, "");

export const SITE_NAME = "Website Up or Down";

/** Public contact address shown on /contact. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com";

/**
 * AdSense publisher ID in the form "pub-1234567890123456" (without "ca-").
 * Leave empty until AdSense gives you one; /ads.txt returns 404 until then.
 */
export const ADSENSE_PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "";

/** Identifies our checker to the sites it checks, with a link explaining what it is. */
export const BOT_USER_AGENT = "IsSiteUpBot/1.0 (+" + SITE_URL + "/about)";
"@
[System.IO.File]::WriteAllText("$PWD\lib\config\site.ts", $siteConfig, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Updated lib\config\site.ts"

# 2. Update app/layout.tsx
$layout = @"
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PushServiceWorker from "@/components/PushServiceWorker";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";

export const metadata: Metadata = {
  title: SITE_NAME,
  description:
    "Check whether any website is down for everyone or just for you. Live, real-time reachability checks with response times for popular sites.",
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body bg-bg text-ink antialiased min-h-screen flex flex-col">
        <Header />
        <PushServiceWorker />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
"@
[System.IO.File]::WriteAllText("$PWD\app\layout.tsx", $layout, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Updated app\layout.tsx"

# 3. Copy favicon artwork into public/
New-Item -ItemType Directory -Force -Path "$PWD\public" | Out-Null
Copy-Item -Path "$PWD\app\icon.svg" -Destination "$PWD\public\favicon.svg" -Force
Write-Host "Copied app\icon.svg -> public\favicon.svg"

# 4. Update components/Header.tsx
$header = @"
import Link from "next/link";
import { SITE_NAME } from "@/lib/config/site";
import SavedNavLink from "@/components/layout/SavedNavLink";

export default function Header() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/favicon.svg"
            alt={SITE_NAME}
            className="h-7 w-7 flex-shrink-0"
            width={28}
            height={28}
          />
          <span className="font-display text-lg font-bold tracking-tight text-ink" aria-label={SITE_NAME}>
            {SITE_NAME}
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-muted">
          <SavedNavLink />
          <Link href="/about" className="hover:text-ink transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-ink transition-colors hidden sm:inline">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
"@
[System.IO.File]::WriteAllText("$PWD\components\Header.tsx", $header, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Updated components\Header.tsx"

Write-Host "`nDone. Restart your dev server (npm run dev) to see the changes."
