import { interpolate } from "remotion";
import { EASE } from "../theme/ease";

interface MomentumScrollOptions {
  /** Total scroll distance in px the feed travels before resting. */
  distance: number;
  /** Frame at which the scroll comes fully to rest. */
  settleAt?: number;
  /** Frame the scroll begins. */
  startAt?: number;
}

/**
 * Returns the vertical offset (px) of a scrolling feed that starts fast and
 * decelerates to rest — the Scene-1 "whip past, then settle" momentum.
 * Expo-out gives high initial velocity easing into a stop. The list should be
 * translated by this value (it ends at 0 = resting position).
 */
export function momentumScroll(
  frame: number,
  { distance, settleAt = 60, startAt = 0 }: MomentumScrollOptions
): number {
  const t = interpolate(frame, [startAt, settleAt], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  // Travels from -distance (scrolled away) up to 0 (final resting frame).
  return -distance * (1 - t);
}
