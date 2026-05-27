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
                    <span className="text-ink font-medium">Profile photo</span> — optional. If you take a selfie via the in-app camera, the photo is stored in our hosting provider&rsquo;s secure storage so other gym members can recognize you on the live list. We don&rsquo;t access your photo library — only the camera, only when you ask. You can delete or replace the photo from your profile settings at any time. There is no facial recognition, no AI processing, and no use of your photo outside Spottr.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Check-in data</span> — which gym you checked in to, and when.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Precise location</span> — when you check in, your device&rsquo;s GPS is used briefly to confirm you&rsquo;re inside the gym. This reading is processed on your device and is never sent to our servers or stored. We only keep the gym you checked into and the time.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Status and vibe</span> — your current vibe and whether you&rsquo;re open to chat. This resets every session.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Messages</span> — conversations you have with other members inside the app.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Women&rsquo;s verification</span> — if you request verification, we store only the outcome (approved or pending) and the date. We don&rsquo;t currently collect identity documents or photos for this feature. If that ever changes, this policy will be updated and you&rsquo;ll be notified.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Device info</span> — IP address, device type, and app version. Used for security and debugging only.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Push notification tokens</span> — if you allow notifications, we store the device token Apple or Google issues to us so we can send you message and check-in alerts. You can revoke this anytime in your device settings.
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
                <h2 className="font-medium text-ink mb-3">How long we keep it</h2>
                <ul className="space-y-3">
                  <li><span className="text-ink font-medium">Profile and account</span> — until you delete your account.</li>
                  <li><span className="text-ink font-medium">Check-in records</span> — 12 months, then automatically deleted.</li>
                  <li><span className="text-ink font-medium">Messages</span> — kept while both participants have active accounts. When either deletes, the thread is removed within 30 days.</li>
                  <li><span className="text-ink font-medium">Profile photo</span> — kept until you remove it or delete your account.</li>
                  <li><span className="text-ink font-medium">Reports about another user</span> — retained for 24 months to support moderation history, then deleted.</li>
                  <li><span className="text-ink font-medium">Push tokens</span> — until you turn off notifications or uninstall the app.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-medium text-ink mb-3">Cookies and analytics</h2>
                <p>
                  Our website doesn&rsquo;t currently run any analytics or tracking scripts. We don&rsquo;t use advertising cookies. The app itself doesn&rsquo;t use third-party analytics SDKs. If we ever add analytics, this policy will be updated first.
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
