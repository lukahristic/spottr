import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { EASE } from "../theme/ease";

interface WordRevealProps {
  text: string;
  /** Frame at which the first word begins. */
  delay?: number;
  /** Frames between successive words. */
  stagger?: number;
  /** Entrance duration per word, in frames. */
  duration?: number;
  style?: React.CSSProperties;
}

/**
 * Per-word fade + rise for headline lines (Fraunces, Scenes 1 & 6).
 * Each word settles independently for a calm, considered reveal.
 */
export const WordReveal: React.FC<WordRevealProps> = ({
  text,
  delay = 0,
  stagger = 5,
  duration = 18,
  style,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");

  return (
    <span style={{ display: "inline-block", ...style }}>
      {words.map((word, i) => {
        const start = delay + i * stagger;
        const opacity = interpolate(
          frame,
          [start, start + duration],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE }
        );
        const y = interpolate(
          frame,
          [start, start + duration],
          [22, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE }
        );
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity,
              transform: `translateY(${y}px)`,
              marginRight: "0.28em",
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
};
