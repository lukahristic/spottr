import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SCENES } from "./constants";
import { CrossFade } from "../motion/CrossFade";
import { CameraDrift } from "../motion/CameraDrift";
import { LightField } from "../ui/LightField";
import { AvatarCluster } from "../ui/ActiveBadge";
import { WordReveal } from "../motion/WordReveal";
import { fadeUp } from "../motion/fadeUp";
import { SERIF } from "../theme/fonts";
import { COLORS } from "../theme/tokens";

const D = SCENES.s1;

/* Scene 1 — Recognition. Full cream frame, drifting warm light, an anonymous
 * avatar cluster floats up. Headline word-reveals. No UI yet. */
export const S1Recognition: React.FC = () => {
  const frame = useCurrentFrame();
  const cluster = fadeUp(frame, { delay: 14, duration: 28, distance: 24 });

  return (
    <CrossFade durationInFrames={D} fadeIn={1} fadeOut={18}>
      <CameraDrift durationInFrames={D} scaleFrom={1} scaleTo={1.05} driftY={6}>
        <LightField durationInFrames={D} driftY={14} intensity={1} />

        {/* Anonymous presence — a cluster of avatars, no card */}
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ marginTop: -120, ...cluster }}>
            <AvatarCluster size={70} />
          </div>
        </AbsoluteFill>

        {/* Headline */}
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              marginTop: 120,
              fontFamily: SERIF,
              fontSize: 72,
              fontWeight: 500,
              color: COLORS.ink,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              textAlign: "center",
              maxWidth: 820,
            }}
          >
            <WordReveal text="You've seen them around." delay={24} stagger={7} duration={20} />
          </div>
        </AbsoluteFill>
      </CameraDrift>
    </CrossFade>
  );
};
