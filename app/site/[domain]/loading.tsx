export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 sm:py-12 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 animate-pulse">
      <div className="min-w-0">
        <div className="h-4 w-40 rounded bg-line mb-4" />
        <div className="h-28 rounded-2xl bg-line mb-4" />
        <div className="h-36 rounded-lg bg-line mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-line" />
          ))}
        </div>
      </div>
      <aside className="hidden lg:block space-y-6">
        <div className="h-[250px] rounded-lg bg-line" />
        <div className="h-[300px] rounded-xl bg-line" />
      </aside>
    </div>
  );
}