/**
 * Additional well-known domains for SEO discovery only.
 * NOT used for live status checking (that stays in lib/sites.ts,
 * kept small on purpose) — these only feed the sitemap, so Google
 * can find and index a /site/[domain] page for each one. The page
 * itself is fully dynamic and works for any domain typed in.
 */

export interface SeoDomain {
  domain: string;
  category: string;
}

export const SEO_DOMAINS: SeoDomain[] = [
  // NZ banks & finance
  { domain: "asb.co.nz", category: "Banking" },
  { domain: "bnz.co.nz", category: "Banking" },
  { domain: "kiwibank.co.nz", category: "Banking" },
  { domain: "westpac.co.nz", category: "Banking" },
  { domain: "tsb.co.nz", category: "Banking" },

  // NZ telecom / utilities
  { domain: "spark.co.nz", category: "Telecom" },
  { domain: "one.nz", category: "Telecom" },
  { domain: "2degreesmobile.co.nz", category: "Telecom" },
  { domain: "chorus.co.nz", category: "Telecom" },
  { domain: "contact.co.nz", category: "Utility" },

  // NZ retail
  { domain: "thewarehouse.co.nz", category: "Shopping" },
  { domain: "woolworths.co.nz", category: "Shopping" },
  { domain: "newworld.co.nz", category: "Shopping" },
  { domain: "mitre10.co.nz", category: "Shopping" },
  { domain: "trademe.co.nz", category: "Shopping" },
  { domain: "briscoes.co.nz", category: "Shopping" },

  // NZ government & services
  { domain: "nzpost.co.nz", category: "Government" },
  { domain: "ird.govt.nz", category: "Government" },
  { domain: "nzta.govt.nz", category: "Government" },
  { domain: "immigration.govt.nz", category: "Government" },

  // NZ news
  { domain: "nzherald.co.nz", category: "News" },
  { domain: "stuff.co.nz", category: "News" },
  { domain: "rnz.co.nz", category: "News" },

  // Airlines & travel
  { domain: "airnewzealand.co.nz", category: "Travel" },
  { domain: "jetstar.com", category: "Travel" },
  { domain: "qantas.com", category: "Travel" },
  { domain: "delta.com", category: "Travel" },
  { domain: "united.com", category: "Travel" },
  { domain: "aa.com", category: "Travel" },
  { domain: "britishairways.com", category: "Travel" },
  { domain: "emirates.com", category: "Travel" },
  { domain: "ryanair.com", category: "Travel" },
  { domain: "southwest.com", category: "Travel" },
  { domain: "lufthansa.com", category: "Travel" },

  // International banks & fintech
  { domain: "bankofamerica.com", category: "Banking" },
  { domain: "chase.com", category: "Banking" },
  { domain: "wellsfargo.com", category: "Banking" },
  { domain: "citi.com", category: "Banking" },
  { domain: "hsbc.com", category: "Banking" },
  { domain: "barclays.co.uk", category: "Banking" },
  { domain: "revolut.com", category: "Payments" },
  { domain: "wise.com", category: "Payments" },
  { domain: "monzo.com", category: "Banking" },
  { domain: "squareup.com", category: "Payments" },
  { domain: "klarna.com", category: "Payments" },
  { domain: "afterpay.com", category: "Payments" },
  { domain: "kraken.com", category: "Crypto" },
  { domain: "crypto.com", category: "Crypto" },
  { domain: "robinhood.com", category: "Finance" },
  { domain: "etoro.com", category: "Finance" },

  // Retail / e-commerce
  { domain: "target.com", category: "Shopping" },
  { domain: "bestbuy.com", category: "Shopping" },
  { domain: "costco.com", category: "Shopping" },
  { domain: "homedepot.com", category: "Shopping" },
  { domain: "ikea.com", category: "Shopping" },
  { domain: "zara.com", category: "Shopping" },
  { domain: "nike.com", category: "Shopping" },
  { domain: "adidas.com", category: "Shopping" },
  { domain: "asos.com", category: "Shopping" },
  { domain: "newegg.com", category: "Shopping" },

  // Streaming & media
  { domain: "peacocktv.com", category: "Streaming" },
  { domain: "paramountplus.com", category: "Streaming" },
  { domain: "crunchyroll.com", category: "Streaming" },
  { domain: "vimeo.com", category: "Video" },
  { domain: "pandora.com", category: "Music" },
  { domain: "deezer.com", category: "Music" },
  { domain: "iheart.com", category: "Music" },

  // Dev tools & cloud
  { domain: "bitbucket.org", category: "Dev" },
  { domain: "npmjs.com", category: "Dev" },
  { domain: "docker.com", category: "Dev" },
  { domain: "firebase.google.com", category: "Dev" },
  { domain: "netlify.com", category: "Infra" },
  { domain: "render.com", category: "Infra" },
  { domain: "supabase.com", category: "Dev" },
  { domain: "mongodb.com", category: "Dev" },
  { domain: "postman.com", category: "Dev" },
  { domain: "linear.app", category: "Work" },
  { domain: "asana.com", category: "Work" },
  { domain: "monday.com", category: "Work" },
  { domain: "zapier.com", category: "Tools" },
  { domain: "cloudinary.com", category: "Dev" },

  // Productivity & email
  { domain: "proton.me", category: "Email" },
  { domain: "zoho.com", category: "Work" },
  { domain: "drive.google.com", category: "Cloud" },
  { domain: "evernote.com", category: "Tools" },
  { domain: "docs.google.com", category: "Work" },

  // Gaming
  { domain: "pubg.com", category: "Gaming" },
  { domain: "playvalorant.com", category: "Gaming" },
  { domain: "hoyoverse.com", category: "Gaming" },
  { domain: "itch.io", category: "Gaming" },
  { domain: "gog.com", category: "Gaming" },

  // News (international)
  { domain: "reuters.com", category: "News" },
  { domain: "foxnews.com", category: "News" },
  { domain: "aljazeera.com", category: "News" },
  { domain: "abc.net.au", category: "News" },
  { domain: "accuweather.com", category: "Weather" },

  // Food delivery
  { domain: "grubhub.com", category: "Food" },
  { domain: "deliveroo.com", category: "Food" },
  { domain: "just-eat.co.uk", category: "Food" },

  // Social & chat
  { domain: "viber.com", category: "Chat" },
  { domain: "wechat.com", category: "Chat" },
  { domain: "line.me", category: "Chat" },
  { domain: "joinmastodon.org", category: "Social" },

  // Health & fitness
  { domain: "myfitnesspal.com", category: "Health" },
  { domain: "strava.com", category: "Fitness" },
  { domain: "fitbit.com", category: "Fitness" },
  { domain: "webmd.com", category: "Health" },

  // Education
  { domain: "coursera.org", category: "Education" },
  { domain: "udemy.com", category: "Education" },
  { domain: "khanacademy.org", category: "Education" },
  { domain: "edx.org", category: "Education" },

  // Real estate
  { domain: "zillow.com", category: "Real Estate" },
  { domain: "realtor.com", category: "Real Estate" },
  { domain: "redfin.com", category: "Real Estate" },

  // Jobs
  { domain: "indeed.com", category: "Jobs" },
  { domain: "glassdoor.com", category: "Jobs" },
  { domain: "seek.co.nz", category: "Jobs" },

  // Search & portals
  { domain: "duckduckgo.com", category: "Search" },
  { domain: "yandex.com", category: "Search" },
  { domain: "baidu.com", category: "Search" },

  // Security & VPN
  { domain: "nordvpn.com", category: "Security" },
  { domain: "expressvpn.com", category: "Security" },
  { domain: "1password.com", category: "Security" },
  { domain: "lastpass.com", category: "Security" },
];