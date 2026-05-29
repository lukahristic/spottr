/* Scene durations in frames @ 30fps. Sum = 900 = 30.0s exactly. */
export const FPS = 30;

export const SCENES = {
  s1: 120, // Recognition       0:00–0:04
  s2: 180, // Product lands      0:04–0:10
  s3: 150, // Aliveness          0:10–0:15
  s4: 210, // Trust / consent    0:15–0:22
  s5: 150, // Connection         0:22–0:27
  s6: 90, //  Brand resolve      0:27–0:30
} as const;

// Cumulative start frame of each scene (back-to-back; crossfades dissolve
// through the cream background between scenes).
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
