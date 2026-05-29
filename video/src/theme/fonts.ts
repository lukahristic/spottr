import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// Fraunces — serif, emotional headlines (Scenes 1 & 6).
export const fraunces = loadFraunces("normal", {
  weights: ["400", "500", "600"],
});

// Inter — sans, all UI + lower-third captions.
export const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
});

export const SERIF = fraunces.fontFamily;
export const SANS = inter.fontFamily;
