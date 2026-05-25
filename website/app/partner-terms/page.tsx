import type { Metadata } from "next";
import Header from "@/components/nav/Header";
import MinimalFooter from "@/components/nav/MinimalFooter";

export const metadata: Metadata = {
  title: "Gym Partner Terms — Spottr",
  description:
    "The terms that apply when your gym is listed on Spottr. What we provide, what gyms can and cannot see, and how either side can end the relationship.",
};

export default function PartnerTermsPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-2xl mx-auto">

            <p className="text-xs uppercase tracking-[0.2em] text-mute mb-4">Legal</p>
            <h1 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
              Gym Partner Terms
            </h1>
            <p className="text-xs text-mute mt-4 mb-16">Last updated: May 2026</p>

            <div className="space-y-10 text-mute leading-relaxed">

              <div>
                <h2 className="font-medium text-ink mb-3">Who these apply to</h2>
                <p>
                  These terms apply to anyone with access to a gym&rsquo;s partner dashboard on Spottr — owners, operators, and any staff invited as a gym admin. By accepting these terms in the partner portal, you confirm you have authority to bind the gym to them.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">What Spottr provides</h2>
                <ul className="space-y-3">
                  <li>A listing for your gym in the Spottr app.</li>
                  <li>Aggregate check-in counts and basic activity for your location.</li>
                  <li>Tools to review member reports and verification requests relevant to your gym.</li>
                  <li>A QR poster and add-to-app flow so members can find your gym.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">What gyms cannot see</h2>
                <p>
                  Gyms do not see individual member profiles, messages, identities, or contact details — unless a member explicitly contacts the gym or appears in a report. Spottr is not an analytics product about your members; it&rsquo;s a social product for them.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Member data</h2>
                <p>
                  Member data is governed by the Spottr{" "}
                  <a href="/privacy" className="text-ink underline underline-offset-2">Privacy Policy</a>
                  . Gyms do not own member data and may not export, scrape, or resell it. Any information you do see in the partner dashboard is for operating your gym&rsquo;s presence on Spottr — not for marketing, profiling, or any other purpose.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Removal</h2>
                <p>
                  You can request removal from Spottr at any time by emailing{" "}
                  <a href="mailto:partners@spottr.app" className="text-ink underline underline-offset-2">
                    partners@spottr.app
                  </a>
                  . We&rsquo;ll deactivate the gym listing within 7 days and remove related partner access. Existing member data tied to the gym (check-in history, messages between members) follows the standard retention windows in our Privacy Policy.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Conduct</h2>
                <p>
                  Gyms are not responsible for member conduct on Spottr, and Spottr is not responsible for the safety of your physical facility. Each side is responsible for what it controls.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Suspension</h2>
                <p>
                  Spottr may revoke partner access for violations of these terms, for conduct that harms members, or in response to credible safety concerns. We&rsquo;ll explain the reason whenever we can.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Limitation of liability</h2>
                <p>
                  To the extent permitted by law, Spottr is not liable for indirect, incidental, or consequential damages arising from your gym&rsquo;s use of the partner portal. Spottr is provided as-is.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Changes</h2>
                <p>
                  We may update these terms. For material changes, we&rsquo;ll notify partner admins by email or in the portal at least 14 days before they take effect. Continued use of the partner dashboard after that date means you accept the new terms.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Contact</h2>
                <p>
                  Partner questions:{" "}
                  <a href="mailto:partners@spottr.app" className="text-ink underline underline-offset-2">
                    partners@spottr.app
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
