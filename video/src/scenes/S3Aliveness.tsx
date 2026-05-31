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
import { MEMBERS, type Vibe } from "../data/members";
import { reorderY } from "../motion/reorder";
import { COLORS } from "../theme/tokens";
import { SANS } from "../theme/fonts";

const D = SCENES.s3;
const SELECT = 64; // frame the "Locked in" vibe is chosen
const ROW = 62;

const VIBES: Vibe[] = [
  "Locked in",
  "Finding my rhythm",
  "Taking it easy",
  "Quick session",
  "In between sets",
  "Just showing up",
];
const SELECTED: Vibe = "Locked in";
const SELECTED_INDEX = 0;

// Four visible members; two are "Locked in" so the reflow is legible.
const VISIBLE = [MEMBERS[0], MEMBERS[1], MEMBERS[2], MEMBERS[6]]; // Maya, Alex, Sam, Lena
// Where each card lands once "Locked in" rises to the top.
const TO_INDEX = [2, 0, 3, 1]; // Maya↓, Alex↑, Sam↓, Lena↑

/* Scene 3 — "Vibes". A vibe-chip ticker sweeps and locks on "Locked in"; the
 * member cards physically reflow so matching vibes rise to the top. The system,
 * working. */
export const S3Aliveness: React.FC = () => {
  const frame = useCurrentFrame();

  // Chip ticker: sweeps 0→5, then snaps to the selected vibe.
  const active =
    frame < SELECT
      ? Math.min(VIBES.length - 1, Math.floor(Math.max(0, frame - 8) / 7))
      : SELECTED_INDEX;
  const lockPulse = interpolate(frame, [SELECT, SELECT + 8, SELECT + 20], [1, 1.12, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CrossFade durationInFrames={D} fadeIn={14} fadeOut={14}>
      <CameraDrift durationInFrames={D} scaleFrom={1.03} scaleTo={1.06} driftX={-8}>
        <LightField durationInFrames={D} driftY={6} intensity={0.7} />
        <PhoneStage cy={860} scale={2.2} bobAmp={3}>
          <PhoneShell countLabel="5 here now" title="Here now" activeTab="users">
            {/* Vibe chip ticker */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingBottom: 4 }}>
              {VIBES.map((v, i) => {
                const on = i === active;
                const isLocked = frame >= SELECT && i === SELECTED_INDEX;
                return (
                  <span
                    key={v}
                    style={{
                      fontSize: 8.5,
                      fontWeight: 600,
                      fontFamily: SANS,
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: on ? COLORS.gold : COLORS.surface,
                      color: on ? COLORS.ink : COLORS.mute,
                      transform: isLocked ? `scale(${lockPulse})` : "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {v}
                  </span>
                );
              })}
            </div>

            {/* Reordering list — absolutely positioned cards sliding into slots */}
            <div style={{ position: "relative", height: ROW * VISIBLE.length, marginTop: 2 }}>
              {VISIBLE.map((m, i) => {
                const y = reorderY(frame, i, TO_INDEX[i], {
                  rowHeight: ROW,
                  startAt: SELECT,
                  duration: 26,
                });
                const isMatch = m.vibe === SELECTED;
                const highlight = frame >= SELECT && isMatch ? 1 : 0;
                return (
                  <div
                    key={m.seed}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      transform: `translateY(${y}px)`,
                    }}
                  >
                    <MemberCard
                      member={m}
                      style={{
                        outline: highlight ? `1.5px solid ${COLORS.gold}` : "none",
                        outlineOffset: 1,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </PhoneShell>
        </PhoneStage>

        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
          <Caption text="Vibes — where you're at, not who you are." delay={SELECT + 18} />
        </AbsoluteFill>
      </CameraDrift>
    </CrossFade>
  );
};
