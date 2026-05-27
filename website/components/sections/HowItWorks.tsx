import FadeUp from "@/components/motion/FadeUp";

/*
 * HowItWorks — three steps, each with a code-built mini phone screen.
 *
 * Raw screenshots replaced with JSX screens following the marketing-mockups
 * skill pattern. Each step gets a MiniPhone shell showing the exact relevant
 * app state for that step. No image files needed.
 */

// ─── Screen data ──────────────────────────────────────────────────────────────

const GYMS = [
  { name: "Iron House Gym", loc: "Gold Hill", count: 4, active: true },
  { name: "Anytime Fitness", loc: "BGC", count: 2, active: false },
] as const;

const VIBES = [
  { label: "Locked in", selected: false },
  { label: "Finding my rhythm", selected: true },
  { label: "Taking it easy", selected: false },
  { label: "Quick session", selected: false },
  { label: "In between sets", selected: false },
  { label: "Just showing up", selected: false },
] as const;

// ─── Section ──────────────────────────────────────────────────────────────────

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

        {/* Three step cards */}
        <div className="grid md:grid-cols-3 gap-14 md:gap-8">

          <FadeUp delay={0}>
            <StepCard
              number="01"
              title="Check in to your gym"
              description="Pick your gym, set today's vibe, and let people know you're around."
            >
              <GymListScreen />
            </StepCard>
          </FadeUp>

          <FadeUp delay={0.15}>
            <StepCard
              number="02"
              title="Set your vibe"
              description="Six options. One custom note if you want. Open to chat is always your call."
            >
              <VibeScreen />
            </StepCard>
          </FadeUp>

          <FadeUp delay={0.3}>
            <StepCard
              number="03"
              title="Say hi when you're ready"
              description="One intro message. They decide if they want to reply. No pressure either way."
            >
              <IntroScreen />
            </StepCard>
          </FadeUp>

        </div>
      </div>
    </section>
  );
}

// ─── Step card layout ─────────────────────────────────────────────────────────
function StepCard({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <MiniPhone>{children}</MiniPhone>
      <div>
        <span className="text-xs font-medium text-gold tracking-[0.15em]">
          {number}
        </span>
        <h3 className="font-serif text-2xl text-ink mt-2 leading-tight">
          {title}
        </h3>
        <p className="text-mute mt-2 leading-relaxed text-sm">{description}</p>
      </div>
    </div>
  );
}

