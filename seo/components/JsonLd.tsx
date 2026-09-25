/**
 * Renders structured data as <script type="application/ld+json">.
 *
 * SECURITY: only pass data built from our own SEO files, never text from
 * checked sites. "<" is escaped so content can't close the script tag.
 * Contains no secrets.
 */

export default function JsonLd({ data }: { data: Record<string, unknown>[] }) {
  const json = JSON.stringify(data.length === 1 ? data[0] : data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
