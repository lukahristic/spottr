export default function ForGyms() {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="bg-surface rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          <div className="max-w-md">
            <p className="text-xs uppercase tracking-[0.2em] text-mute mb-2">
              For gyms
            </p>
            <h3 className="font-serif text-3xl md:text-4xl text-ink leading-tight">
              Already managing a gym?
            </h3>
            <p className="text-mute mt-3 leading-relaxed">
              Spottr has an admin layer built for gym owners and operators.
              Member counts, check-in visibility, and a QR-based onboarding
              flow that takes five minutes to set up.
            </p>
          </div>

          <a
            href="mailto:hello@spottr.app"
            className="flex-shrink-0 px-7 py-3 rounded-full border-2 border-ink text-ink font-medium text-sm hover:bg-ink hover:text-cream transition-colors whitespace-nowrap"
          >
            Get in touch
          </a>

        </div>
      </div>
    </section>
  );
}
