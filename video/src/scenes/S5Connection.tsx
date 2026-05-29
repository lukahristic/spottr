import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { SCENES } from "./constants";
import { CrossFade } from "../motion/CrossFade";
import { CameraDrift } from "../motion/CameraDrift";
import { LightField } from "../ui/LightField";
import { PhoneStage } from "../ui/PhoneStage";
import { PhoneShell } from "../ui/PhoneShell";
import { ReplyBubble } from "../ui/ReplyBubble";
import { Caption } from "../ui/Caption";
import { SPRING_SOFT } from "../theme/ease";
import { fadeUp } from "../motion/fadeUp";
import { COLORS, VIBE_TEXT } from "../theme/tokens";
import { SANS } from "../theme/fonts";

const D = SCENES.s5;
const REPLY_AT = 78;

/* Scene 5 — The quiet connection. One intro sends; a reply settles in. The
 * "one intro until reply" rule shown as a gentle, mutual moment. */
export const S5Connection: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = fadeUp(frame, { delay: 12, duration: 18, distance: 16 });
  const sent = interpolate(frame, [40, 56], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const replySpring = spring({ frame: frame - REPLY_AT, fps, config: SPRING_SOFT });
  const replyY = interpolate(replySpring, [0, 1], [-30, 0]);

  return (
    <CrossFade durationInFrames={D} fadeIn={16} fadeOut={16}>
      <CameraDrift durationInFrames={D} scaleFrom={1.02} scaleTo={1.06} driftY={-8}>
        <LightField durationInFrames={D} driftY={6} intensity={0.7} />

        <PhoneStage cy={860} scale={2.5}>
          <PhoneShell title="Maya R." gymName="Intro" countLabel="New" activeTab="chat">
            {/* Outgoing intro bubble */}
            <div style={{ display: "flex", justifyContent: "flex-end", ...intro }}>
              <div
                style={{
                  maxWidth: "78%",
                  background: COLORS.gold,
                  color: COLORS.ink,
                  borderRadius: 14,
                  borderBottomRightRadius: 4,
                  padding: "8px 11px",
                  fontSize: 11,
                  fontWeight: 500,
                  fontFamily: SANS,
                  lineHeight: 1.35,
                }}
              >
                Hey Maya — saw you do Zone 2 too. Morning sessions?
              </div>
            </div>

            {/* Intro sent confirmation */}
            <div
              style={{
                textAlign: "right",
                fontSize: 9,
                color: COLORS.mute,
                fontFamily: SANS,
                opacity: sent,
                marginTop: 2,
              }}
            >
              Intro sent ✓
            </div>

            {/* Incoming reply bubble inside the thread */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                opacity: replySpring,
                transform: `translateY(${(1 - replySpring) * 12}px)`,
                marginTop: 6,
              }}
            >
              <div
                style={{
                  maxWidth: "78%",
                  background: COLORS.sky,
                  color: VIBE_TEXT.blue,
                  borderRadius: 14,
                  borderBottomLeftRadius: 4,
                  padding: "8px 11px",
                  fontSize: 11,
                  fontWeight: 500,
                  fontFamily: SANS,
                  lineHeight: 1.35,
                }}
              >
                Sure, mornings work!
              </div>
            </div>
          </PhoneShell>
        </PhoneStage>

        {/* Floating reply notification — settles in from above, top-right */}
        <div
          style={{
            position: "absolute",
            right: 120,
            top: 360,
            transform: `scale(2) translateY(${replyY}px)`,
            transformOrigin: "right top",
            opacity: replySpring,
          }}
        >
          <ReplyBubble />
        </div>

        {/* Caption beats */}
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
          <Caption text="One hello. No pressure." delay={16} out={70} />
        </AbsoluteFill>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
          <Caption text="Maya replied." delay={84} />
        </AbsoluteFill>
      </CameraDrift>
    </CrossFade>
  );
};
