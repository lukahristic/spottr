import React from "react";
import { COLORS } from "../theme/tokens";

/* iOS-style status bar: signal bars + wifi + battery. Ported 1:1 from Hero.tsx. */
export const StatusBarIcons: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    {/* Signal bars */}
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2.5 }}>
      {[3, 5, 7, 9].map((h, i) => (
        <div
          key={i}
          style={{
            width: 2.5,
            height: h,
            background: "rgba(43,43,43,0.4)",
            borderRadius: 1,
          }}
        />
      ))}
    </div>
    {/* Wi-Fi */}
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" style={{ color: "rgba(43,43,43,0.4)" }}>
      <path
        d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx={12} cy={20} r={1.5} fill="currentColor" />
    </svg>
    {/* Battery */}
    <svg width={22} height={11} viewBox="0 0 22 11" fill="none" style={{ color: "rgba(43,43,43,0.45)" }}>
      <rect x={0.5} y={0.5} width={18} height={10} rx={2.5} stroke="currentColor" />
      <rect x={2} y={2} width={14} height={7} rx={1.5} fill="currentColor" />
      <path d="M20 3.5v4a1.5 1.5 0 000-4z" fill="currentColor" />
    </svg>
  </div>
);

export const StatusBar: React.FC = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 24px 4px",
      flexShrink: 0,
    }}
  >
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "rgba(43,43,43,0.7)",
        letterSpacing: "-0.01em",
      }}
    >
      9:41
    </span>
    <StatusBarIcons />
  </div>
);

export const DynamicIsland: React.FC = () => (
  <div style={{ display: "flex", justifyContent: "center", marginTop: -2, marginBottom: 4, flexShrink: 0 }}>
    <div style={{ width: 88, height: 24, borderRadius: 999, background: COLORS.bezel }} />
  </div>
);
