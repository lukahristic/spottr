---
name: text-animations
description: Typography and text animation patterns for Remotion.
metadata:
  tags: typography, text, typewriter, highlighter
---

> Vendored from remotion-dev/skills.

## Typewriter effect

Based on `useCurrentFrame()`, reduce the string character by character.
**Always use string slicing for typewriter effects. Never use per-character
opacity.**

```tsx
const count = Math.min(text.length, Math.floor(Math.max(0, frame - startAt) * speed));
const shown = text.slice(0, count);
```

In this project this is implemented as `motion/Typewriter.tsx` — reuse it.

## Word highlighting

Animate a highlight across words like a highlighter pen (see upstream for the
full example). In this project, per-word headline reveals use
`motion/WordReveal.tsx`.
