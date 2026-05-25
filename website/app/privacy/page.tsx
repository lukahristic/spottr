import type { Metadata } from "next";
import Header from "@/components/nav/Header";
import MinimalFooter from "@/components/nav/MinimalFooter";

export const metadata: Metadata = {
  title: "Privacy — Spottr",
  description: "How Spottr handles your data. We don't sell it. We don't broker it. You can delete everything.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-2xl mx-auto">

            <p className="text-xs uppercase tracking-[0.2em] text-mute mb-4">Legal</p>
            <h1 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-mute mt-4 mb-16">Last updated: May 2026</p>

            <div className="space-y-10 text-mute leading-relaxed">

              <div>
                <h2 className="font-medium text-ink mb-3">Who we are</h2>
                <p>
                  Spottr is a gym social app built to help people connect safely inside the same gym. We&rsquo;re a small team. Questions? Email{" "}
                  <a href="mailto:hello@spottr.app" className="text-ink underline underline-offset-2">
                    hello@spottr.app
                  </a>
                  .
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">What we collect</h2>
                <ul className="space-y-3">
                  <li>
                    <span className="text-ink font-medium">Email address</span> — if you join the waitlist or create an account.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Profile info</span> — your name, short bio, and fitness details you choose to add.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Check-in data</span> — which gym you checked in to, and when.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Status and vibe</span> — your current vibe and whether you&rsquo;re open to chat. This resets every session.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Messages</span> — conversations you have with other members inside the app.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Device info</span> — IP address, device type, and app version. Used for security and debugging only.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">How we use it</h2>
                <p>
                  We use your data to run Spottr — showing you who&rsquo;s at your gym right now, letting you connect with members who are open to chat, and keeping your account secure. That&rsquo;s it. We don&rsquo;t use it for advertising. We don&rsquo;t sell it or broker it to anyone.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Third-party services</h2>
                <p>
                  We use <a href="https://supabase.com" className="text-ink underline underline-offset-2">Supabase</a> for database and authentication infrastructure. Your data is stored on their servers in Singapore (ap-southeast-1). We don&rsquo;t share your data with any other third parties beyond what&rsquo;s needed to operate the service.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Visibility</h2>
                <p>
                  Spottr is designed to minimize your footprint. You&rsquo;re only visible on the live member list when you&rsquo;re actively checked in at a gym. The moment you leave, you disappear from the list. There is no passive presence, no public profile, and no searchable directory.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Your rights</h2>
                <p>
                  You can delete your account and all associated data at any time from the app settings. Deleting your account removes your profile, check-in history, and messages. If you need help with this, email us and we&rsquo;ll do it manually.
                </p>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Contact</h2>
                <p>
                  Questions or requests about your data:{" "}
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
