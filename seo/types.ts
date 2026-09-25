/**
 * The shape every SEO page file in seo/pages/ follows.
 *
 * One file per page holds ALL of that page's search-facing content: the
 * <title>, meta description, H1, intro, body sections, FAQ and related
 * links. The route file in app/ just imports it, so copy can be edited
 * here without touching any code.
 *
 * CLIENT-SAFE. Contains no secrets.
 */

export interface SeoFaq {
  q: string;
  a: string;
}

export interface SeoSection {
  /** Optional anchor so other pages can link to this section (#how-it-works). */
  id?: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  /** Paragraphs shown after the bullets. */
  after?: string[];
}

export interface SeoLink {
  href: string;
  label: string;
}

export interface SeoPage {
  /** Route path, e.g. "/worth". Used for the canonical URL and breadcrumbs. */
  path: string;
  /** Full <title>. Aim for under 60 characters before the site name. */
  title: string;
  /** Meta description, 120 to 160 characters. */
  description: string;
  /** Short name used in breadcrumbs and structured data. */
  name: string;
  h1: string;
  intro: string;
  sections: SeoSection[];
  faqs: SeoFaq[];
  related: SeoLink[];
}
