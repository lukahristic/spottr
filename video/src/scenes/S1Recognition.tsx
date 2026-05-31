import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { SCENES } from "./constants";
import { CrossFade } from "../motion/CrossFade";
import { LightField } from "../ui/LightField";
import { PhoneStage } from "../ui/PhoneStage";
import { PhoneShell } from "../ui/PhoneShell";
import { MemberCard } from "../ui/MemberCard";
import { ALL_MEMBERS } from "../data/members";
import { momentumScroll } from "../motion/momentumScroll";
import { countUp } from "../motion/countUp";
import { WordReveal } from "../motion/WordReveal";
import { SERIF } from "../theme/fonts";
import { COLORS } from "../theme/tokens";

const D = SCENES.s1;
const SETTLE = 64; // frame the scroll comes to rest
const ROW = 62;

/* Scene 1 — "The Scroll" (the hook). Open already moving: the live feed whips
 * past with a racing count, decelerates and settles on a clean screen, then the
 * headline punches in. First 3 seconds must stop the scroll. */
export const S1Recognition: React.FC = () => {
  const frame = useCurrentFrame();

  // Feed scrolls fast, then settles to rest at SETTLE.
  const scrollY = momentumScroll(frame, { distance: ROW * 3.4, settleAt: SETTLE });
  // Count races up as it scrolls.
  const count = countUp(frame, { from: 6, to: 23, delay: 0, duration: 58 });

  // Subtle pull-back as the motion settles (momentum feel).
  const camScale = interpolate(frame, [0, SETTLE], [1.08, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CrossFade durationInFrames={D} fadeIn={1} fadeOut={14}>
      <LightField durationInFrames={D} driftY={-4} intensity={0.85} />
      <AbsoluteFill style={{ transform: `scale(${camScale})`, transformOrigin: "center 42%" }}>
        <PhoneStage cy={820} scale={2.25} bob={false}>
            <PhoneShell countLabel={`${count} here now`} title="Here now" activeTab="users">
              <div style={{ transform: `translateY(${scrollY}px)` }}>
                {ALL_MEMBERS.map((m, i) => (
                  <div key={m.seed} style={{ marginBottom: 8 }}>
                    <MemberCard member={m} showCustom={i % 2 === 1} />
                  </div>
                ))}
              </div>
            </PhoneShell>
        </PhoneStage>
      </AbsoluteFill>

      {/* Headline punches in once the feed has settled. */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 60,
            color: COLORS.ink,
            fontWeight: 500,
            textAlign: "center",
            maxWidth: 860,
            lineHeight: 1.12,
          }}
        >
          <WordReveal text="You've seen them." delay={SETTLE + 4} stagger={6} duration={16} />
          <br />
          <span style={{ color: COLORS.mute }}>
            <WordReveal text="You just never said hi." delay={SETTLE + 22} stagger={5} duration={16} />
          </span>
        </div>
      </AbsoluteFill>
    </CrossFade>
  );
};
