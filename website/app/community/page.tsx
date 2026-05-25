import type { Metadata } from "next";
import Header from "@/components/nav/Header";
import MinimalFooter from "@/components/nav/MinimalFooter";

export const metadata: Metadata = {
  title: "Community Guidelines — Spottr",
  description:
    "The rules that keep Spottr a place where people feel safe enough to say hi at the gym.",
};

export default function CommunityPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-2xl mx-auto">

            <p className="text-xs uppercase tracking-[0.2em] text-mute mb-4">Community</p>
            <h1 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
              Community Guidelines
            </h1>
            <p className="text-xs text-mute mt-4 mb-16">Last updated: May 2026</p>

            <div className="space-y-10 text-mute leading-relaxed">

              <div>
                <h2 className="font-medium text-ink mb-3">Why we have rules</h2>
                <p>
                  Spottr only works if people feel safe enough to be visible at their gym. These guidelines exist to protect that. They apply to everyone on the platform — including the people you talk to and the people you might never message.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">What we expect</h2>
                <ul className="space-y-3">
                  <li>
                    <span className="text-ink font-medium">Consent first.</span> &ldquo;Open to chat&rdquo; means open to <em>one</em> message. If someone doesn&rsquo;t reply, that&rsquo;s their answer.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Respect openness signals.</span> Vibe and openness change. Treat each session as its own context.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Read the room.</span> The gym is a shared space. If someone&rsquo;s mid-set, headphones in, or clearly not in social mode, leave them be.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Be the person you&rsquo;d want to meet.</span> Warm beats clever. Calm beats persistent.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">What gets you removed</h2>
                <ul className="space-y-3">
                  <li>Harassment, intimidation, or sustained unwanted attention.</li>
                  <li>Trying to contact someone after they&rsquo;ve blocked you, on or off Spottr.</li>
                  <li>Stalking behaviour — tracking someone&rsquo;s gym attendance, showing up to corner them, etc.</li>
                  <li>Impersonation or fake profiles.</li>
                  <li>Discrimination based on race, gender, sexuality, body, religion, or disability.</li>
                  <li>Sharing another member&rsquo;s identity, photos, or messages outside Spottr without their consent.</li>
                  <li>Commercial solicitation, recruiting, or spam.</li>
                  <li>Anything you&rsquo;d be embarrassed to read out loud at the front desk.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Zero tolerance</h2>
                <p>
                  Some things result in immediate permanent removal — no warnings, no second chances:
                </p>
                <ul className="space-y-3 mt-4">
                  <li>Anything involving minors. Spottr is 18+, and we treat any attempt to evade that as the most serious violation.</li>
                  <li>Credible threats of physical harm.</li>
                  <li>Sexual content or messages sent without consent.</li>
                  <li>Conduct we reasonably believe to be illegal. We may preserve relevant data and refer to law enforcement.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">How we enforce</h2>
                <p>
                  Reports are reviewed and we aim to respond within 48 hours. Outcomes scale with severity:
                </p>
                <ul className="space-y-3 mt-4">
                  <li><span className="text-ink font-medium">Warning</span> — first or minor incidents.</li>
                  <li><span className="text-ink font-medium">Temporary suspension</span> — repeated or moderate incidents.</li>
                  <li><span className="text-ink font-medium">Permanent ban</span> — repeat suspensions or serious incidents.</li>
                </ul>
                <p className="mt-4">
                  Zero-tolerance violations skip directly to permanent ban.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Appeals</h2>
                <p>
                  If you believe a decision was wrong, email{" "}
                  <a href="mailto:safety@spottr.app" className="text-ink underline underline-offset-2">
                    safety@spottr.app
                  </a>{" "}
                  with your case. We aim to review appeals within 7 days.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Off-platform conduct</h2>
                <p>
                  If something happens at the gym after you connect on Spottr, we may still act on it. The platform is part of how you met, and we take that seriously.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Contact</h2>
                <p>
                  Safety concerns:{" "}
                  <a href="mailto:safety@spottr.app" className="text-ink underline underline-offset-2">
                    safety@spottr.app
                  </a>
                  . Everything else:{" "}
                  <a href="mailto:hello@spottr.app" className="text-ink underline underline-offset-2">
                    hello@spottr.app
                  </a>
                  .
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>
      <MinimalFooter />
    </>
  );
}
