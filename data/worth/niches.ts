/**
 * Website niches used by the worth engine to pick an advertising RPM range
 * (revenue per 1,000 pageviews) and a typical pages-per-visit figure.
 *
 * RPM ranges are deliberately conservative display-ad page RPMs for mostly
 * English-speaking, tier-1 traffic. Tune them here as you learn more; the
 * engine reads nothing else about niches.
 *
 * Detection: the page's title, description, headings and opening text are
 * scored against `keywords` (whole-word, lowercase). Highest score wins;
 * "general" is the fallback.
 *
 * CLIENT-SAFE. Contains no secrets.
 */

export interface Niche {
  id: string;
  label: string;
  /** Display-ad page RPM in USD, [low, high]. */
  rpm: [number, number];
  /**
   * Typical paid-search cost-per-click in USD, [low, high]. A genuinely
   * different figure from display RPM (search ads are bid per click, not
   * per 1,000 impressions), used by the traffic value calculator. Rough
   * public-benchmark ranges; real CPC varies a lot by exact keyword.
   */
  searchCpc: [number, number];
  pagesPerVisit: number;
  keywords: string[];
}

export const NICHES: Niche[] = [
  {
    id: "finance",
    label: "Finance & investing",
    rpm: [14, 32],
    searchCpc: [8, 25],
    pagesPerVisit: 2.4,
    keywords: ["finance", "invest", "investing", "stocks", "loan", "loans", "mortgage", "credit", "banking", "bank", "tax", "retirement", "trading", "crypto", "bitcoin", "budget", "money", "savings", "defi"],
  },
  {
    id: "insurance",
    label: "Insurance",
    rpm: [18, 40],
    searchCpc: [15, 40],
    pagesPerVisit: 2.1,
    keywords: ["insurance", "insurer", "premium", "coverage", "policy", "claims", "underwriting"],
  },
  {
    id: "legal",
    label: "Legal",
    rpm: [14, 35],
    searchCpc: [10, 30],
    pagesPerVisit: 2.0,
    keywords: ["lawyer", "attorney", "legal", "law", "lawsuit", "solicitor", "court", "injury", "divorce"],
  },
  {
    id: "business",
    label: "Business & software",
    rpm: [10, 24],
    searchCpc: [4, 12],
    pagesPerVisit: 2.6,
    keywords: ["saas", "software", "platform", "business", "marketing", "crm", "analytics", "startup", "enterprise", "b2b", "productivity", "hosting", "seo", "api", "developer", "developers"],
  },
  {
    id: "health",
    label: "Health & fitness",
    rpm: [8, 20],
    searchCpc: [2, 6],
    pagesPerVisit: 2.2,
    keywords: ["health", "medical", "doctor", "clinic", "fitness", "workout", "nutrition", "diet", "wellness", "symptoms", "therapy", "pharmacy", "supplements"],
  },
  {
    id: "realestate",
    label: "Real estate & home",
    rpm: [8, 20],
    searchCpc: [2, 5],
    pagesPerVisit: 3.2,
    keywords: ["real estate", "property", "properties", "homes", "apartment", "rent", "rental", "realtor", "house", "renovation", "interior", "furniture", "garden", "diy"],
  },
  {
    id: "travel",
    label: "Travel",
    rpm: [6, 15],
    searchCpc: [1, 3],
    pagesPerVisit: 2.8,
    keywords: ["travel", "hotel", "hotels", "flights", "flight", "vacation", "holiday", "tour", "tours", "destination", "booking", "resort", "trip"],
  },
  {
    id: "education",
    label: "Education",
    rpm: [5, 13],
    searchCpc: [2, 5],
    pagesPerVisit: 2.7,
    keywords: ["course", "courses", "learn", "learning", "education", "school", "university", "tutorial", "tutorials", "students", "study", "lesson", "exam"],
  },
  {
    id: "tech",
    label: "Technology",
    rpm: [5, 13],
    searchCpc: [1, 3],
    pagesPerVisit: 2.3,
    keywords: ["tech", "technology", "gadget", "gadgets", "smartphone", "laptop", "review", "reviews", "android", "iphone", "computer", "ai", "hardware", "apps"],
  },
  {
    id: "food",
    label: "Food & recipes",
    rpm: [6, 15],
    searchCpc: [0.5, 1.5],
    pagesPerVisit: 2.0,
    keywords: ["recipe", "recipes", "food", "cooking", "baking", "kitchen", "restaurant", "meal", "dinner", "vegan", "chef"],
  },
  {
    id: "shopping",
    label: "Online store",
    rpm: [4, 11],
    searchCpc: [0.5, 2],
    pagesPerVisit: 4.5,
    keywords: ["shop", "store", "cart", "checkout", "buy", "sale", "shipping", "products", "collection", "deals", "fashion", "clothing", "shoes"],
  },
  {
    id: "news",
    label: "News & media",
    rpm: [4, 10],
    searchCpc: [0.3, 1],
    pagesPerVisit: 2.2,
    keywords: ["news", "breaking", "headlines", "politics", "journalism", "latest", "world", "opinion", "editorial", "report"],
  },
  {
    id: "tools",
    label: "Online tools",
    rpm: [3, 9],
    searchCpc: [0.3, 1],
    pagesPerVisit: 1.7,
    keywords: ["calculator", "converter", "generator", "tool", "tools", "checker", "online", "free", "compress", "pdf", "convert"],
  },
  {
    id: "entertainment",
    label: "Entertainment",
    rpm: [2, 6],
    searchCpc: [0.3, 1],
    pagesPerVisit: 3.0,
    keywords: ["movies", "movie", "music", "celebrity", "tv", "streaming", "video", "videos", "games", "gaming", "anime", "memes", "funny"],
  },
  {
    id: "community",
    label: "Forum & community",
    rpm: [2, 6],
    searchCpc: [0.3, 1],
    pagesPerVisit: 4.0,
    keywords: ["forum", "community", "discussion", "members", "threads", "posts", "chat", "social"],
  },
];

export const GENERAL_NICHE: Niche = {
  id: "general",
  label: "General",
  rpm: [3, 8],
  searchCpc: [0.5, 1.5],
  pagesPerVisit: 2.3,
  keywords: [],
};

/**
 * Advertising value of visitors varies by country. A country-code domain is
 * the only country signal we have, so it nudges the RPM. Anything not listed
 * (including .com, .org, .io) uses 1.
 */
export const TLD_RPM_MULTIPLIER: Record<string, number> = {
  us: 1.1,
  uk: 0.95,
  ca: 0.95,
  au: 0.95,
  nz: 0.9,
  ch: 1.0,
  no: 0.95,
  se: 0.85,
  dk: 0.85,
  de: 0.8,
  nl: 0.8,
  ie: 0.85,
  fr: 0.7,
  jp: 0.8,
  sg: 0.8,
  it: 0.55,
  es: 0.55,
  pl: 0.4,
  br: 0.3,
  mx: 0.3,
  ru: 0.25,
  tr: 0.25,
  in: 0.2,
  id: 0.2,
  ph: 0.2,
  pk: 0.15,
  ng: 0.15,
  vn: 0.15,
  bd: 0.12,
};
