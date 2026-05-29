import { COLORS, VIBE_TEXT } from "../theme/tokens";

export interface Member {
  initials: string;
  name: string;
  goal: string;
  vibe: string;
  vibeBg: string;
  vibeColor: string;
  open: boolean;
}

/*
 * Same demo members as the live Hero (Alex / Maya / Sam), plus one extra
 * (Priya) that slides in during Scene 3's live tick (4 → 5 members).
 */
export const MEMBERS: Member[] = [
  {
    initials: "AJ",
    name: "Alex J.",
    goal: "Building strength",
    vibe: "Motivated",
    vibeBg: COLORS.tan,
    vibeColor: VIBE_TEXT.amber,
    open: false,
  },
  {
    initials: "MR",
    name: "Maya R.",
    goal: "Zone 2 cardio",
    vibe: "Focused",
    vibeBg: COLORS.sky,
    vibeColor: VIBE_TEXT.blue,
    open: true,
  },
  {
    initials: "SK",
    name: "Sam K.",
    goal: "Learning the basics",
    vibe: "Learning",
    vibeBg: COLORS.sage,
    vibeColor: VIBE_TEXT.emerald,
    open: true,
  },
];

// The member who arrives during the Scene-3 live tick.
export const ARRIVING_MEMBER: Member = {
  initials: "PD",
  name: "Priya D.",
  goal: "Just here to move",
  vibe: "Motivated",
  vibeBg: COLORS.tan,
  vibeColor: VIBE_TEXT.amber,
  open: false,
};
