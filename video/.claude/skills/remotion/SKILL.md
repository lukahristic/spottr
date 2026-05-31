---
name: remotion-best-practices
description: Best practices for Remotion - Video creation in React
metadata:
  tags: remotion, video, react, animation, composition
---

> Vendored from https://github.com/remotion-dev/skills (skills/remotion).
> Use this whenever working on the Spottr promo video in `video/`. See
> `spottr-video.md` in this folder for how these conventions map onto this
> project's existing motion/UI utilities. Only the most-used rule files are
> vendored under `rules/`; the full set lives upstream.

## When to use

Use this skill whenever you are dealing with Remotion code to obtain the
domain-specific knowledge.

## Designing a video

Animate properties using `useCurrentFrame()` and `interpolate()`. Use Easing to
customize the timing of the animation.

```tsx
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

export const FadeIn = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return <div style={{ opacity }}>Hello World!</div>;
};
```

**CSS transitions or animations are FORBIDDEN — they will not render correctly.**
**Tailwind animation class names are FORBIDDEN — they will not render correctly.**

Place assets in the `public/` folder at your project root and reference them
with `staticFile()`. Use `<Img>`, and `<Video>`/`<Audio>` from `@remotion/media`.

To delay content wrap it in `<Sequence>` and use `from`. To limit duration use
`durationInFrames`. `<Sequence>` is an absolute fill by default; for inline
content use `layout="none"`.

The width, height, fps, and duration of a video are defined on `<Composition>`
in `src/Root.tsx`. Metadata can also be calculated dynamically with
`calculateMetadata`.

## Previewing & sanity checks

- `npx remotion studio` — live preview.
- `npx remotion still SpottrPromo out/frame.png --frame=30` — render one frame
  to sanity-check layout/colors/timing. (`--frame` is zero-based; at 30fps,
  frame 30 = the one-second mark.) Skip for trivial edits.
- `npx remotion render SpottrPromo out/spottr-promo.mp4` — full render.

## Key rules (the high-value ones)

- Drive ALL motion from `useCurrentFrame()` via `interpolate` + `Easing.bezier`,
  or `spring()` for physical moments. Never CSS.
- Separate **timing** (one normalized 0→1 progress) from **mapping** (derive
  multiple props from that one progress) — see `rules/timing.md`.
- Typewriters: always **string slicing**, never per-character opacity — see
  `rules/text-animations.md`.
- Scene transitions: see `rules/transitions.md` (TransitionSeries). For Spottr we
  deliberately avoid decorative wipes — prefer camera continuity.
- Clamp extrapolation (`extrapolateLeft/Right: "clamp"`) unless you want overflow.
