import React from "react";
import { COLORS } from "../theme/tokens";

interface ToggleSwitchProps {
  /** 0 = off, 1 = on. Drive with a spring for the Scene-4 settle. */
  progress: number;
  width?: number;
}

/* The "Open to chat" toggle — the hero prop of Scene 4.
 * Off = surface track / left knob. On = sage track / right knob. */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ progress, width = 52 }) => {
  const clamped = Math.max(0, Math.min(1, progress));
  const height = width * 0.58;
  const knob = height - 8;
  const travel = width - knob - 8;

  // Blend surface → sage as it turns on.
  const track = clamped < 0.001 ? COLORS.surface : blend(COLORS.surface, COLORS.sage, clamped);

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 999,
        background: track,
        position: "relative",
        flexShrink: 0,
        transition: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 4,
          left: 4 + travel * clamped,
          width: knob,
          height: knob,
          borderRadius: 999,
          background: COLORS.white,
          boxShadow: "0 1px 3px rgba(43,43,43,0.25)",
        }}
      />
    </div>
  );
};

function blend(a: string, b: string, t: number): string {
  const pa = hex(a);
  const pb = hex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hex(h: string): [number, number, number] {
  const v = h.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
