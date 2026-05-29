import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface CrossFadeProps {
  children: React.ReactNode;
  /** Length of THIS scene in frames (required — useVideoConfig would report the
   * whole composition length inside a Sequence, not the sequence length). */
  durationInFrames: number;
  /** Fade-in length in frames (from the scene's local frame 0). */
  fadeIn?: number;
  /** Fade-out length in frames (ending at the scene's last frame). */
  fadeOut?: number;
}

/**
 * Wraps a scene so it fades in at its start and out at its end, relative to its
 * own Sequence (local frame). When two Sequences overlap, this produces a
 * continuous crossfade with no hard cut — the film reads as one slow breath.
 */
export const CrossFade: React.FC<CrossFadeProps> = ({
  children,
  durationInFrames,
  fadeIn = 15,
  fadeOut = 15,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, fadeIn, durationInFrames - fadeOut, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
