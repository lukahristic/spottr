import React from "react";
import { COLORS } from "../theme/tokens";

type IconName = "home" | "users" | "chat" | "person";

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  home: (
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
  ),
  users: (
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  ),
  chat: (
    <path
      fillRule="evenodd"
      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
      clipRule="evenodd"
    />
  ),
  person: (
    <path
      fillRule="evenodd"
      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
      clipRule="evenodd"
    />
  ),
};

const TabIcon: React.FC<{ icon: IconName; active: boolean }> = ({ icon, active }) => (
  <div
    style={{
      padding: 8,
      borderRadius: 12,
      background: active ? "rgba(223,175,58,0.15)" : "transparent",
    }}
  >
    <svg
      width={18}
      height={18}
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ color: active ? COLORS.gold : "rgba(43,43,43,0.25)", display: "block" }}
    >
      {ICON_PATHS[icon]}
    </svg>
  </div>
);

export const TabBar: React.FC<{ active?: IconName }> = ({ active = "home" }) => (
  <div
    style={{
      flexShrink: 0,
      borderTop: `1px solid rgba(242,238,231,0.7)`,
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      padding: "10px 12px 20px",
    }}
  >
    {(["home", "users", "chat", "person"] as IconName[]).map((icon) => (
      <TabIcon key={icon} icon={icon} active={icon === active} />
    ))}
  </div>
);
