"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "framer-motion";

/*
 * Must register ScrollTrigger before using it.
 * Do this once at the module level — re-registering is harmless but wasteful.
 */
gsap.registerPlugin(ScrollTrigger);

// ─── Data ────────────────────────────────────────────────────────────────────

interface Member {
  name: string;
  vibe: string;
  note?: string;
  openToChat?: boolean;
  timeAgo: string;
  color: string;
}

const members: Member[] = [
  {
    name: "Francis",
    vibe: "Finding my rhythm",
    note: "Open for tips",
    openToChat: true,
    timeAgo: "8 mins ago",
    color: "#DFAF3A",
  },
  {
    name: "Jess",
    vibe: "Quick session",
    note: "30 mins only",
    openToChat: true,
    timeAgo: "22 mins ago",
    color: "#5B8DB8",
  },
  {
    name: "Princess",
    vibe: "Taking it easy",
    note: "recovery day",
    openToChat: true,
    timeAgo: "Just now",
    color: "#A67C52",
  },
  {
    name: "Paolo",
    vibe: "In between sets",
    note: "Phonk playlist",
    timeAgo: "45 mins ago",
    color: "#3B6E8C",
  },
];

// ─── Small components ─────────────────────────────────────────────────────────

function Avatar({ color }: { color: string }) {
  return (
    <div
      className="w-10 h-10 rounded-full flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
        <circle cx="14" cy="16" r="2" fill="white" opacity="0.85" />
        <circle cx="26" cy="16" r="2" fill="white" opacity="0.85" />
        <path
          d="M13 25 Q20 30 27 25"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}

function MemberRow({ member }: { member: Member }) {
  return (
    /*
     * `.member-row` is the GSAP selector target.
     * useGSAP with { scope: sectionRef } means gsap.utils.toArray(".member-row")
     * only finds elements inside our section — no accidental global matches.
     */
    <div className="member-row flex items-start gap-3 p-3 rounded-xl bg-surface/60">
      <Avatar color={member.color} />
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-ink text-sm">{member.name}</span>
          <span className="text-xs text-mute flex-shrink-0">{member.timeAgo}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-mute">{member.vibe}</span>
          {member.openToChat && (
            <span className="px-2 py-0.5 rounded-full bg-sage text-xs text-ink leading-tight">
              Open to chat
            </span>
          )}
        </div>
        {member.note && (
          <p className="text-xs text-mute mt-0.5 truncate">{member.note}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LiveFeed() {
  const sectionRef = useRef<HTMLDivElement>(null);
  /*
   * useReducedMotion (Framer Motion) reads the OS "Reduce Motion" preference.
   * GSAP has no built-in awareness of this — we check it here and skip the
   * scroll-driven animation entirely if the user has requested reduced motion.
   * Without this guard, pinning + scrubbing could cause disorientation.
   */
  const shouldReduce = useReducedMotion();

  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>(
        ".member-row",
        sectionRef.current!
      );

      /*
       * Reduced motion path: show all rows immediately at full opacity.
       * No ScrollTrigger, no pinning — the section scrolls normally.
       * Early return skips the rest of the setup.
       */
      if (shouldReduce) {
        gsap.set(rows, { opacity: 1, y: 0 });
        return;
      }

      /*
       * Set the initial state immediately on mount.
       * All rows start invisible — they "don't exist yet" until someone checks in.
       * opacity: 0 hides them; the rows still occupy space so the phone shell
       * has its full height from the start (no layout jump when rows appear).
       */
      gsap.set(rows, { opacity: 0, y: 8 });

      /*
       * Build a timeline driven by scroll.
       *
       * ScrollTrigger options:
       *   trigger   — the element that starts/ends the scroll watch
       *   start     — "top top" = when the element's top hits the viewport top
       *   end       — "+=200%" = pin for 2× the viewport height of scroll distance
       *   pin       — freeze the section in place while we scroll that distance
       *   scrub: 1  — tie animation to scroll with a 1-second smoothing lag.
       *               Try scrub: true for instant tie, or scrub: 2 for more lag.
       *
       * Tip: add `markers: true` during development to see start/end lines.
       */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=200%",
          pin: true,
          scrub: 1,
          // markers: true,
        },
      });

      /*
       * Add each row to the timeline at a staggered position.
       * `i * 0.7` is the "label" (position) in the timeline where this tween starts.
       * The timeline runs from 0 → ~2.5 over the 200% scroll distance.
       * Each row fades in over 0.4 units, starting 0.7 units after the previous.
       *
       * If the animation feels too fast/slow, adjust `end: "+=200%"` (more = slower)
       * or `i * 0.7` (bigger number = more space between members).
       */
      rows.forEach((row, i) => {
        tl.to(row, { opacity: 1, y: 0, duration: 0.4 }, i * 0.7);
      });
    },
    { scope: sectionRef, dependencies: [shouldReduce] }
  );

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center px-6 py-24 bg-cream"
    >
      <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">

        {/* Left: text */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-mute mb-4">
            Live right now
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
            Only the people<br />in your gym.
          </h2>
          <p className="mt-6 text-lg text-mute leading-relaxed">
            Check in to see who&rsquo;s around. The list disappears the moment
            you leave.
          </p>
          <p className="mt-4 text-sm text-gold font-medium">
            ↓ Scroll to see who&rsquo;s here
          </p>
          <ul className="mt-8 space-y-4">
            {[
              "Real-time. No refresh needed.",
              "Only your gym, nobody else's.",
              "Gone the moment you check out.",
            ].map((point) => (
              <li key={point} className="flex items-start gap-3 text-ink">
                <span className="mt-[0.4rem] w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: phone mock — built in HTML so GSAP can animate individual rows */}
        <div className="flex justify-center md:justify-end">
          <div className="w-64 md:w-72 rounded-[2rem] border-2 border-surface shadow-2xl bg-cream overflow-hidden">

            {/* Phone header */}
            <div className="px-4 pt-5 pb-3 border-b border-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">Live</span>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-gold font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                {members.length} here now
              </span>
            </div>

            {/* Member rows */}
            <div className="p-3 space-y-2 min-h-[320px]">
              {members.map((m) => (
                <MemberRow key={m.name} member={m} />
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
