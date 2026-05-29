import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { SCENES } from "./constants";
import { CrossFade } from "../motion/CrossFade";
import { CameraDrift } from "../motion/CameraDrift";
import { LightField } from "../ui/LightField";
import { PhoneStage } from "../ui/PhoneStage";
import { PhoneShell } from "../ui/PhoneShell";
import { ToggleSwitch } from "../ui/ToggleSwitch";
import { Caption } from "../ui/Caption";
import { SPRING_SOFT } from "../theme/ease";
import { fadeUp } from "../motion/fadeUp";
import { COLORS } from "../theme/tokens";
import { SANS } from "../theme/fonts";

const D = SCENES.s4;
const TOGGLE_AT = 44; // frame the toggle flips on

/* Scene 4 — Trust / consent. The hero prop: the "Open to chat" toggle springs
 * on, with its permanent caption. The real differentiator — given the most
 * frames. "Safety over growth," shown not told. */
export const S4Consent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const toggle = spring({
    frame: frame - TOGGLE_AT,
    fps,
    config: SPRING_SOFT,
  });

  const cardEnter = fadeUp(frame, { delay: 10, duration: 22, distance: 24 });
  const captionEnter = fadeUp(frame, { delay: 60, duration: 20, distance: 14 });

  return (
    <CrossFade durationInFrames={D} fadeIn={16} fadeOut={16}>
      <CameraDrift durationInFrames={D} scaleFrom={1.0} scaleTo={1.04}>
        <LightField durationInFrames={D} driftY={6} intensity={0.7} />

        {/* Tighter framing on the control */}
        <PhoneStage cy={820} scale={2.55}>
          <PhoneShell title="Your status" countLabel="Checked in" activeTab="person">
            {/* Toggle card */}
            <div
              style={{
                background: "rgba(255,255,255,0.6)",
                borderRadius: 16,
                border: "1px solid rgba(242,238,231,0.6)",
                padding: "14px 14px 12px",
                ...cardEnter,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Open to chat</span>
                <ToggleSwitch progress={toggle} width={46} />
              </div>
              <p
                style={{
                  fontSize: 9.5,
                  color: COLORS.mute,
                  margin: "9px 0 0",
                  fontFamily: SANS,
                  lineHeight: 1.4,
                  opacity: captionEnter.opacity,
                  transform: captionEnter.transform,
                }}
              >
                Resets every visit. Always your choice.
              </p>
            </div>

            {/* Quiet supporting line */}
            <div
              style={{
                marginTop: 10,
                fontSize: 9.5,
                color: COLORS.mute,
                fontFamily: SANS,
                lineHeight: 1.4,
                opacity: interpolate(frame, [96, 116], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              You&rsquo;re only visible while you&rsquo;re checked in.
            </div>
          </PhoneShell>
        </PhoneStage>

        {/* Two caption beats */}
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
          <Caption text="Open to chat is always your choice." delay={30} out={120} />
        </AbsoluteFill>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
          <Caption text="You're only here while you're here." delay={132} />
        </AbsoluteFill>
      </CameraDrift>
    </CrossFade>
  );
};
