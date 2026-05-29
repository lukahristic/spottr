import React from "react";
import { useCurrentFrame } from "remotion";
import { PHONE_W, PHONE_H } from "./PhoneShell";
import { floatIdle } from "../motion/floatIdle";

interface PhoneStageProps {
  children: React.ReactNode;
  /** Uniform scale applied to the 260×510 base phone. */
  scale?: number;
  /** Center position of the phone in the 1080×1920 frame. */
  cx?: number;
  cy?: number;
  /** Extra transform applied on top (entrance offset etc). */
  offsetY?: number;
  opacity?: number;
  /** Continuous idle bob. */
  bob?: boolean;
  bobAmp?: number;
}

export const FRAME_W = 1080;
export const FRAME_H = 1920;

/* Positions a scaled PhoneShell at a center point in the frame, with an
 * optional continuous idle bob. The base phone keeps its exact px design;
 * only the wrapper scales, so the UI stays pixel-perfect. */
export const PhoneStage: React.FC<PhoneStageProps> = ({
  children,
  scale = 2.3,
  cx = FRAME_W / 2,
  cy = 880,
  offsetY = 0,
  opacity = 1,
  bob = true,
  bobAmp = 9,
}) => {
  const frame = useCurrentFrame();
  const bobY = bob ? floatIdle(frame, { amp: bobAmp, period: 150 }) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: cx - PHONE_W / 2,
        top: cy - PHONE_H / 2,
        width: PHONE_W,
        height: PHONE_H,
        transform: `translateY(${offsetY + bobY}px) scale(${scale})`,
        transformOrigin: "center center",
        opacity,
      }}
    >
      {children}
    </div>
  );
};
