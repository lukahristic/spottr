import { interpolate } from "remotion";
import { EASE } from "../theme/ease";

interface FadeUpOptions {
  /** Frame at which the entrance begins (relative to the current Sequence). */
  delay?: number;
  /** Duration of the entrance in frames. */
  duration?: number;
  /** Starting vertical offset in px (positive = rises up into place). */
  distance?: number;
}

/**
 * The workhorse entrance: opacity 0→1 + vertical translate, expo-out.
 * Returns a style fragment to spread onto a div.
 */
export function fadeUp(
  frame: number,
  { delay = 0, duration = 20, distance = 28 }: FadeUpOptions = {}
): { opacity: number; transform: string } {
  const opacity = interpolate(
    frame,
    [delay, delay + duration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE }
  );
  const y = interpolate(
    frame,
    [delay, delay + duration],
    [distance, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE }
  );
  return { opacity, transform: `translateY(${y}px)` };
}

/** Horizontal sibling of fadeUp — used for member cards sliding in from the right. */
export function fadeIn(
  frame: number,
  { delay = 0, duration = 14, distance = 14 }: FadeUpOptions = {}
): { opacity: number; transform: string } {
  const opacity = interpolate(
    frame,
    [delay, delay + duration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE }
  );
  const x = interpolate(
    frame,
    [delay, delay + duration],
    [distance, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE }
  );
  return { opacity, transform: `translateX(${x}px)` };
}
