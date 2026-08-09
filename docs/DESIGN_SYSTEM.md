# Design System

## Identity

Dark-first coding environment. Not a generic SaaS look — the reference
points are a code editor and a terminal, not a marketing dashboard template.

## Palette (CSS variables, dark default / light override)

- Background: deep charcoal (`#0a0b0f` dark / `#fafafa` light), not pure
  black — pure black kills depth on OLED-adjacent charcoal cards.
- Surface/card: navy-charcoal one step up (`#12141c` dark), subtle 1px
  border (`rgba(255,255,255,0.08)`), no heavy drop shadows — depth comes
  from border + slight background delta, not shadow stacking.
- Primary accent: electric blue (`#4f8dff`).
- Secondary accents used sparingly for state, not decoration: purple
  (`#a78bfa`) for AI/tutor surfaces, cyan (`#22d3ee`) for in-progress/active
  states, green (`#34d399`) for success/pass, amber for warnings, red for
  fail/errors.
- Gradients: only on hero/landing surfaces and skill-graph "mastered" glow —
  never on buttons or cards in the app shell.

## Typography

- Body/UI: the default Next.js font stack already wired by create-next-app
  (Geist Sans) — highly readable, not monospace.
- Code, terminal output, XP numbers, skill-level badges: Geist Mono. Used
  strategically (code blocks, stat numbers, editor) not globally.

## Motion (Framer Motion)

- Fast (150–200ms), ease-out, purposeful: page-section entrances, a small
  green pulse on successful run, a scale+fade on achievement unlock. No
  bounce/spring theatrics, no motion on things the user does repeatedly
  (e.g. don't animate every list item on every render).
- Respect `prefers-reduced-motion` — motion drops to opacity-only fades.

## Components

Built on shadcn/ui (Radix + Nova preset, neutral base) already scaffolded in
`src/components/ui`. App-specific composites live in `src/components/shell`
(sidebar/topbar/mobile nav) and `src/components/lesson` (the lesson block
primitives). Cards: subtle border, `rounded-xl`, no heavy shadow, slight
background lift on hover for interactive cards only.

## Themes

MVP ships Dark and Light (via `next-themes`, wired to the shadcn CSS
variables already generated). Additional named themes (OLED, Midnight,
Terminal, Cyber, Solarized-inspired) are a matter of adding more CSS
variable sets under `[data-theme="..."]` — architected for, not all five
implemented in MVP; tracked in ROADMAP.md. Editor theme (Monaco) is
selectable independently of app theme.

## Accessibility baseline

Every interactive control must be reachable by keyboard with a visible focus
ring (Radix primitives give this by default — don't override `outline: none`
without replacing it). Icon-only buttons get `aria-label`. Color is never the
only signal for pass/fail state — always paired with an icon/text.
