/*
 * Scene durations in frames @ 30fps.
 *
 * Duration is intentionally NOT pinned to a target runtime — it's the sum of
 * what each scene needs. Tune these in Studio; Root.tsx reads TOTAL so the
 * composition length follows automatically.
 */
export const FPS = 30;

export const SCENES = {
  s1: 150, // The Scroll — hook        0:00–0:05
  s2: 200, // Here now — inhabited      0:05–0:11.7
  s3: 200, // Vibes — system working    0:11.7–0:18.3
  s4: 230, // Open to chat — hero        0:18.3–0:26
  s5: 320, // The intro — payoff         0:26–0:36.7
  s6: 150, // Resolve — brand close      0:36.7–0:41.7
} as const;

// Cumulative start frame of each scene (back-to-back; scenes hand off via a
// thin CrossFade overlap + camera continuity, not decorative wipes).
export const STARTS = {
  s1: 0,
  s2: SCENES.s1,
  s3: SCENES.s1 + SCENES.s2,
  s4: SCENES.s1 + SCENES.s2 + SCENES.s3,
  s5: SCENES.s1 + SCENES.s2 + SCENES.s3 + SCENES.s4,
  s6: SCENES.s1 + SCENES.s2 + SCENES.s3 + SCENES.s4 + SCENES.s5,
} as const;

export const TOTAL =
  SCENES.s1 + SCENES.s2 + SCENES.s3 + SCENES.s4 + SCENES.s5 + SCENES.s6;
