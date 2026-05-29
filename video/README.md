# Spottr — Promo Video (Remotion)

Standalone Remotion project that renders the 30s vertical (1080×1920, 30fps)
cinematic promo. **Isolated from the app and website** — nothing here is
imported by `app/` or `website/`, and it adds no dependency to either. This is
a marketing/build-time asset (allowed under the feature freeze).

## Run

```bash
cd video
npm install
npm run studio      # open Remotion Studio, scrub the timeline
npm run render      # → out/spottr-promo.mp4
```

## Structure

- `src/theme/` — tokens (mirror of `website/app/globals.css`), easing, fonts.
- `src/motion/` — reusable primitives: `fadeUp`, `floatIdle`, `WordReveal`,
  `CameraDrift`, `CrossFade`.
- `src/ui/` — phone UI ported pixel-for-pixel from
  `website/components/sections/Hero.tsx` (`PhoneShell`, `MemberCard`,
  `ReplyBubble`, `ActiveBadge`, `ToggleSwitch`, `TabBar`, `StatusBarIcons`,
  `Caption`, `LightField`, `PhoneStage`).
- `src/scenes/` — six scenes (S1–S6), each self-contained inside a `Sequence`.
- `src/SpottrPromo.tsx` — master composition sequencing the scenes.
- `src/audio/` — drop VO + music stems here (see `src/audio/README.md`).

## Timing (frames @ 30fps)

| Scene | Beat | Frames | Time |
|---|---|---|---|
| 1 | Recognition | 120 | 0:00–0:04 |
| 2 | Product lands | 180 | 0:04–0:10 |
| 3 | Aliveness | 150 | 0:10–0:15 |
| 4 | Trust / consent | 210 | 0:15–0:22 |
| 5 | Connection | 150 | 0:22–0:27 |
| 6 | Brand resolve | 90 | 0:27–0:30 |

Full creative direction lives in the approved plan at
`~/.claude/plans/use-any-relevant-skills-agile-avalanche.md`.
