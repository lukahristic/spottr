import Image from "next/image";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-cream/80 backdrop-blur-sm border-b border-surface">
      <a href="/" aria-label="Spottr home">
        <Image
          src="/logo/wordmark.png"
          alt="Spottr"
          width={100}
          height={36}
          className="h-7 w-auto"
          priority
        />
      </a>

      <a
        href="#waitlist"
        className="px-5 py-2 rounded-full bg-gold text-ink text-sm font-medium hover:opacity-90 transition-opacity"
      >
        I&rsquo;m in
      </a>
    </header>
  );
}
