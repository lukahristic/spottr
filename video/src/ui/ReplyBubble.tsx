import React from "react";
import { Img, staticFile } from "remotion";
import { COLORS, SHADOW } from "../theme/tokens";

/* Floating reply notification — Maya's avatar + name + quoted reply.
 * Uses the same DiceBear avatar as her live card for continuity. */
export const ReplyBubble: React.FC = () => (
  <div
    style={{
      width: 188,
      background: COLORS.white,
      borderRadius: 16,
      padding: "10px 14px",
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      boxShadow: SHADOW.reply,
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 999,
        background: COLORS.surface,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <Img
        src={staticFile("avatars/maya-r.png")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.ink, lineHeight: 1.35, margin: 0 }}>
        Maya replied
      </p>
      <p
        style={{
          fontSize: 10,
          color: COLORS.mute,
          lineHeight: 1.35,
          margin: "2px 0 0",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        &ldquo;Sure, mornings work!&rdquo;
      </p>
    </div>
  </div>
);
