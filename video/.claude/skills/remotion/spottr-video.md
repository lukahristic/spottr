# Spottr promo video — conventions

How the Remotion best-practices map onto THIS project (`video/`). Read this
alongside `SKILL.md` before changing the promo video.

## Reuse, don't reinvent

- **Timing/easing:** `theme/ease.ts` — `EASE` = `Easing.bezier(0.16,1,0.3,1)`,
  `SPRING_SOFT` for physical moments. Use these, not ad-hoc curves.
- **Entrances:** `motion/fadeUp.ts` (`fadeUp`, `fadeIn`), `motion/WordReveal.tsx`.
- **Kinetic motion:** `motion/countUp.ts`, `motion/momentumScroll.ts`,
  `motion/reorder.ts` (FLIP), `motion/pushIn.ts` (camera zoom),
  `motion/Ripple.tsx`, `motion/Typewriter.tsx` (string-slicing),
  `motion/TypingIndicator.tsx`.
- **Camera:** `motion/CameraDrift.tsx` (slow drift), `pushIn` (deep zoom).
- **Scene wrappers:** `motion/CrossFade.tsx` (pass the scene's own
  `durationInFrames` — `useVideoConfig` reports the whole comp inside a Sequence).
- **UI:** `ui/PhoneShell.tsx` + `ui/PhoneStage.tsx`, `ui/MemberCard.tsx`,
  `ui/ToggleSwitch.tsx`, `ui/ReplyBubble.tsx`, `ui/Caption.tsx`,
  `ui/LightField.tsx`.
- **Brand tokens:** `theme/tokens.ts` (must mirror the live app). Fonts in
  `theme/fonts.ts` (Fraunces serif headlines, Inter UI).

## Fidelity rules

The phone screen IS Spottr — keep it true to the shipped app:
- Vibes are the real six (`data/members.ts` `Vibe`), never invented labels.
- "Open to chat" badge = sage `#b8d8c0` bg / `#2b6b42` text.
- Avatars are DiceBear PNGs in `public/avatars/<seed>.png`
  (`scripts/fetch-avatars.mjs`), referenced via `staticFile()` — re-run the
  script if the roster changes so renders stay offline.

## Hard rules

- No CSS transitions/animations and no Tailwind animation classes — frame-driven
  only.
- Duration follows storytelling: `scenes/constants.ts` `TOTAL` drives
  `Root.tsx`. Don't pin a target runtime.
- No flashy transitions; prefer camera continuity.
- Don't add new dependencies (e.g. `@remotion/transitions`) without asking — the
  app is under a feature freeze (marketing/video changes are allowed; new deps
  are not).

## Verify

`npm run studio` to scrub; `npm run render:still` (or `remotion still … --frame=N`)
for a frame check; `npm run render` for the master.
