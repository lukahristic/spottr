import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS } from "../theme/tokens";

interface TypingIndicatorProps {
  /** Frame the indicator appears. */
  startAt?: number;
  /** Frame the indicator disappears (e.g. when the reply lands). */
  endAt?: number;
  dotColor?: string;
}

/**
 * Three-dot "…" typing bubble — the anticipation beat before the reply lands
 * (Scene 5). Each dot bobs on a staggered sine; the bubble fades in/out.
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  startAt = 0,
  endAt,
  dotColor = COLORS.mute,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startAt;
  const fadeIn = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut =
    endAt !== undefined
      ? interpolate(frame, [endAt - 6, endAt], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  const opacity = local < 0 ? 0 : fadeIn * fadeOut;

  return (
    <div style={{ display: "flex", justifyContent: "flex-start", opacity }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: COLORS.surface,
          borderRadius: 14,
          borderBottomLeftRadius: 4,
          padding: "9px 12px",
        }}
      >
        {[0, 1, 2].map((i) => {
          const bob = Math.sin((local / 8) * Math.PI * 2 - i * 0.9) * 2.2;
          return (
            <div
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: dotColor,
                transform: `translateY(${bob}px)`,
                opacity: 0.8,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
