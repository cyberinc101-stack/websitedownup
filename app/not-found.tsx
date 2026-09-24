import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-down mb-3">
        404 — Down
      </p>
      <h1 className="font-display text-2xl font-bold text-ink mb-3">
        This page isn&apos;t reachable
      </h1>
      <p className="text-muted mb-6">
        Unlike the sites we check, this one&apos;s not coming back up — it
        just doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="inline-flex rounded-lg bg-signal text-white font-semibold px-5 py-2.5 hover:bg-signal-dark transition-colors"
      >
        Check a site instead
      </Link>
    </div>
  );
}
