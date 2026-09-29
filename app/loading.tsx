/**
 * Instant navigation feedback for the homepage. Next.js automatically wraps
 * page.tsx in a Suspense boundary using this as the fallback, so clicking a
 * link to "/" shows this immediately instead of the browser sitting on the
 * old page until getPopularSnapshot()/getRecentActivity() finish resolving.
 *
 * Loosely mirrors the real homepage layout (checker + rail ad, then a grid
 * of site tiles) so the swap-in doesn't jump around too much.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 sm:py-12 animate-pulse">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
        <div className="min-w-0 max-w-2xl">
          <div className="h-3 w-40 rounded bg-line mb-3" />
          <div className="h-9 w-full max-w-md rounded bg-line mb-3" />
          <div className="h-4 w-full rounded bg-line mb-2" />
          <div className="h-4 w-3/4 rounded bg-line mb-6" />
          <div className="h-[52px] rounded-xl bg-line" />
        </div>
        <aside className="hidden lg:block mt-6 lg:mt-0">
          <div className="h-[250px] rounded-lg bg-line" />
        </aside>
      </div>

      <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-11 rounded-lg bg-line" />
        ))}
      </div>
    </div>
  );
}
