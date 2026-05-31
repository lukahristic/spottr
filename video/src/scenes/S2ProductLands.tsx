import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { SCENES } from "./constants";
import { CrossFade } from "../motion/CrossFade";
import { CameraDrift } from "../motion/CameraDrift";
import { LightField } from "../ui/LightField";
import { PhoneStage } from "../ui/PhoneStage";
import { PhoneShell } from "../ui/PhoneShell";
import { MemberCard } from "../ui/MemberCard";
import { Caption } from "../ui/Caption";
import { MEMBERS, ARRIVING_MEMBER } from "../data/members";
import { SPRING_SOFT } from "../theme/ease";
import { COLORS } from "../theme/tokens";
import { SANS } from "../theme/fonts";

const D = SCENES.s2;
const CHECKIN = 96; // frame a new member checks in live
const VISIBLE = MEMBERS.slice(0, 4);

/* Scene 2 — "Here now". Cards stack in from below with staggered springs, then
 * a live check-in fires mid-scene: a new card expands in and the count ticks up.
 * "People are actively here right now." */
export const S2ProductLands: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Arriving card: height expand + spring slide.
  const arrive = spring({ frame: frame - CHECKIN, fps, config: SPRING_SOFT });
  const arriveHeight = interpolate(arrive, [0, 1], [0, 60]);

  // "+1 checked in" toast.
  const toast = interpolate(frame, [CHECKIN, CHECKIN + 10, CHECKIN + 46, CHECKIN + 58], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Header count pulse on check-in.
  const countPulse = interpolate(frame, [CHECKIN, CHECKIN + 8, CHECKIN + 20], [1, 1.18, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CrossFade durationInFrames={D} fadeIn={14} fadeOut={14}>
      <CameraDrift durationInFrames={D} scaleFrom={1.06} scaleTo={1.02} driftY={-6}>
        <LightField durationInFrames={D} driftY={6} intensity={0.7} />
        <PhoneStage cy={880} scale={2.15} bobAmp={3}>
          <PhoneShell
            countLabel={`${frame >= CHECKIN ? 5 : 4} here now`}
            title="Here now"
            activeTab="users"
          >
            {VISIBLE.map((m, i) => {
              const p = spring({ frame: frame - (8 + i * 7), fps, config: SPRING_SOFT });
              return (
                <MemberCard
                  key={m.seed}
                  member={m}
                  style={{ opacity: p, transform: `translateY(${(1 - p) * 26}px)` }}
                />
              );
            })}

            {/* Live check-in — expands into the list */}
            <div
              style={{
                height: arriveHeight,
                overflow: "hidden",
                opacity: arrive,
                transform: `translateY(${(1 - arrive) * 10}px)`,
              }}
            >
              <MemberCard member={ARRIVING_MEMBER} />
            </div>
          </PhoneShell>
        </PhoneStage>

        {/* Check-in toast */}
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 360 }}>
          <div
            style={{
              opacity: toast,
              transform: `scale(${countPulse})`,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: COLORS.white,
              borderRadius: 999,
              padding: "12px 20px",
              boxShadow: "0 8px 32px rgba(43,43,43,0.12)",
              fontFamily: SANS,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 999, background: COLORS.sage }} />
            <span style={{ fontSize: 26, fontWeight: 600, color: COLORS.ink }}>
              Priya just checked in
            </span>
          </div>
        </AbsoluteFill>

        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
          <Caption text="See who's actually here — right now." delay={28} />
        </AbsoluteFill>
      </CameraDrift>
    </CrossFade>
  );
};
