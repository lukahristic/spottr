import { COLORS, VIBE_TEXT } from "../theme/tokens";

/*
 * Demo roster for the promo. Vibes are the REAL six from the shipped app
 * (app/(tabs)/live.tsx) — never invented labels. Custom-vibe text uses the
 * app's real placeholder voice. Avatars are DiceBear PNGs pre-downloaded into
 * public/avatars/<seed>.png (see scripts/fetch-avatars.mjs) so renders never
 * touch the network. `initials` stays as the fallback if a PNG is missing.
 */

/** The six real vibes, in the app's order. */
export type Vibe =
  | "Locked in"
  | "Finding my rhythm"
  | "Taking it easy"
  | "Quick session"
  | "In between sets"
  | "Just showing up";

/** Warm pill styling per vibe — drawn only from the cream palette tokens. */
export const VIBE_STYLE: Record<Vibe, { bg: string; color: string }> = {
  "Locked in": { bg: COLORS.tan, color: VIBE_TEXT.amber },
  "Finding my rhythm": { bg: COLORS.sky, color: VIBE_TEXT.blue },
  "Taking it easy": { bg: COLORS.sage, color: VIBE_TEXT.emerald },
  "Quick session": { bg: COLORS.tan, color: VIBE_TEXT.amber },
  "In between sets": { bg: COLORS.sky, color: VIBE_TEXT.blue },
  "Just showing up": { bg: COLORS.sage, color: VIBE_TEXT.emerald },
};

export interface Member {
  /** DiceBear seed — also the avatar filename: public/avatars/<seed>.png. */
  seed: string;
  initials: string;
  name: string;
  goal: string;
  vibe: Vibe;
  /** Real custom-vibe line (app placeholder voice). */
  customVibe?: string;
  open: boolean;
  /** "checked in N mins ago" label. */
  when?: string;
}

/* Full roster — deep enough for the Scene-1 scroll. Maya is the Scene-5 reply
 * partner; Priya is the live check-in that fires in Scene 2. */
export const MEMBERS: Member[] = [
  {
    seed: "maya-r",
    initials: "MR",
    name: "Maya R.",
    goal: "Zone 2 cardio",
    vibe: "Finding my rhythm",
    customVibe: "finally enjoying cardio",
    open: true,
    when: "2 mins ago",
  },
  {
    seed: "alex-j",
    initials: "AJ",
    name: "Alex J.",
    goal: "Building strength",
    vibe: "Locked in",
    customVibe: "leg day, send prayers",
    open: false,
    when: "5 mins ago",
  },
  {
    seed: "sam-k",
    initials: "SK",
    name: "Sam K.",
    goal: "Learning the basics",
    vibe: "Just showing up",
    customVibe: "first time, be nice",
    open: true,
    when: "8 mins ago",
  },
  {
    seed: "jordan-t",
    initials: "JT",
    name: "Jordan T.",
    goal: "Marathon prep",
    vibe: "In between sets",
    customVibe: "say hi, I'm resting",
    open: true,
    when: "11 mins ago",
  },
  {
    seed: "chris-m",
    initials: "CM",
    name: "Chris M.",
    goal: "Staying consistent",
    vibe: "Quick session",
    customVibe: "quick one before work",
    open: false,
    when: "13 mins ago",
  },
  {
    seed: "noah-b",
    initials: "NB",
    name: "Noah B.",
    goal: "Just here to move",
    vibe: "Finding my rhythm",
    customVibe: "lost but committed",
    open: true,
    when: "16 mins ago",
  },
  {
    seed: "lena-k",
    initials: "LK",
    name: "Lena K.",
    goal: "Olympic lifts",
    vibe: "Locked in",
    customVibe: "manifesting the gains",
    open: false,
    when: "19 mins ago",
  },
];

/** The member who checks in live during Scene 2 (count ticks up). */
export const ARRIVING_MEMBER: Member = {
  seed: "priya-d",
  initials: "PD",
  name: "Priya D.",
  goal: "Just here to move",
  vibe: "Taking it easy",
  customVibe: "winging it today",
  open: true,
  when: "just now",
};

/** Convenience: full cast for the Scene-1 scroll. */
export const ALL_MEMBERS: Member[] = [...MEMBERS, ARRIVING_MEMBER];
