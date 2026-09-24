import Link from "next/link";
import { SITE_NAME } from "@/lib/config/site";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface mt-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
        <p>
          {SITE_NAME} performs a live check at the moment you ask &mdash; it is not
          affiliated with, or endorsed by, any service it checks.
        </p>
        <div className="flex items-center gap-5 shrink-0">
          <Link href="/about" className="hover:text-ink transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-ink transition-colors">
            Contact
          </Link>
          <Link href="/privacy" className="hover:text-ink transition-colors">
            Privacy
          </Link>
          <span>&copy; {new Date().getFullYear()} {SITE_NAME}</span>
        </div>
      </div>
    </footer>
  );
}
