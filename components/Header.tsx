import Link from "next/link";
import { SITE_NAME } from "@/lib/config/site";
import SavedNavLink from "@/components/layout/SavedNavLink";

export default function Header() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-up animate-pulseDot" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-up" />
          </span>
          {/* Brand: "Is Site Up" with the last word highlighted */}
          <span className="font-display text-lg font-bold tracking-tight text-ink" aria-label={SITE_NAME}>
            Is Site <span className="text-signal">Up</span>
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
