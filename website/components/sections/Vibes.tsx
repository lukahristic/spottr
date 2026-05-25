"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import FadeUp from "@/components/motion/FadeUp";

/*
 * Vibes uses variants directly (not FadeUp) because:
 * 1. We need whileHover on each pill
 * 2. We want a single useInView to drive ALL pills — one observer,
 *    not one per pill. This ensures they all animate at the same moment
 *    rather than each triggering independently.
 *
 * Teaching notes: VARIANTS + STAGGER in practice
 * ────────────────────────────────────────────────
 * The `containerVariants` below says: when I become "visible", trigger
 * my children with 60ms between each one.
 *
 * The `pillVariants` says: start hidden (y: 12, opacity: 0), become
 * visible (y: 0, opacity: 1) with a spring transition.
 *
 * The parent just needs `initial="hidden"` and `animate={isInView ? "visible" : "hidden"}`.
 * Children just need `variants={pillVariants}` — no animate prop needed.
 * Framer Motion propagates the parent's animation state to children automatically.
 */

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const pillVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      // Framer Motion v12: `type` must be a string literal, not `string`
      type: "spring" as const,
      stiffness: 300,
      damping: 28,
    },
  },
};

const vibes = [
  { label: "Locked in", description: "Head down, not looking up.", bg: "bg-sky" },
  { label: "Finding my rhythm", description: "Getting into it. Open-ish.", bg: "bg-tan" },
  { label: "Taking it easy", description: "Recovery day or just here to move.", bg: "bg-sage" },
  { label: "Quick session", description: "In and out. No time to chat.", bg: "bg-surface" },
  { label: "In between sets", description: "Happy to talk, between reps.", bg: "bg-tan" },
  { label: "Just showing up", description: "First time or new routine. Be nice.", bg: "bg-sage" },
] as const;

export default function Vibes() {
  const shouldReduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="px-6 py-24 md:py-32 bg-surface">
      <div className="max-w-6xl mx-auto">

        <FadeUp className="max-w-xl mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-mute mb-4">Vibe system</p>
          <h2 className="font-serif text-4xl md:text-5xl text-ink leading-tight">
            Describe presence,<br />not identity.
          </h2>
          <p className="mt-4 text-mute leading-relaxed">
            Six options. No labels. Just where you are right now.
          </p>
        </FadeUp>

        <motion.div
          ref={ref}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
          variants={shouldReduce ? undefined : containerVariants}
          initial={shouldReduce ? undefined : "hidden"}
          animate={shouldReduce ? undefined : (isInView ? "visible" : "hidden")}
        >
          {vibes.map((vibe) => (
            /*
             * whileHover: runs while cursor is hovering.
             * y: -6 lifts the pill 6px upward.
             * transition.duration: 0.2 makes the hover feel snappy, not slow.
             *
             * Note: this only applies on desktop (touch screens don't have hover).
             * That's fine — it's a progressive enhancement.
             */
            <motion.div
              key={vibe.label}
              variants={shouldReduce ? undefined : pillVariants}
              whileHover={shouldReduce ? undefined : { y: -6, transition: { duration: 0.2 } }}
              className={`${vibe.bg} rounded-2xl p-5 md:p-6 cursor-default`}
            >
              <p className="font-medium text-ink leading-tight">{vibe.label}</p>
              <p className="text-sm text-mute mt-1 leading-relaxed">
                {vibe.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
