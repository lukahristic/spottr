import type { Metadata } from "next";
import Header from "@/components/nav/Header";
import FooterCTA from "@/components/sections/FooterCTA";
import FadeUp from "@/components/motion/FadeUp";

export const metadata: Metadata = {
  title: "Safety — Spottr",
  description: "How Spottr is designed around consent. You only appear while checked in. Openness resets every visit. One intro — they decide the rest.",
};

const principles = [
  {
    number: "01",
    heading: "You only appear while checked in.",
    body: [
      "There's no public profile. No searchable directory. Nobody can find you on Spottr unless you're actively checked in to the same gym, at the same time.",
      "The moment you leave — or after a set period — you disappear. Your check-in history isn't stored in a way others can access. You don't exist on the platform until you choose to.",
    ],
  },
  {
    number: "02",
    heading: "Openness resets every visit.",
    body: [
      "When you check in, \"Open to chat\" is always off by default. You choose it actively, each time. Not once, not as a preference — each visit.",
      "This matters because gym days are different. Some days you want to be left alone. Some days you're open. Spottr doesn't assume which day it is.",
    ],
  },
  {
    number: "03",
    heading: "One intro. They decide the rest.",
    body: [
      "If someone is open to chat, you can send one intro message. The thread stays read-only until they reply. If they don't reply, you can't send another.",
      "This isn't a soft limit — the UI enforces it. Persistent unsolicited contact is harassment. We designed it out.",
    ],
  },
];

const limits = [
  {
    title: "No passive presence.",
    body: "There's no background location tracking. No badge on your profile that shows when you were last active. If you're not checked in, you're invisible.",
  },
  {
    title: "No data brokering.",
    body: "We don't sell your data. Check-in history, messages, and profile information stay inside Spottr. We're not an ad platform.",
  },
  {
    title: "No second chances after a block.",
    body: "Once someone is blocked, they can't reach you again. Every block and report is logged. We review them.",
  },
];

export default function SafetyPage() {
  return (
    <>
      <Header />
      <main className="pt-20">

        {/* Hero */}
        <section className="px-6 py-24 md:py-32 bg-surface">
          <div className="max-w-3xl mx-auto">
            <FadeUp>
              <p className="text-xs uppercase tracking-[0.2em] text-mute mb-4">Safety</p>
              <h1 className="font-serif text-5xl md:text-6xl leading-[1.05] text-ink">
                Consent isn&rsquo;t a feature.<br />It&rsquo;s the foundation.
              </h1>
              <p className="mt-6 text-lg text-mute leading-relaxed max-w-xl">
                Spottr is designed so that visibility is always a choice — made fresh, each visit. Here&rsquo;s exactly how that works.
              </p>
            </FadeUp>
          </div>
        </section>

        {/* Three principles — expanded */}
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto">
            {principles.map((p, i) => (
              <FadeUp key={p.number} delay={i * 0.1}>
                <div className="border-t border-ink/10 py-12">
                  <span className="text-xs font-medium text-gold tracking-[0.15em]">
                    {p.number}
                  </span>
                  <h2 className="font-serif text-3xl md:text-4xl text-ink mt-3 leading-snug">
                    {p.heading}
                  </h2>
                  <div className="mt-5 space-y-3">
                    {p.body.map((para, j) => (
                      <p key={j} className="text-mute leading-relaxed">{para}</p>
                    ))}
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* What we don't do */}
        <section className="px-6 py-24 md:py-32 bg-surface">
          <div className="max-w-3xl mx-auto">
            <FadeUp>
              <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight mb-12">
                What we don&rsquo;t do.
              </h2>
            </FadeUp>
            <div>
              {limits.map((item, i) => (
                <FadeUp key={item.title} delay={i * 0.08}>
                  <div className="border-t border-ink/10 py-8">
                    <h3 className="font-medium text-ink">{item.title}</h3>
                    <p className="text-mute mt-2 leading-relaxed">{item.body}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* If something goes wrong */}
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto">
            <FadeUp>
              <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
                If something goes wrong.
              </h2>
              <p className="mt-6 text-mute leading-relaxed">
                You can block or report from any conversation — one tap. Once blocked, that person can&rsquo;t contact you again. Every report is reviewed manually.
              </p>
              <p className="mt-4 text-mute leading-relaxed">
                If you ever feel unsafe, email us directly at{" "}
                <a href="mailto:hello@spottr.app" className="text-ink underline underline-offset-2">
                  hello@spottr.app
                </a>
                . We&rsquo;ll respond.
              </p>
            </FadeUp>
          </div>
        </section>

      </main>
      <FooterCTA />
    </>
  );
}
