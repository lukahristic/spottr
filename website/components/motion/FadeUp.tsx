"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface FadeUpProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Delay in seconds before the animation starts.
   * Use this to manually stagger sibling FadeUp elements.
   * Example: delay={0.1}, delay={0.2}, delay={0.3}
   */
  delay?: number;
}

/*
 * FadeUp — the workhorse entrance animation.
 *
 * Teaching notes:
 * ───────────────
 * 1. `useInView` fires once when the element enters the viewport.
 *    `margin: "-80px"` means "trigger 80px before the element hits the fold"
 *    so it's already animating as you scroll to it, not after.
 *
 * 2. `once: true` means the animation only runs once — re-scrolling past
 *    the section doesn't replay it. This is almost always what you want.
 *
 * 3. `useReducedMotion` respects the OS accessibility setting
 *    "Reduce Motion" (System Prefs → Accessibility on macOS, Settings → Accessibility on iOS/Android).
 *    When active: skip the animation, render children immediately.
 *
 * 4. The cubic bezier [0.16, 1, 0.3, 1] is an "expo out" curve —
 *    it starts fast and decelerates sharply. Content feels like it
 *    snaps into place rather than drifting in.
 */
export default function FadeUp({
  children,
  className = "",
  delay = 0,
}: FadeUpProps) {
  const shouldReduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  // Accessibility: skip animation if user prefers reduced motion
  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
