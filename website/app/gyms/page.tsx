import type { Metadata } from "next";
import Header from "@/components/nav/Header";
import MinimalFooter from "@/components/nav/MinimalFooter";
import FadeUp from "@/components/motion/FadeUp";

export const metadata: Metadata = {
  title: "For Gyms — Spottr",
  description: "Add Spottr to your gym. Free to set up, five minutes to go live. Give your members a way to connect that actually respects them.",
};

const reasons = [
  {
    number: "01",
    title: "Your members are already thinking about it.",
    body: "The awkward nod, the almost-said-something moment — it happens at every gym. Spottr gives your members a dignified way to break the ice. That's good for how people feel about your space.",
  },
  {
    number: "02",
    title: "Free. For you and your members.",
    body: "Spottr costs nothing to set up and nothing to run. No ads, no upsells, no tiers. The core product is free, always — for gyms and for members.",
  },
  {
    number: "03",
    title: "Takes five minutes to go live.",
    body: "Add your gym via QR code scan, or manually through the app. Once it's live, members can check in. You don't need to manage anything day-to-day.",
  },
];

const steps = [
  {
    number: "01",
    step: "Add your gym",
    detail: "Scan a QR code at your location, or add it manually through the Spottr app. Your gym gets a unique check-in point on the platform.",
  },
  {
    number: "02",
    step: "Members check in",
    detail: "Spottr members at your gym see the live list when they check in. No installs or configuration required from you.",
  },
  {
    number: "03",
    step: "You see the activity",
    detail: "Your admin dashboard shows real-time check-in counts and general activity. No personal data — just the pulse of your gym.",
  },
];

export default function GymsPage() {
  return (
    <>
      <Header />
      <main className="pt-20">

        {/* Hero */}
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto">
            <FadeUp>
              <p className="text-xs uppercase tracking-[0.2em] text-mute mb-4">For gym owners</p>
              <h1 className="font-serif text-5xl md:text-6xl xl:text-7xl leading-[1.05] text-ink">
                Your gym.<br />Their community.
              </h1>
              <p className="mt-6 text-lg text-mute leading-relaxed max-w-xl">
                Spottr adds a real-time social layer to your gym — helping members feel more connected, and more likely to come back.
              </p>
              <a
                href="mailto:hello@spottr.app"
                className="mt-10 inline-flex items-center px-7 py-3 rounded-full bg-gold text-ink font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Get in touch
              </a>
            </FadeUp>
          </div>
        </section>

        {/* Why it matters */}
        <section className="px-6 py-24 md:py-32 bg-surface">
          <div className="max-w-3xl mx-auto">
            <FadeUp className="mb-16">
              <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
                Why it matters<br />for your gym.
              </h2>
            </FadeUp>
            <div>
              {reasons.map((r, i) => (
                <FadeUp key={r.number} delay={i * 0.1}>
                  <div className="border-t border-ink/10 py-10">
                    <span className="text-xs font-medium text-gold tracking-[0.15em]">{r.number}</span>
                    <h3 className="font-serif text-2xl md:text-3xl text-ink mt-3 leading-snug">
                      {r.title}
                    </h3>
                    <p className="text-mute mt-4 leading-relaxed">{r.body}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* How to add your gym */}
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto">
            <FadeUp className="mb-16">
              <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
                How to add<br />your gym.
              </h2>
            </FadeUp>
            <div>
              {steps.map((s, i) => (
                <FadeUp key={s.number} delay={i * 0.1}>
                  <div className="border-t border-ink/10 py-8 flex gap-8">
                    <span className="text-xs font-medium text-gold tracking-[0.15em] mt-1 flex-shrink-0">
                      {s.number}
                    </span>
                    <div>
                      <h3 className="font-medium text-ink text-lg">{s.step}</h3>
                      <p className="text-mute mt-2 leading-relaxed">{s.detail}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* Admin dashboard proof */}
        <section className="px-6 py-24 md:py-32 bg-surface">
          <div className="max-w-3xl mx-auto">
            <FadeUp>
              <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
                You&rsquo;re not flying blind.
              </h2>
              <p className="mt-6 text-mute leading-relaxed">
                Gym owners and operators get access to a dedicated admin dashboard — check-in counts, peak hours, and an activity overview. Read-only by design: we show you the pulse of your gym, not personal data about individual members.
              </p>
              <p className="mt-4 text-mute leading-relaxed">
                Managing multiple locations? Each gym is listed separately. Your staff can be added as operators.
              </p>
            </FadeUp>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto">
            <FadeUp>
              <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
                Ready to add<br />your gym?
              </h2>
              <p className="mt-6 text-mute leading-relaxed max-w-lg">
                Spottr is in private rollout. Email us and we&rsquo;ll set up your gym personally — usually within 24 hours.
              </p>
              <a
                href="mailto:hello@spottr.app"
                className="mt-10 inline-flex items-center px-7 py-3 rounded-full border-2 border-ink text-ink font-medium text-sm hover:bg-ink hover:text-cream transition-colors"
              >
                hello@spottr.app
              </a>
            </FadeUp>
          </div>
        </section>

      </main>
      <MinimalFooter />
    </>
  );
}
