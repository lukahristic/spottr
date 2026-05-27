# Marketing Site — Code-Built Phone Mockups

**When to use:** Any section of the marketing website that previously used raw device screenshots (`<PhoneFrame src="...">` with `/screenshots/*.png` files). Apply this pattern whenever adding or refreshing a section that needs an app UI illustration.

---

## Why this exists

Raw screenshots feel messy on a marketing site:
- Device-specific chrome (notch shape, status bar text) is distracting
- Photo compression artifacts
- Can't be updated without retaking screenshots
- No control over the exact state shown

Code-built mockups let us show **exactly the right state** of the UI, using our own design tokens, at any size.

---

## The pattern

### Full phone (used in Hero)

A phone with a dark bezel, Dynamic Island, status bar icons, and scrollable app screen content. Used for the hero where the phone is the hero visual.

```
PhoneShell                      ← outer: dark bezel, ring highlight, drop shadow
  └── PhoneScreen               ← inner: cream bg, rounded
        ├── StatusBarIcons      ← signal bars + wifi + battery SVGs
        ├── DynamicIsland       ← centered black pill
        ├── AppHeader           ← gym name breadcrumb + "Here now" + member count
        ├── Divider
        ├── MemberCard × N      ← avatar initials + name + goal + vibe pill + open badge
        └── TabBar              ← 4 SVG tab icons, active = gold/bg-gold/15
```

**Key measurements (Hero phone: 260×510px):**
- Outer radius: `rounded-[2.5rem]`
- Bezel padding: `p-[3.5px]`
- Inner radius: `rounded-[2.25rem]`
- Dynamic Island: `w-[88px] h-[24px]`
- Shadow: `shadow-[0_40px_80px_rgba(0,0,0,0.22),0_8px_24px_rgba(0,0,0,0.10)]`
- Edge ring: `ring-[0.5px] ring-white/[0.08]`

### Mini phone (used in HowItWorks)

A smaller phone (max 200px wide, `aspect-[9/18]`) used inside section cards. Same bezel style, simplified content — just the Dynamic Island + relevant screen for that step.

```
MiniPhone                       ← max-w-[200px] mx-auto, aspect-[9/18]
  └── [step-specific screen]    ← GymListScreen | VibeScreen | IntroScreen
```

**Key measurements (mini phone):**
- Outer radius: `rounded-[2rem]`
- Bezel padding: `p-[3px]`
- Inner radius: `rounded-[1.75rem]`
- Dynamic Island: `w-[70px] h-[20px]`
- Shadow: `shadow-[0_24px_60px_rgba(0,0,0,0.16),0_4px_12px_rgba(0,0,0,0.08)]`

---

## Floating notification pattern

Used on the Hero to add social proof and depth. Floating cards are positioned **absolutely** relative to a sized container, overlapping the phone edges.

```
Container (relative, explicit px dimensions)
  ├── ReplyBubble          top: 8, right: 0    ← overlaps phone top-right corner
  ├── ActiveBadge          bottom: 40, left: 0 ← overlaps phone lower-left edge
  └── PhoneFrame           absolute, z-10      ← phone itself floats with bob anim
```

**ReplyBubble anatomy:**
- `bg-white` card, `rounded-2xl`
- Shadow: `shadow-[0_8px_32px_rgba(43,43,43,0.10),0_1px_4px_rgba(43,43,43,0.06)]`
- Avatar circle (initials, colored with brand pastel: sky/sage/tan)
- Bold name line + muted quote line

**ActiveBadge anatomy:**
- `bg-white` card, `rounded-xl`
- Shadow: `shadow-[0_4px_20px_rgba(43,43,43,0.09),0_1px_4px_rgba(43,43,43,0.04)]`
- Three stacked avatar circles (`-space-x-1.5`, `border-[2px] border-white`)
- Bold member count + muted location/context line

**Entrance animation:**
```tsx
initial={{ opacity: 0, y: 14, scale: 0.96 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ delay: 1.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
```
Stagger second card by +0.35s from first.

---

## Design tokens inside phone mockups

Always use the project's own tokens inside the mockup — the phone screen IS Spottr, so it should look exactly like the app:

| Element | Token |
|---------|-------|
| Screen background | `bg-cream` |
| Card background | `bg-white/55` or `bg-surface/80` |
| Primary text | `text-ink` |
| Secondary text | `text-mute` |
| Active/selected | `bg-ink text-cream` |
| Open to chat badge | `bg-sage/25 text-emerald-900` |
| CTA button | `bg-gold text-ink` |
| Focused vibe | `bg-sky text-blue-900` |
| Motivated vibe | `bg-tan text-amber-900` |
| Learning vibe | `bg-sage text-emerald-900` |
| Active tab | `text-gold bg-gold/15` |
| Inactive tab | `text-ink/25` |

---

## Text sizing inside phones

Never use standard body text sizes. Phones are small — everything needs to scale down:

| Context | Size |
|---------|------|
| Section label (e.g. "IRON HOUSE GYM") | `text-[9.5px]` uppercase tracking |
| Primary content (e.g. member name, screen title) | `text-[11px]–text-[15px]` |
| Secondary content (e.g. fitness goal, location) | `text-[9px]–text-[10px]` |
| Vibe pills | `text-[9px]` |
| Open badge | `text-[9px]` |
| Status bar time | `text-[11px] font-semibold` |
| Notification bubble title | `text-[11px] font-semibold` |
| Notification bubble body | `text-[10px] text-mute` |

---

## Shadows — use ink-toned, not pure black

The site has a warm cream background. Pure black (`rgba(0,0,0,...)`) shadows look cold. Use ink-toned shadows instead:

```
// Phone drop shadow
shadow-[0_40px_80px_rgba(0,0,0,0.22),0_8px_24px_rgba(0,0,0,0.10)]

// Floating card shadow (notification/badge)  
shadow-[0_8px_32px_rgba(43,43,43,0.10),0_1px_4px_rgba(43,43,43,0.06)]
```

`rgba(43,43,43,...)` = the ink color (`#2b2b2b`) — blends warmer on cream.

---

## Do not

- Use raw `<PhoneFrame>` with screenshots for new sections
- Use `glass-morphism` (backdrop-blur heavy cards) — too cold for this brand
- Over-animate — one subtle float on the phone is enough
- Add more than 2 floating elements per section
- Use pure black `rgba(0,0,0,...)` for floating card shadows
- Show generic/fake UI that doesn't match the actual app's design language
