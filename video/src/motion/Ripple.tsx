import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { EASE } from "../theme/ease";

interface RippleProps {
  /** Frame the ripple fires (scene-local). */
  startAt: number;
  /** Ring color. */
  color?: string;
  /** Number of staggered rings. */
  rings?: number;
  /** Final diameter of the outermost ring, px. */
  size?: number;
  /** Lifetime of each ring, frames. */
  duration?: number;
  /** Stagger between rings, frames. */
  stagger?: number;
}

/**
 * Concentric rings emanating from a point — the satisfying confirmation when
 * the "Open to chat" toggle activates (Scene 4). Each ring scales out and fades.
 * Centered on its parent; wrap in a relatively/absolutely positioned box.
 */
export const Ripple: React.FC<RippleProps> = ({
  startAt,
  color = "#b8d8c0",
  rings = 3,
  size = 220,
  duration = 46,
  stagger = 9,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: rings }).map((_, i) => {
        const local = frame - startAt - i * stagger;
        const t = interpolate(local, [0, duration], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        });
        const scale = 0.2 + t * 1.0;
        const opacity = local < 0 ? 0 : interpolate(t, [0, 1], [0.45, 0], { extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              borderRadius: 999,
              border: `2px solid ${color}`,
              opacity,
              transform: `scale(${scale})`,
            }}
          />
        );
      })}
    </div>
  );
};
