---
name: timing
description: Interpolation and timing in Remotion—prefer interpolate with Bézier easing; springs as a specialized option
metadata:
  tags: easing, bezier, interpolation, spring, timing
---

> Vendored from remotion-dev/skills.

Drive motion with `interpolate()` over an explicit frame range. To customize
timing, use **`Easing.bezier`**. The four parameters are the same as CSS
`cubic-bezier(x1, y1, x2, y2)`.

```ts
import { interpolate, Easing } from "remotion";

const opacity = interpolate(frame, [0, 60], [0, 1], {
  easing: Easing.bezier(0.16, 1, 0.3, 1),
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

By default values are NOT clamped — pass `extrapolateLeft/Right: "clamp"` to hold.

### Copy-paste curves

- **Crisp UI entrance (ease-out, no overshoot):** `Easing.bezier(0.16, 1, 0.3, 1)`
- **Editorial / slow fade (ease-in-out):** `Easing.bezier(0.45, 0, 0.55, 1)`
- **Playful overshoot:** `Easing.bezier(0.34, 1.56, 0.64, 1)`

### Preset easings

`Easing.in` (slow→fast), `Easing.out` (fast→slow), `Easing.inOut`. Named curves
from least to most curved: `quad`, `cubic`, `sin`, `exp`, `circle`. Use
`Easing.out` for enter animations and `Easing.in` for exit.

### Composing interpolations (the important pattern)

When multiple properties share timing, create ONE normalized progress (0→1) and
derive each property from it — separate **timing** from **mapping**:

```tsx
const progress = interpolate(frame, [start, start + dur], [0, 1], {
  easing: Easing.bezier(0.22, 1, 0.36, 1),
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
const x = interpolate(progress, [0, 1], [100, 0]);
const opacity = interpolate(progress, [0, 1], [0, 1]);
```
