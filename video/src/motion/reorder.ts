import { interpolate } from "remotion";
import { EASE } from "../theme/ease";

interface ReorderOptions {
  /** Height of one row (card height + gap) in px. */
  rowHeight: number;
  /** Frame the reflow begins. */
  startAt?: number;
  /** Duration of the reflow in frames. */
  duration?: number;
}

/**
 * FLIP-style positional reflow: a card sitting at `fromIndex` animates to
 * `toIndex`. Returns the translateY (px) to apply so cards physically reorder
 * when a vibe filter is applied (Scene 3). Pure interpolate over slot positions
 * — no layout thrash, deterministic per frame.
 */
export function reorderY(
  frame: number,
  fromIndex: number,
  toIndex: number,
  { rowHeight, startAt = 0, duration = 24 }: ReorderOptions
): number {
  return interpolate(
    frame,
    [startAt, startAt + duration],
    [fromIndex * rowHeight, toIndex * rowHeight],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE }
  );
}
