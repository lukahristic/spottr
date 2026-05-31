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
import { Typewriter } from "../motion/Typewriter";
import { TypingIndicator } from "../motion/TypingIndicator";
import { SPRING_SOFT } from "../theme/ease";
import { COLORS, VIBE_TEXT } from "../theme/tokens";
import { SANS } from "../theme/fonts";

const D = SCENES.s5;
const COMPOSE = 18;
const SEND = 94;
const SENT = 106;
const TYPING = 150;
const REPLY = 214;

const INTRO = "Hey Maya — saw you do Zone 2 too. Morning sessions?";

/* Scene 5 — "The intro" (the payoff). Show the interaction, not the result:
 * type the message, send it (it flies into the thread), wait through the typing
 * indicator, then the reply lands. One hello. No pressure. */
export const S5Connection: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Outgoing bubble flies up from the composer on send.
  const sendP = spring({ frame: frame - SEND, fps, config: SPRING_SOFT });
  const sentTick = interpolate(frame, [SENT, SENT + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Send-button press.
  const press = interpolate(frame, [SEND - 2, SEND + 4, SEND + 12], [1, 0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Reply springs in.
  const replyP = spring({ frame: frame - REPLY, fps, config: SPRING_SOFT });
  const sent = frame >= SEND;

  return (
    <CrossFade durationInFrames={D} fadeIn={14} fadeOut={18}>
      <CameraDrift durationInFrames={D} scaleFrom={1.02} scaleTo={1.05} driftY={-6}>
        <LightField durationInFrames={D} driftY={6} intensity={0.7} />

        <PhoneStage cy={860} scale={2.5} bobAmp={2}>
          <PhoneShell title="Maya R." gymName="Intro" countLabel="New" activeTab="chat">
            {/* Messages area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6 }}>
              {/* Outgoing intro — flies up into place on send */}
              {sent && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    opacity: sendP,
                    transform: `translateY(${(1 - sendP) * 90}px)`,
                  }}
                >
                  <div
                    style={{
                      maxWidth: "80%",
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
                    {INTRO}
                  </div>
                </div>
              )}

              {/* Intro sent confirmation */}
              {sent && (
                <div
                  style={{
                    textAlign: "right",
                    fontSize: 9,
                    color: COLORS.mute,
                    fontFamily: SANS,
                    opacity: sentTick,
                  }}
                >
                  Intro sent ✓
                </div>
              )}

              {/* Typing indicator → reply */}
              <TypingIndicator startAt={TYPING} endAt={REPLY} />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  opacity: replyP,
                  transform: `translateY(${(1 - replyP) * 12}px)`,
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
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
            </div>

            {/* Composer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: COLORS.surface,
                borderRadius: 999,
                padding: "6px 6px 6px 12px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  fontSize: 11,
                  fontFamily: SANS,
                  color: sent ? COLORS.mute : COLORS.ink,
                  minWidth: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {sent ? (
                  <span style={{ color: COLORS.mute }}>Message…</span>
                ) : (
                  <Typewriter text={INTRO} startAt={COMPOSE} speed={0.75} caretOff={SEND} />
                )}
              </div>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: COLORS.gold,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${press})`,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12l16-7-7 16-2-7-7-2z" fill={COLORS.ink} />
                </svg>
              </div>
            </div>
          </PhoneShell>
        </PhoneStage>

        {/* Floating reply notification settles in from above */}
        <div
          style={{
            position: "absolute",
            right: 120,
            top: 330,
            transform: `scale(2) translateY(${(1 - replyP) * -24}px)`,
            transformOrigin: "right top",
            opacity: replyP,
          }}
        >
          <ReplyBubble />
        </div>

        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
          <Caption text="One hello. No pressure." delay={20} out={REPLY - 20} />
        </AbsoluteFill>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
          <Caption text="Maya replied." delay={REPLY + 8} />
        </AbsoluteFill>
      </CameraDrift>
    </CrossFade>
  );
};
