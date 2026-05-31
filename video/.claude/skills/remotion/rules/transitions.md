---
name: transitions
description: Scene transitions and overlays for Remotion using TransitionSeries.
metadata:
  tags: transitions, overlays, fade, slide, wipe, scenes
---

> Vendored from remotion-dev/skills.

`<TransitionSeries>` arranges scenes with:
- **Transitions** (`<TransitionSeries.Transition>`) — crossfade, slide, wipe.
  Shortens the timeline (both scenes play during the transition).
- **Overlays** (`<TransitionSeries.Overlay>`) — effect on top of the cut without
  shortening the timeline.

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}><SceneA /></TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
  <TransitionSeries.Sequence durationInFrames={60}><SceneB /></TransitionSeries.Sequence>
</TransitionSeries>
```

Transitions available: `fade`, `slide({ direction })`, `wipe`, `flip`,
`clockWipe`. Timing: `linearTiming({ durationInFrames })` or
`springTiming({ config, durationInFrames })`. Get a transition's length with
`timing.getDurationInFrames({ fps })`.

**Spottr note:** the founder explicitly does NOT want flashy transitions. Prefer
**camera continuity** (one scene's push-in hands off to the next) and thin
`CrossFade` overlaps over wipes/flips/clock-wipes. `@remotion/transitions` is
not currently a dependency — don't add it without asking.
