import Image from "next/image";

/*
 * Minimal footer — logo + nav links only, no waitlist CTA.
 * Used on supporting pages (safety, gyms, privacy, terms) where the
 * big "You're not training alone" CTA would feel out of place.
 */
export default function MinimalFooter() {
  return (
    <footer className="bg-surface border-t border-ink/10">
      <div className="px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <a href="/" aria-label="Back to Spottr home">
            <Image
              src="/logo/wordmark.png"
              alt="Spottr"
              width={80}
              height={28}
              className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
            />
          </a>
          <nav className="flex items-center gap-6 text-sm text-mute">
            <a href="mailto:hello@spottr.app" className="hover:text-ink transition-colors">
              Contact
            </a>
            <a href="/privacy" className="hover:text-ink transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-ink transition-colors">Terms</a>
            <span>© 2025 Spottr</span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
