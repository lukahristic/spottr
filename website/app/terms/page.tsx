import type { Metadata } from "next";
import Header from "@/components/nav/Header";
import MinimalFooter from "@/components/nav/MinimalFooter";

export const metadata: Metadata = {
  title: "Terms — Spottr",
  description: "Terms of use for Spottr. Use it to connect at the gym — not for anything else.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-2xl mx-auto">

            <p className="text-xs uppercase tracking-[0.2em] text-mute mb-4">Legal</p>
            <h1 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
              Terms of Use
            </h1>
            <p className="text-xs text-mute mt-4 mb-16">Last updated: May 2026</p>

            <div className="space-y-10 text-mute leading-relaxed">

              <div>
                <h2 className="font-medium text-ink mb-3">Acceptance</h2>
                <p>
                  By using Spottr, you agree to these terms. If you don&rsquo;t agree, don&rsquo;t use the app.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Who can use Spottr</h2>
                <p>
                  You must be at least 13 years old to use Spottr. By using the app, you confirm that you meet this requirement.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">What Spottr is for</h2>
                <p>
                  Spottr is for gym members who want to connect with people at the same gym — to say hi, find a spotter, or share energy. Use it for that. Use it respectfully.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">What&rsquo;s not allowed</h2>
                <ul className="space-y-3">
                  <li>Harassing, threatening, or intimidating other members.</li>
                  <li>Collecting or scraping personal information about other users.</li>
                  <li>Creating fake profiles or impersonating others.</li>
                  <li>Using Spottr for commercial solicitation or spam.</li>
                  <li>Attempting to circumvent blocks, bans, or platform restrictions.</li>
                  <li>Any conduct that would make the gym feel less safe for others.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Enforcement</h2>
                <p>
                  We can suspend or permanently remove accounts that violate these terms. If you&rsquo;re blocked by another member, that block is final — you can&rsquo;t contact them again through Spottr. We review every report we receive.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Your content</h2>
                <p>
                  You own what you write. By sending messages or updating your profile, you give us a limited licence to store and display that content to the relevant people within the app. We don&rsquo;t use your content for anything else.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Service availability</h2>
                <p>
                  Spottr is provided as-is. We don&rsquo;t guarantee uninterrupted service, and we reserve the right to change or discontinue features. We won&rsquo;t make major changes without reasonable notice.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Limitation of liability</h2>
                <p>
                  To the extent permitted by law, Spottr is not liable for indirect, incidental, or consequential damages arising from your use of the app.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Governing law</h2>
                <p>
                  These terms are governed by the laws of the Philippines.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Contact</h2>
                <p>
                  Questions about these terms:{" "}
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
