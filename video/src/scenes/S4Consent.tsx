import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { SCENES } from "./constants";
import { CrossFade } from "../motion/CrossFade";
import { LightField } from "../ui/LightField";
import { PhoneStage } from "../ui/PhoneStage";
import { PhoneShell } from "../ui/PhoneShell";
import { ToggleSwitch } from "../ui/ToggleSwitch";
import { Caption } from "../ui/Caption";
import { Ripple } from "../motion/Ripple";
import { pushIn } from "../motion/pushIn";
import { SPRING_SOFT } from "../theme/ease";
import { COLORS } from "../theme/tokens";
import { SANS } from "../theme/fonts";

const D = SCENES.s4;
const TOGGLE_AT = 46; // frame the toggle flips on

/* Scene 4 — "Open to chat" (the hero moment). A deep push-in onto the toggle;
 * the background recedes. The toggle springs on with a ripple, and the sage
 * "Open to chat" badge morphs into your status. Consent, shown not told. */
export const S4Consent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const toggle = spring({ frame: frame - TOGGLE_AT, fps, config: SPRING_SOFT });
  const badge = spring({ frame: frame - (TOGGLE_AT + 8), fps, config: SPRING_SOFT });

  // Deep zoom toward the toggle (top of the card).
  const zoom = pushIn(frame, { scaleFrom: 1, scaleTo: 1.22, startAt: 0, duration: 70 });

  return (
    <CrossFade durationInFrames={D} fadeIn={14} fadeOut={16}>
      {/* Background recedes (parallax + blur) as we push in. */}
      <div style={{ position: "absolute", inset: 0, filter: `blur(${zoom.t * 6}px)`, opacity: 1 - zoom.t * 0.35 }}>
        <LightField durationInFrames={D} driftY={6} intensity={0.7} />
      </div>

      <AbsoluteFill style={{ transform: zoom.transform, transformOrigin: "center 38%" }}>
        <PhoneStage cy={870} scale={2.5} bobAmp={2}>
            <PhoneShell title="Your status" countLabel="Checked in" activeTab="person">
              {/* Toggle card */}
              <div
                style={{
                  background: "rgba(255,255,255,0.65)",
                  borderRadius: 16,
                  border: "1px solid rgba(242,238,231,0.6)",
                  padding: "14px 14px 12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, fontFamily: SANS }}>
                    Open to chat
                  </span>
                  {/* Ripple centered on the toggle */}
                  <div style={{ position: "relative" }}>
                    <Ripple startAt={TOGGLE_AT} color={COLORS.sage} size={120} />
                    <ToggleSwitch progress={toggle} width={46} />
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 9.5,
                    color: COLORS.mute,
                    margin: "9px 0 0",
                    fontFamily: SANS,
                    lineHeight: 1.4,
                  }}
                >
                  Resets every visit. Always your choice.
                </p>
              </div>

              {/* Your status preview — the sage badge morphs in */}
              <div
                style={{
                  marginTop: 10,
                  background: "rgba(255,255,255,0.5)",
                  borderRadius: 16,
                  border: "1px solid rgba(242,238,231,0.5)",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: COLORS.mute, margin: "0 0 4px", fontFamily: SANS }}>
                    You&rsquo;ll show as
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, margin: 0, fontFamily: SANS }}>
                    Locked in · leg day, send prayers
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: COLORS.sage,
                    color: "#2b6b42",
                    whiteSpace: "nowrap",
                    fontFamily: SANS,
                    opacity: badge,
                    transform: `scale(${interpolate(badge, [0, 1], [0.6, 1])})`,
                  }}
                >
                  Open to chat
                </span>
              </div>
            </PhoneShell>
        </PhoneStage>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
        <Caption text="Open to chat is always your choice." delay={TOGGLE_AT + 14} out={D - 30} />
      </AbsoluteFill>
    </CrossFade>
  );
};
