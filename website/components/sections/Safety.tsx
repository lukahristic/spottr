"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "framer-motion";
import FadeUp from "@/components/motion/FadeUp";

gsap.registerPlugin(ScrollTrigger);

const principles = [
  {
    number: "01",
    statement: "You only appear while checked in.",
    detail:
      "The moment you leave, you're gone. Nobody can search for you or find your profile.",
  },
  {
    number: "02",
    statement: "Openness resets every visit.",
    detail:
      '"Open to chat" turns off automatically every time you check in. You choose again, each time.',
  },
  {
    number: "03",
    statement: "One intro. They decide the rest.",
    detail:
      "You can say hi once. If they don't reply, the thread stays closed. No second attempt.",
  },
];

export default function Safety() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();

  useGSAP(
    () => {
      const underlines = gsap.utils.toArray<HTMLElement>(
        ".safety-underline",
        sectionRef.current!
      );

      /*
       * Reduced motion: show all underlines at full width immediately.
       * The lines still appear — they just don't animate.
       */
      if (shouldReduce) {
        gsap.set(underlines, { scaleX: 1 });
        return;
      }

      /*
       * Underline draw animation — NOT scrubbed.
       * Unlike the LiveFeed pin, these fire once when the element
       * enters the viewport (no scroll position tie).
       *
       * scaleX: 0 → 1 with transformOrigin "left center" draws a line
       * from left to right, like a pen underlining the text.
       *
       * gsap.set() → sets initial state immediately on mount.
       * gsap.to()  → plays to the target state when triggered.
       *
       * ScrollTrigger without scrub = plays once, doesn't reverse on scroll-back.
       */
      underlines.forEach((el) => {
        gsap.set(el, { scaleX: 0, transformOrigin: "left center" });

        gsap.to(el, {
          scaleX: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%", // fires when underline is 85% down the viewport
          },
        });
      });
    },
    { scope: sectionRef, dependencies: [shouldReduce] }
  );

  return (
    <section ref={sectionRef} className="px-6 py-24 md:py-32 bg-surface">
      <div className="max-w-3xl mx-auto">

        <FadeUp className="mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-mute mb-4">
            Safety by design
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
            Consent isn&rsquo;t a feature.<br />It&rsquo;s the foundation.
          </h2>
        </FadeUp>

        <div className="space-y-0">
          {principles.map((p, i) => (
            <FadeUp key={p.number} delay={i * 0.12}>
              <div className="border-t border-ink/10 py-10">
                <span className="text-xs font-medium text-gold tracking-[0.15em]">
                  {p.number}
                </span>
                <p className="font-serif text-2xl md:text-3xl text-ink mt-3 leading-snug">
                  {p.statement}
                </p>
                {/*
                 * The underline. Starts at scaleX: 0 (invisible, zero width).
                 * GSAP animates it to scaleX: 1 (full width) when it enters view.
                 * `transformOrigin: left center` means it draws left → right.
                 * `origin-left` is the Tailwind equivalent CSS class (belt + suspenders).
                 */}
                <div className="safety-underline mt-2 h-px bg-gold origin-left" />
                <p className="text-mute mt-4 leading-relaxed">{p.detail}</p>
              </div>
            </FadeUp>
          ))}
        </div>

      </div>
    </section>
  );
}
