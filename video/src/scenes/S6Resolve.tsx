import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { SCENES } from "./constants";
import { CrossFade } from "../motion/CrossFade";
import { LightField } from "../ui/LightField";
import { WordReveal } from "../motion/WordReveal";
import { fadeUp } from "../motion/fadeUp";
import { SERIF } from "../theme/fonts";
import { COLORS } from "../theme/tokens";
import { Eyebrow } from "../ui/Caption";

const D = SCENES.s6;

/* Scene 6 — "Resolve". UI fragments drift inward and converge into the
 * wordmark + its pulsing live dot, then the closing line and beta URL. Motion
 * lands the brand — not a pure fade. */
export const S6Resolve: React.FC = () => {
  const frame = useCurrentFrame();
  const wordmark = fadeUp(frame, { delay: 26, duration: 22, distance: 16 });
  const dotOpacity = fadeUp(frame, { delay: 26, duration: 16, distance: 0 }).opacity;
  const pulse = interpolate(frame, [52, 66, 82], [1, 1.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Three fragments converge to center and fade by ~frame 30.
  const fragments = [
    { dx: -260, dy: -180, color: COLORS.sage, label: "Open to chat" },
    { dx: 240, dy: -90, color: COLORS.gold, label: "Maya replied" },
    { dx: -180, dy: 200, color: COLORS.sky, label: "5 here now" },
  ];
  const conv = interpolate(frame, [0, 30], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const convFade = interpolate(frame, [16, 32], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CrossFade durationInFrames={D} fadeIn={12} fadeOut={20}>
      <LightField durationInFrames={D} intensity={0.5} />

      {/* Converging fragments */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {fragments.map((f, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              transform: `translate(${f.dx * conv}px, ${f.dy * conv}px)`,
              opacity: convFade,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: COLORS.white,
              borderRadius: 999,
              padding: "8px 14px",
              boxShadow: "0 8px 24px rgba(43,43,43,0.10)",
              fontFamily: SERIF,
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: 999, background: f.color }} />
            <span style={{ fontSize: 20, color: COLORS.ink, fontWeight: 500 }}>{f.label}</span>
          </div>
        ))}
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, ...wordmark }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                background: COLORS.sage,
                opacity: dotOpacity,
                transform: `scale(${pulse})`,
              }}
            />
            <span style={{ fontFamily: SERIF, fontSize: 76, fontWeight: 600, color: COLORS.ink }}>Spottr</span>
          </div>
          <div style={{ marginTop: 28 }}>
            <div style={{ fontFamily: SERIF, fontSize: 40, color: COLORS.ink, fontWeight: 500 }}>
              <WordReveal text="You're not training alone." delay={50} stagger={6} duration={18} />
            </div>
          </div>
          <div style={{ marginTop: 28 }}>
            <Eyebrow text="Private beta — seed gyms only · spottr.app" delay={78} />
          </div>
        </div>
      </AbsoluteFill>
    </CrossFade>
  );
};
