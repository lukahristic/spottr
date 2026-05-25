import PhoneFrame from "@/components/ui/PhoneFrame";
import FadeUp from "@/components/motion/FadeUp";

const steps = [
  {
    number: "01",
    title: "Check in to your gym",
    description:
      "Pick your gym, set today's vibe, and let people know you're around.",
    screenshot: "/screenshots/your-gyms-list.png",
    alt: "Your gyms list showing Anytime Fitness BGC and other options",
  },
  {
    number: "02",
    title: "Set your vibe",
    description:
      "Six options. One custom note if you want. Open to chat is always your call.",
    screenshot: "/screenshots/checkin.png",
    alt: "Vibe selector with options like Locked in, Finding my rhythm, In between sets",
  },
  {
    number: "03",
    title: "Say hi when you're ready",
    description:
      "One intro message. They decide if they want to reply. No pressure either way.",
    screenshot: "/screenshots/member-detail.png",
    alt: "Member detail showing Princess's profile with a Send an intro form",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24 md:py-32">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <FadeUp className="max-w-xl mb-16 md:mb-20">
          <p className="text-xs uppercase tracking-[0.2em] text-mute mb-4">
            How it works
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
            Three steps.<br />No awkward moments.
          </h2>
        </FadeUp>

        {/* Steps — staggered via delay prop */}
        <div className="grid md:grid-cols-3 gap-14 md:gap-8">
          {steps.map((step, i) => (
            <FadeUp key={step.number} delay={i * 0.15}>
              <div className="flex flex-col gap-6">
                <div className="w-44 md:w-full max-w-[180px]">
                  <PhoneFrame src={step.screenshot} alt={step.alt} />
                </div>
                <div>
                  <span className="text-xs font-medium text-gold tracking-[0.15em]">
                    {step.number}
                  </span>
                  <h3 className="font-serif text-2xl text-ink mt-2 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-mute mt-2 leading-relaxed text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

      </div>
    </section>
  );
}
