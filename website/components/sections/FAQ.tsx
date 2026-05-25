"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import FadeUp from "@/components/motion/FadeUp";

/*
 * FAQ — animated accordion using AnimatePresence.
 *
 * Teaching notes: AnimatePresence + height: "auto"
 * ─────────────────────────────────────────────────
 * Problem: CSS `transition` cannot animate `height: 0 → height: auto`.
 * You'd have to calculate exact pixel heights in JS. Pain.
 *
 * Framer Motion solves this: set `animate={{ height: "auto" }}` and it
 * calculates the content height and interpolates to it. Magic.
 *
 * AnimatePresence enables EXIT animations. Without it, removing a
 * component from the React tree = instant disappear. With it, Framer
 * Motion holds the component in the DOM while the `exit` animation plays,
 * then removes it once done.
 *
 * Pattern:
 *   <AnimatePresence>
 *     {isOpen && (
 *       <motion.div
 *         initial={{ height: 0 }}
 *         animate={{ height: "auto" }}
 *         exit={{ height: 0 }}         // ← only possible with AnimatePresence
 *       />
 *     )}
 *   </AnimatePresence>
 *
 * `initial={false}` on AnimatePresence: don't animate items that are
 * already mounted when the component first renders. Without this, the
 * first open FAQ would animate even on page load.
 */

const faqs = [
  {
    q: "Is this a dating app?",
    a: "No. There's no matching, swiping, or compatibility scores. Spottr is about the gym — saying hi to someone you've seen around, asking about their routine, finding a spotter. That's it.",
  },
  {
    q: "Can people see me when I'm not at the gym?",
    a: "No. You only appear on the Live list when you're actively checked in. The moment you leave — or after a set period — you're gone.",
  },
  {
    q: 'What does "Open to chat" mean?',
    a: "It's a toggle on your check-in. When it's on, people can send you one intro message. When it's off, they can see your vibe but can't reach out. It resets to off every time you check in.",
  },
  {
    q: "What if someone makes me uncomfortable?",
    a: "You can block and report from any conversation. Once blocked, they can't contact you again. We take every report seriously.",
  },
  {
    q: "Which gyms are supported?",
    a: "Any gym that's been added to the platform. Gyms are added by scanning a QR code — if yours isn't there yet, you can add it manually in a few taps.",
  },
  {
    q: "Is it free?",
    a: "Yes. Free for users. Always.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const shouldReduce = useReducedMotion();

  return (
    <section className="px-6 py-24 md:py-32">
      <div className="max-w-3xl mx-auto">

        <FadeUp className="mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-mute mb-4">FAQ</p>
          <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
            Good questions.
          </h2>
        </FadeUp>

        <div className="divide-y divide-ink/10">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;

            return (
              <div key={faq.q}>
                {/* Question row — clicking toggles the answer */}
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left text-ink font-medium text-lg leading-snug cursor-pointer"
                  aria-expanded={isOpen}
                >
                  {faq.q}
                  {/*
                   * The + icon rotates 45° when open to become ×.
                   * `transition` here is a Framer Motion transition, not CSS.
                   */}
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-ink/20 text-mute text-sm"
                  >
                    +
                  </motion.span>
                </button>

                {/*
                 * AnimatePresence watches for children entering/leaving.
                 * When `isOpen` becomes false, it runs the `exit` animation
                 * before removing the element from the DOM.
                 */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={
                        shouldReduce
                          ? { duration: 0 }
                          : { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
                      }
                      className="overflow-hidden"
                    >
                      <p className="pb-6 text-mute leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
