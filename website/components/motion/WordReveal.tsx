"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface WordRevealProps {
  text: string;
  className?: string;
  /** Seconds to wait before starting the reveal */
  delay?: number;
  /** Seconds between each word */
  stagger?: number;
}

/*
 * WordReveal — animates a string word-by-word using Framer Motion variants.
 *
 * Teaching notes: VARIANTS (the most important concept in Framer Motion)
 * ───────────────────────────────────────────────────────────────────────
 * Variants are named animation states referenced by string.
 * The key insight: when a PARENT transitions to a variant (e.g. "visible"),
 * all CHILDREN that share the same variant names animate automatically.
 *
 * The parent controls TIMING (staggerChildren, delayChildren).
 * The children control SHAPE (what properties change).
 *
 * This means you can stagger 20 children with two lines on the parent —
 * you never touch each child individually.
 *
 * How `custom` works:
 * ───────────────────
 * `custom` passes a value to the variant function. Here we use it to
 * pass `delay` so the container variant knows when to start.
 * The container is a function `(delay) => ({ transition: { delayChildren: delay } })`
 * Framer Motion calls it with the `custom` value automatically.
 */

const containerVariants = {
  hidden: {},
  visible: (delay: number) => ({
    transition: {
      staggerChildren: 0.08,
      delayChildren: delay,
    },
  }),
};

const wordVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      // Framer Motion v12 requires a typed tuple for cubic-bezier ease,
      // not a plain number[]. The cast satisfies the BezierDefinition type.
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

export default function WordReveal({
  text,
  className = "",
  delay = 0,
  stagger: _stagger, // reserved for future use
}: WordRevealProps) {
  const shouldReduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  if (shouldReduce) {
    return <span className={className}>{text}</span>;
  }

  return (
    <motion.span
      ref={ref}
      className={`inline ${className}`}
      variants={containerVariants}
      custom={delay}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {text.split(" ").map((word, i) => (
        /*
         * Each word is `inline-block` so Framer Motion can animate its
         * y-transform without affecting the surrounding text flow.
         * Plain `inline` elements can't be translated on the y-axis.
         */
        <motion.span
          key={i}
          variants={wordVariants}
          className="inline-block mr-[0.28em] last:mr-0"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}