// ─── Mini phone shell ─────────────────────────────────────────────────────────
// Dark bezel + Dynamic Island + cream screen. Children fill the screen area.
// Sized at max-w-[200px] with aspect-[9/18] — same style as the hero phone
// but smaller and without the status bar (too cramped at this size).
function MiniPhone({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[200px] mx-auto md:mx-0 aspect-[9/18] rounded-[2rem] bg-[#1c1c1e] p-[3px] shadow-[0_24px_60px_rgba(0,0,0,0.16),0_4px_12px_rgba(0,0,0,0.08)] ring-[0.5px] ring-white/[0.07]">
      <div className="w-full h-full rounded-[1.75rem] bg-cream overflow-hidden flex flex-col">
        {/* Dynamic island */}
        <div className="flex justify-center pt-3 pb-1.5 flex-shrink-0">
          <div className="w-[70px] h-[20px] rounded-full bg-[#1c1c1e]" />
        </div>
        {/* Screen content */}
        {children}
      </div>
    </div>
  );
}

// ─── Screen 1: Gym list ───────────────────────────────────────────────────────
// Shows the gym picker — a list of the user's gyms, with the active gym
// highlighted in ink, member counts, and a "Check in" CTA at the bottom.
function GymListScreen() {
  return (
    <div className="flex flex-col flex-1 px-3.5 pb-4 justify-between">

      <div>
        {/* Header */}
        <p className="text-[11px] font-semibold text-ink pb-2.5">
          Your gyms
        </p>

        {/* Gym list */}
        <div className="flex flex-col gap-2">
          {GYMS.map((g) => (
            <div
              key={g.name}
              className={`rounded-xl px-3 py-2.5 ${
                g.active ? "bg-ink" : "bg-surface/80"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={`text-[11px] font-semibold leading-none mb-[3px] truncate ${
                      g.active ? "text-cream" : "text-ink"
                    }`}
                  >
                    {g.name}
                  </p>
                  <p
                    className={`text-[9px] ${
                      g.active ? "text-cream/50" : "text-mute"
                    }`}
                  >
                    {g.loc}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="w-[5px] h-[5px] rounded-full bg-sage inline-block" />
                  <span
                    className={`text-[9px] font-medium ${
                      g.active ? "text-cream/60" : "text-mute"
                    }`}
                  >
                    {g.count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-full bg-gold px-3 py-[9px] text-center">
        <span className="text-[10px] font-semibold text-ink leading-none">
          Check in to Iron House
        </span>
      </div>

    </div>
  );
}

// ─── Screen 2: Vibe selector ──────────────────────────────────────────────────
// Shows the vibe selection grid with one option pre-selected (Finding my
// rhythm), and the "Open to chat" toggle in the off state at the bottom.
function VibeScreen() {
  return (
    <div className="flex flex-col flex-1 px-3.5 pb-4 justify-between">

      <div>
        {/* Header */}
        <div className="pb-2.5">
          <p className="text-[11px] font-semibold text-ink leading-none mb-0.5">
            Set your vibe
          </p>
          <p className="text-[9px] text-mute">Iron House Gym</p>
        </div>

        {/* Vibe grid — 2 columns */}
        <div className="grid grid-cols-2 gap-1.5">
          {VIBES.map((v) => (
            <div
              key={v.label}
              className={`rounded-xl px-2 py-[9px] text-center ${
                v.selected
                  ? "bg-gold/20 ring-1 ring-gold/40"
                  : "bg-surface/80"
              }`}
            >
              <span
                className={`text-[8.5px] font-medium leading-tight block ${
                  v.selected ? "text-ink" : "text-mute"
                }`}
              >
                {v.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Open to chat toggle (off) */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-ink font-medium">Open to chat</span>
        {/* Toggle pill — off state: circle sits on the left */}
        <div className="w-8 h-[18px] rounded-full bg-mute/20 flex items-center px-[3px]">
          <div className="w-[12px] h-[12px] rounded-full bg-white shadow-sm" />
        </div>
      </div>

    </div>
  );
}

// ─── Screen 3: Member intro ───────────────────────────────────────────────────
// Shows Maya's profile (the member the user is about to intro to), a
// draft message in a text area, and the Send intro CTA.
function IntroScreen() {
  return (
    <div className="flex flex-col flex-1 px-3.5 pb-4">

      {/* Member profile */}
      <div className="flex items-center gap-2.5 pb-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-sky flex-shrink-0 flex items-center justify-center">
          <span className="text-[9px] font-bold text-blue-900">MR</span>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-ink leading-none mb-1">
            Maya R.
          </p>
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-semibold px-1.5 py-[2px] rounded-full bg-sky text-blue-900">
              Focused
            </span>
            <span className="text-[8px] font-semibold px-1.5 py-[2px] rounded-full bg-sage/25 text-emerald-900">
              Open ✦
            </span>
          </div>
        </div>
      </div>

      <div className="h-px bg-surface mb-3 flex-shrink-0" />

      {/* Intro form — message box expands to fill space */}
      <div className="flex flex-col flex-1 gap-2">
        <p className="text-[10px] font-semibold text-ink flex-shrink-0">
          Send an intro
        </p>
        <div className="flex-1 rounded-xl bg-surface/60 border border-surface px-2.5 py-2">
          <p className="text-[8.5px] text-mute/70 leading-relaxed">
            Hey, I&rsquo;ve seen you here a few times&nbsp;—&nbsp;nice work
            in there...
          </p>
        </div>
        <div className="rounded-full bg-gold py-[9px] text-center flex-shrink-0">
          <span className="text-[10px] font-semibold text-ink leading-none">
            Send intro →
          </span>
        </div>
      </div>

    </div>
  );
}
