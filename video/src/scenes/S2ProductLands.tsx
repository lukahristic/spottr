import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { SCENES } from "./constants";
import { CrossFade } from "../motion/CrossFade";
import { CameraDrift } from "../motion/CameraDrift";
import { LightField } from "../ui/LightField";
import { PhoneStage } from "../ui/PhoneStage";
import { PhoneShell } from "../ui/PhoneShell";
import { MemberCard } from "../ui/MemberCard";
import { Caption } from "../ui/Caption";
import { MEMBERS } from "../data/members";
import { fadeIn } from "../motion/fadeUp";
import { EASE } from "../theme/ease";

const D = SCENES.s2;

/* Scene 2 — The product lands. Phone rises from below into a slow bob; member
 * cards stagger in. The concept becomes legible in one frame. */
export const S2ProductLands: React.FC = () => {
  const frame = useCurrentFrame();

  // Phone entrance: rise + fade over the first ~26 frames.
  const enterY = interpolate(frame, [0, 26], [70, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const enterOpacity = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CrossFade durationInFrames={D} fadeIn={16} fadeOut={16}>
      <CameraDrift durationInFrames={D} scaleFrom={1.02} scaleTo={1.05} driftY={-10}>
        <LightField durationInFrames={D} driftY={-8} intensity={0.85} />

        <PhoneStage offsetY={enterY} opacity={enterOpacity} cy={840}>
          <PhoneShell countLabel="4 members" activeTab="users">
            {MEMBERS.map((m, i) => (
              <MemberCard
                key={m.initials}
                member={m}
                style={fadeIn(frame, { delay: 22 + i * 8, duration: 16, distance: 16 })}
              />
            ))}
          </PhoneShell>
        </PhoneStage>

        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 170 }}>
          <Caption text="See who's actually here — right now." delay={64} />
        </AbsoluteFill>
      </CameraDrift>
    </CrossFade>
  );
};
