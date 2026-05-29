import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { SCENES } from "./constants";
import { CrossFade } from "../motion/CrossFade";
import { LightField } from "../ui/LightField";
import { Eyebrow } from "../ui/Caption";
import { fadeUp } from "../motion/fadeUp";
import { WordReveal } from "../motion/WordReveal";
import { SERIF, SANS } from "../theme/fonts";
import { COLORS } from "../theme/tokens";

const D = SCENES.s6;

/* Scene 6 — Brand resolve. Everything settles to cream. Wordmark, the headline
 * that closes the loop opened in Scene 1, and the beta line. The only still
 * scene — the exhale lands. A single sage dot pulses once (the "live" motif). */
export const S6Resolve: React.FC = () => {
  const frame = useCurrentFrame();

  const mark = fadeUp(frame, { delay: 6, duration: 24, distance: 18 });
  const dotIn = fadeUp(frame, { delay: 6, duration: 18, distance: 0 });

  // Single gentle pulse of the sage dot.
  const pulse = interpolate(frame, [30, 44, 60], [1, 1.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CrossFade durationInFrames={D} fadeIn={18} fadeOut={20}>
      {/* Very faint, near-still light field — almost pure cream */}
      <LightField durationInFrames={D} driftY={0} intensity={0.45} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          {/* Wordmark + live dot */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, ...mark }}>
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 999,
                background: COLORS.sage,
                display: "inline-block",
                transform: `scale(${pulse})`,
                opacity: dotIn.opacity,
              }}
            />
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 96,
                fontWeight: 600,
                color: COLORS.ink,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              Spottr
            </span>
          </div>

          {/* Headline — closes the loop from Scene 1 (Inter for hierarchy) */}
          <div
            style={{
              marginTop: 34,
              fontFamily: SANS,
              fontSize: 40,
              fontWeight: 500,
              color: COLORS.ink,
              letterSpacing: "-0.005em",
            }}
          >
            <WordReveal text="You're not training alone." delay={30} stagger={6} duration={18} />
          </div>

          {/* Beta line */}
          <div style={{ marginTop: 44 }}>
            <Eyebrow text="Private beta — seed gyms only · spottr.app" delay={56} />
          </div>
        </div>
      </AbsoluteFill>
    </CrossFade>
  );
};
