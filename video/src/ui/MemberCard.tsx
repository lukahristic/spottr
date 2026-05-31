import React from "react";
import { Img, staticFile } from "remotion";
import { COLORS } from "../theme/tokens";
import { VIBE_STYLE, type Member } from "../data/members";

interface MemberCardProps {
  member: Member;
  /** Style fragment (entrance transform/opacity) or any override. */
  style?: React.CSSProperties;
  /** Show the real "Open to chat" sage badge when the member is open. */
  showOpen?: boolean;
  /** Use the custom-vibe line instead of the goal as the subtitle. */
  showCustom?: boolean;
}

/* Live member row — DiceBear avatar (initials fallback) + name + goal/custom
 * vibe + vibe pill + the real sage "Open to chat" badge. Mirrors the shipped
 * app's live.tsx card so the phone screen reads as the real product. */
export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  style,
  showOpen = true,
  showCustom = false,
}) => {
  const vibe = VIBE_STYLE[member.vibe];
  const subtitle = showCustom && member.customVibe ? member.customVibe : member.goal;
  return (
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
      <Avatar member={member} />

      {/* Name + subtitle */}
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
          {subtitle}
        </p>
      </div>

      {/* Vibe pill + open badge */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <Pill bg={vibe.bg} color={vibe.color} label={member.vibe} />
        {showOpen && member.open && <OpenBadge />}
      </div>
    </div>
  );
};

/* DiceBear PNG from public/avatars/<seed>.png, initials behind it as fallback. */
const Avatar: React.FC<{ member: Member; size?: number }> = ({ member, size = 36 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      background: COLORS.surface,
      flexShrink: 0,
      position: "relative",
      overflow: "hidden",
      border: "1px solid rgba(242,238,231,0.8)",
    }}
  >
    <span
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.28,
        fontWeight: 600,
        color: "rgba(43,43,43,0.55)",
      }}
    >
      {member.initials}
    </span>
    <Img
      src={staticFile(`avatars/${member.seed}.png`)}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
    />
  </div>
);

/* Real "Open to chat" pill — sage bg / deep-green text (app/(tabs)/live.tsx). */
const OpenBadge: React.FC = () => (
  <span
    style={{
      fontSize: 9,
      fontWeight: 600,
      padding: "3px 8px",
      borderRadius: 999,
      background: COLORS.sage,
      color: "#2b6b42",
      whiteSpace: "nowrap",
    }}
  >
    Open to chat
  </span>
);

export const Pill: React.FC<{ bg: string; color: string; label: string }> = ({ bg, color, label }) => (
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
