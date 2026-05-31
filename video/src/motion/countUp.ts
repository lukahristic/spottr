import { interpolate } from "remotion";
import { EASE } from "../theme/ease";

interface CountUpOptions {
  from?: number;
  to: number;
  delay?: number;
  duration?: number;
}

/**
 * Integer count-up — for live member counts ticking toward a value.
 * Timing is expo-out so the number races up then settles (per the Remotion
 * skill: drive everything with interpolate + a Bézier ease, never CSS).
 */
export function countUp(
  frame: number,
  { from = 0, to, delay = 0, duration = 30 }: CountUpOptions
): number {
  const v = interpolate(frame, [delay, delay + duration], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  return Math.round(v);
}
