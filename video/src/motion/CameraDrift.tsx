import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface CameraDriftProps {
  children: React.ReactNode;
  /** Length of THIS scene in frames (drift spans the full scene). Required —
   * useVideoConfig reports the whole composition length inside a Sequence. */
  durationInFrames: number;
  /** Start and end scale across the scene (slow push-in by default). */
  scaleFrom?: number;
  scaleTo?: number;
  /** Horizontal drift in px across the scene. */
  driftX?: number;
  /** Vertical drift in px across the scene. */
  driftY?: number;
  /** Transform origin for the scale. */
  origin?: string;
}

/**
 * Scene-level slow transform — the "camera." Applies a gentle scale + translate
 * to all children over the full duration of the enclosing Sequence. No real 3D;
 * layered 2D parallax (different drift rates per layer) sells depth.
 */
export const CameraDrift: React.FC<CameraDriftProps> = ({
  children,
  durationInFrames,
  scaleFrom = 1,
  scaleTo = 1.04,
  driftX = 0,
  driftY = 0,
  origin = "50% 50%",
}) => {
  const frame = useCurrentFrame();
  const range = [0, durationInFrames] as const;
  const opts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

  const scale = interpolate(frame, range, [scaleFrom, scaleTo], opts);
  const x = interpolate(frame, range, [0, driftX], opts);
  const y = interpolate(frame, range, [0, driftY], opts);

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        transformOrigin: origin,
        willChange: "transform",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
