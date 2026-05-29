import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { SCENES } from "./constants";
import { CrossFade } from "../motion/CrossFade";
import { CameraDrift } from "../motion/CameraDrift";
import { LightField } from "../ui/LightField";
import { PhoneStage } from "../ui/PhoneStage";
import { PhoneShell } from "../ui/PhoneShell";
import { MemberCard } from "../ui/MemberCard";
import { ActiveBadge } from "../ui/ActiveBadge";
import { Caption } from "../ui/Caption";
import { MEMBERS, ARRIVING_MEMBER } from "../data/members";
import { fadeUp } from "../motion/fadeUp";
import { EASE } from "../theme/ease";

const D = SCENES.s3;
const TICK = 56; // frame at which the 5th member arrives

/* Scene 3 — Aliveness. The list breathes: the count ticks 4→5 and a new member
 * slides in. A floating "3 open to chat" badge drifts in. This is the signature
 * "the app is real and active" gesture. */
export const S3Aliveness: React.FC = () => {
  const frame = useCurrentFrame();
  const ticked = frame >= TICK;

  // Arriving card: expand height + fade as it joins the list.
  const arriveOpacity = interpolate(frame, [TICK, TICK + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const arriveHeight = interpolate(frame, [TICK, TICK + 18], [0, 56], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const arriveX = interpolate(frame, [TICK, TICK + 18], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  const badge = fadeUp(frame, { delay: 20, duration: 22, distance: 20 });

  return (
    <CrossFade durationInFrames={D} fadeIn={16} fadeOut={16}>
      <CameraDrift durationInFrames={D} scaleFrom={1.04} scaleTo={1.07} driftX={-14}>
        <LightField durationInFrames={D} driftY={-6} intensity={0.8} />

        <PhoneStage cy={840}>
          <PhoneShell countLabel={ticked ? "5 members" : "4 members"} activeTab="users">
            {MEMBERS.map((m) => (
              <MemberCard key={m.initials} member={m} />
            ))}
            {/* Arriving member — collapses from 0 height so the list grows live */}
            <div style={{ height: arriveHeight, overflow: "hidden", flexShrink: 0 }}>
              <MemberCard
                member={ARRIVING_MEMBER}
                style={{ opacity: arriveOpacity, transform: `translateX(${arriveX}px)` }}
              />
            </div>
          </PhoneShell>
        </PhoneStage>

        {/* Floating active badge — foreground plane, lower-left, scaled up */}
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1170,
            transform: `scale(2) translateY(${(1 - badge.opacity) * 18}px)`,
            transformOrigin: "left center",
            opacity: badge.opacity,
          }}
        >
          <ActiveBadge />
        </div>

        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
          <Caption text="Vibes — where you're at, not who you are." delay={30} />
        </AbsoluteFill>
      </CameraDrift>
    </CrossFade>
  );
};
