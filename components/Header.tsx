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
          <Link href="/worth" className="hover:text-ink transition-colors whitespace-nowrap">
            <span className="sm:hidden">Worth</span>
            <span className="hidden sm:inline">Website worth</span>
          </Link>
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
