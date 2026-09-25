/**
 * Renders the body sections, FAQ and related links of an SEO page file
 * (seo/pages/*.ts) below a tool. Styled to match the write-up sections on
 * the site report page. Server component, no data or security logic.
 */

import Link from "next/link";
import type { SeoPage } from "../types";

export default function SeoArticle({ page }: { page: SeoPage }) {
  return (
    <article className="mt-10 max-w-2xl">
      {page.sections.map((section) => (
        <section
          key={section.heading}
          id={section.id}
          className="mt-8 first:mt-0 text-sm text-muted leading-relaxed space-y-3 scroll-mt-6"
        >
          <h2 className="font-display text-lg font-bold text-ink">{section.heading}</h2>
          {section.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {section.bullets && (
            <ul className="list-disc pl-5 space-y-1.5">
              {section.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
          {section.after?.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
      ))}

      {page.faqs.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-ink mb-4">Frequently asked questions</h2>
          <div className="space-y-5">
            {page.faqs.map((item) => (
              <div key={item.q}>
                <h3 className="font-display text-sm font-semibold text-ink mb-1">{item.q}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {page.related.length > 0 && (
        <nav className="mt-10 text-sm" aria-label="Related tools">
          <h2 className="font-display text-lg font-bold text-ink mb-3">Related tools</h2>
          <ul className="space-y-1.5">
            {page.related.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-signal font-medium hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </article>
  );
}
