import { Easing } from "remotion";

/*
 * Single easing token for the whole film — expo-out, snappy deceleration.
 * Identical to the EASE curve used in website/components/sections/Hero.tsx
 * ([0.16, 1, 0.3, 1]). Everything settles; nothing snaps.
 */
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Gentle in-out for continuous idle floats (phone bob, card drift).
export const EASE_IN_OUT = Easing.inOut(Easing.ease);

// Spring config for the two "physical" moments (Scene-4 toggle, Scene-5 reply).
export const SPRING_SOFT = {
  damping: 18,
  mass: 0.9,
  stiffness: 120,
} as const;
