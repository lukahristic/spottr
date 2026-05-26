"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/browser";

/*
 * Footer — warm light theme (surface + cream) so the logo is naturally visible.
 * The section above (FAQ) is also cream, so we use the border-top to create
 * a visual separation instead of relying on background contrast.
 */
export default function FooterCTA() {
  const [email, setEmail] = useState("");
  const [gymName, setGymName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    const trimmedGym = gymName.trim();
    setStatus("loading");
    const { error } = await supabase.from("waitlist").insert({
      email: trimmed,
      gym_name: trimmedGym || null,
    });
    if (error) {
      setErrorMsg(error.code === "23505" ? "You're already on the list." : "Something went wrong. Try again.");
      setStatus("error");
    } else {
      setStatus("success");
    }
  }

  return (
    <footer className="bg-surface">

      {/* Big CTA — slightly darker surface for separation */}
      <div className="px-6 py-24 md:py-32 border-t-4 border-gold/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-5xl md:text-6xl xl:text-7xl leading-[1.05] text-ink">
            You&rsquo;re not<br />training alone.
          </h2>
          <p className="mt-6 text-lg text-mute leading-relaxed">
            Be among the first to know when Spottr opens at your gym.
          </p>

          <form
            className="mt-10 flex flex-col gap-3 max-w-md mx-auto"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your email"
                required
                disabled={status === "loading" || status === "success"}
                className="flex-1 px-5 py-3 rounded-full bg-cream text-ink placeholder:text-mute text-sm outline-none focus:ring-2 focus:ring-gold/40 transition-shadow border border-ink/10 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="px-7 py-3 rounded-full bg-gold text-ink font-medium text-sm hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-70"
              >
                {status === "loading" ? "Saving…" : status === "success" ? "You're in ✓" : "I'm in"}
              </button>
            </div>
            <input
              type="text"
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              placeholder="which gym do you train at? (optional)"
              disabled={status === "loading" || status === "success"}
              maxLength={120}
              className="px-5 py-3 rounded-full bg-cream text-ink placeholder:text-mute text-sm outline-none focus:ring-2 focus:ring-gold/40 transition-shadow border border-ink/10 disabled:opacity-50"
            />
          </form>
          {status === "success" && (
            <p className="mt-4 text-sm text-gold">You&rsquo;re on the list. We&rsquo;ll be in touch when Spottr opens at your gym.</p>
          )}
          {status === "error" && (
            <p className="mt-4 text-sm text-mute">{errorMsg}</p>
          )}
        </div>
      </div>

      {/* Footer strip */}
      <div className="px-6 py-8 border-t border-ink/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image
            src="/logo/wordmark.png"
            alt="Spottr"
            width={80}
            height={28}
            className="h-6 w-auto opacity-70"
          />
          <nav className="flex items-center gap-6 text-sm text-mute">
            <a
              href="mailto:hello@spottr.app"
              className="hover:text-ink transition-colors"
            >
              Contact
            </a>
            <a href="/safety" className="hover:text-ink transition-colors">Safety</a>
            <a href="/community" className="hover:text-ink transition-colors">Community</a>
            <a href="/privacy" className="hover:text-ink transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-ink transition-colors">Terms</a>
            <span>© 2026 Spottr</span>
          </nav>
        </div>
      </div>

    </footer>
  );
}
