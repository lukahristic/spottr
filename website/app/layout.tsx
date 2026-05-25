import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

/*
 * Typography
 *
 * Fraunces — warm variable serif for headlines. Gives the site editorial feel.
 * Inter    — clean humanist sans for body. Pairs cleanly with Fraunces.
 *
 * Both are self-hosted by next/font: no Google network requests in production,
 * no layout shift on load. The `variable` option exposes a CSS custom property
 * we wire into `@theme` in globals.css.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Spottr — You're not training alone.",
  description:
    "A quiet way to say hi to the people at your gym. Consent-first, presence-based, never pushy.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable}`}
    >
      <body className="min-h-screen bg-cream text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
