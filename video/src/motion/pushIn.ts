import { interpolate } from "remotion";
import { EASE } from "../theme/ease";

interface PushInOptions {
  scaleFrom?: number;
  scaleTo?: number;
  /** Extra translate applied across the push, in px. */
  x?: number;
  y?: number;
  startAt?: number;
  duration?: number;
}

/**
 * Camera push-in / zoom hand-off. Returns a single normalized progress (0→1)
 * plus a derived transform — the Remotion-skill "separate timing from mapping"
 * pattern: derive scale, translate, blur, opacity all from one `t`.
 * Use the returned `t` to drive a parallax recede on background layers.
 */
export function pushIn(
  frame: number,
  { scaleFrom = 1, scaleTo = 1.8, x = 0, y = 0, startAt = 0, duration = 36 }: PushInOptions
): { t: number; transform: string } {
  const t = interpolate(frame, [startAt, startAt + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const scale = scaleFrom + (scaleTo - scaleFrom) * t;
  return { t, transform: `scale(${scale}) translate(${x * t}px, ${y * t}px)` };
}
