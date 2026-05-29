import React from "react";
import { COLORS, SHADOW } from "../theme/tokens";
import { StatusBar, DynamicIsland } from "./StatusBarIcons";
import { TabBar } from "./TabBar";

/* Base logical size — identical to the Hero phone. Scenes scale the whole
 * shell with transform: scale() so every px-tuned value stays pixel-perfect. */
export const PHONE_W = 260;
export const PHONE_H = 510;

interface PhoneShellProps {
  /** Header member-count label, e.g. "4 members". */
  countLabel?: string;
  /** Which tab is highlighted. */
  activeTab?: "home" | "users" | "chat" | "person";
  /** Body content (member list, toggle view, message view). */
  children?: React.ReactNode;
  /** Gym name eyebrow. */
  gymName?: string;
  /** Header title, e.g. "Here now". */
  title?: string;
}

export const PhoneShell: React.FC<PhoneShellProps> = ({
  countLabel = "4 members",
  activeTab = "home",
  gymName = "Iron House Gym",
  title = "Here now",
  children,
}) => (
  <div
    style={{
      width: PHONE_W,
      height: PHONE_H,
      borderRadius: 40,
      background: COLORS.bezel,
      padding: 3.5,
      boxShadow: SHADOW.phone,
      // subtle edge highlight
      outline: "0.5px solid rgba(255,255,255,0.08)",
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 36,
        background: COLORS.cream,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <StatusBar />
      <DynamicIsland />

      {/* App header */}
      <div style={{ padding: "8px 20px 10px", flexShrink: 0 }}>
        <p
          style={{
            fontSize: 9.5,
            color: COLORS.mute,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            fontWeight: 500,
            margin: "0 0 2px",
          }}
        >
          {gymName}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink, lineHeight: 1 }}>
            {title}
          </span>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: COLORS.surface,
              borderRadius: 999,
              padding: "5px 10px",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.sage, flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 500, color: COLORS.mute, lineHeight: 1 }}>
              {countLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ margin: "0 20px", height: 1, background: COLORS.surface, flexShrink: 0 }} />

      {/* Body */}
      <div
        style={{
          flex: 1,
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflow: "hidden",
        }}
      >
        {children}
      </div>

      <TabBar active={activeTab} />
    </div>
  </div>
);
