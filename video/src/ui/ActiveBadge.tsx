import React from "react";
import { COLORS, SHADOW } from "../theme/tokens";

/* Floating "3 open to chat" badge with stacked avatar circles.
 * Ported 1:1 from Hero.tsx ActiveBadge. */
export const ActiveBadge: React.FC = () => (
  <div
    style={{
      background: COLORS.white,
      borderRadius: 12,
      padding: "10px 12px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      boxShadow: SHADOW.badge,
    }}
  >
    <div style={{ display: "flex", flexShrink: 0 }}>
      {[COLORS.sage, COLORS.tan, COLORS.sky].map((c, i) => (
        <div
          key={i}
          style={{
            width: 20,
            height: 20,
            borderRadius: 999,
            background: c,
            border: "2px solid #fff",
            marginLeft: i === 0 ? 0 : -6,
          }}
        />
      ))}
    </div>
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.ink, whiteSpace: "nowrap", lineHeight: 1.35, margin: 0 }}>
        3 open to chat
      </p>
      <p style={{ fontSize: 9, color: COLORS.mute, whiteSpace: "nowrap", lineHeight: 1.35, margin: 0 }}>
        at Iron House right now
      </p>
    </div>
  </div>
);

/* Bare stacked-avatar cluster (no card) — used in Scene 1 as anonymous presence. */
export const AvatarCluster: React.FC<{ size?: number }> = ({ size = 44 }) => {
  const border = Math.max(2, Math.round(size * 0.09));
  return (
    <div style={{ display: "flex" }}>
      {[COLORS.sage, COLORS.tan, COLORS.sky, COLORS.surface].map((c, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: 999,
            background: c,
            border: `${border}px solid ${COLORS.cream}`,
            marginLeft: i === 0 ? 0 : -size * 0.32,
          }}
        />
      ))}
    </div>
  );
};
