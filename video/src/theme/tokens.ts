/*
 * Spottr design tokens — single source of truth INSIDE the video project.
 *
 * Mirrors website/app/globals.css @theme block. If those change, change these.
 * The phone screen IS Spottr, so these must match the live product exactly.
 */
export const COLORS = {
  cream: "#faf8f4", // page / screen background
  surface: "#f2eee7", // cards, dividers — slightly darker than cream
  ink: "#2b2b2b", // primary text — never pure black
  mute: "#7a746d", // secondary text
  gold: "#dfaf3a", // primary CTA, key emphasis
  sage: "#b8d8c0", // "Open to chat"
  tan: "#f3d7b6", // learning / warm
  sky: "#c9d8e8", // focused / cool
  bezel: "#1c1c1e", // phone bezel + dynamic island
  white: "#ffffff",
} as const;

// Vibe pill text colors (Tailwind amber-900 / blue-900 / emerald-900 equivalents).
export const VIBE_TEXT = {
  amber: "#78350f",
  blue: "#1e3a8a",
  emerald: "#064e3b",
} as const;

// Ink-toned shadows — warm on cream, never cold black.
export const SHADOW = {
  phone:
    "0 40px 80px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.10)",
  reply:
    "0 8px 32px rgba(43,43,43,0.10), 0 1px 4px rgba(43,43,43,0.06)",
  badge:
    "0 4px 20px rgba(43,43,43,0.09), 0 1px 4px rgba(43,43,43,0.04)",
} as const;
