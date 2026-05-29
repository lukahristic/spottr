import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS } from "../theme/tokens";
import { floatIdle } from "../motion/floatIdle";

interface LightFieldProps {
  /** Vertical parallax travel across the scene, in px. */
  driftY?: number;
  durationInFrames?: number;
  /** Overall intensity 0–1. */
  intensity?: number;
}

/*
 * Abstract warm light field — soft out-of-focus blobs suggesting a sunlit gym
 * interior, never literal. Sits behind everything on the cream background and
 * drifts slowly to give the frame depth and life.
 */
export const LightField: React.FC<LightFieldProps> = ({
  driftY = 0,
  durationInFrames = 120,
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, durationInFrames], [0, driftY], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bob = floatIdle(frame, { amp: 8, period: 220 });

  const blob = (
    color: string,
    size: number,
    left: string,
    top: string,
    blur: number,
    alpha: number,
    phase: number
  ): React.CSSProperties => ({
    position: "absolute",
    width: size,
    height: size,
    left,
    top,
    borderRadius: "50%",
    background: color,
    opacity: alpha * intensity,
    filter: `blur(${blur}px)`,
    transform: `translateY(${y + floatIdle(frame, { amp: 10, period: 200, phase })}px)`,
  });

  return (
    <AbsoluteFill style={{ background: COLORS.cream, overflow: "hidden" }}>
      <div style={blob(COLORS.gold, 720, "-12%", "8%", 160, 0.1, 0)} />
      <div style={blob(COLORS.tan, 640, "58%", "2%", 150, 0.22, 60)} />
      <div style={blob(COLORS.sage, 560, "62%", "60%", 150, 0.18, 120)} />
      <div style={blob(COLORS.sky, 520, "-6%", "62%", 150, 0.18, 180)} />
      {/* gentle vignette toward cream edges keeps the center warm */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, transparent 40%, ${COLORS.cream} 92%)`,
          transform: `translateY(${bob}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
