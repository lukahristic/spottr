import React from "react";
import { COLORS } from "../theme/tokens";
import type { Member } from "../data/members";

interface MemberCardProps {
  member: Member;
  /** Style fragment from fadeIn() for entrance, or any override. */
  style?: React.CSSProperties;
}

/* Live member row — avatar initials + name + goal + vibe pill + open badge.
 * Ported 1:1 from Hero.tsx MemberCard. */
export const MemberCard: React.FC<MemberCardProps> = ({ member, style }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "rgba(255,255,255,0.55)",
      borderRadius: 16,
      padding: "10px 12px",
      border: "1px solid rgba(242,238,231,0.5)",
      ...style,
    }}
  >
    {/* Avatar */}
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        background: COLORS.surface,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(242,238,231,0.8)",
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(43,43,43,0.55)" }}>
        {member.initials}
      </span>
    </div>

    {/* Name + goal */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, lineHeight: 1, margin: "0 0 3px" }}>
        {member.name}
      </p>
      <p
        style={{
          fontSize: 9.5,
          color: COLORS.mute,
          margin: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {member.goal}
      </p>
    </div>

    {/* Vibe pill + open badge */}
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
      <Pill bg={member.vibeBg} color={member.vibeColor} label={member.vibe} />
      {member.open && (
        <Pill bg="rgba(184,216,192,0.25)" color={COLORS.ink} label="Open ✦" />
      )}
    </div>
  </div>
);

const Pill: React.FC<{ bg: string; color: string; label: string }> = ({ bg, color, label }) => (
  <span
    style={{
      fontSize: 9,
      fontWeight: 600,
      padding: "3px 8px",
      borderRadius: 999,
      background: bg,
      color,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </span>
);
