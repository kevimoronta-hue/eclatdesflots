# Handoff : L'Éclat des Flots — page d'accueil

## Overview

Single-page marketing site for **L'Éclat des Flots**, a French company specialising in
renovation, surface treatment and anticorrosion work on river craft (barges, floating homes,
passenger boats, commercial vessels, pontoons). The page runs from a full-screen hero through
services, boat types, a process timeline, before/after case studies, a customer-review marquee,
a quote form, an FAQ and a footer. Copy is entirely in French and must be kept verbatim.

The design is a **conversion-oriented brochure page**: every section funnels toward the two
primary actions — *Demander un devis* (request a quote) and *Prendre rendez-vous* (book a call,
which opens a modal booking dialog).

## About the Design Files

The files in this bundle are **design references created in HTML**. They are prototypes that
show the intended look, motion and behaviour — **not production code to copy directly**.

`Accueil.dc.html` is authored for a design-prototyping runtime: markup lives in an `<x-dc>`
template with inline styles, and behaviour lives in a `class Component` block at the bottom of
the file. That structure is an artefact of the prototyping tool, **not an architecture to
reproduce**.

Your task is to **recreate these designs in the target codebase's existing environment**
(React/Next, Vue/Nuxt, Astro, Svelte, plain templates…) using its established component
patterns, styling solution and asset pipeline. If the project has no front end yet, pick the
framework best suited to a content-driven marketing page — a static-site generator or
Next.js/Astro is the natural fit, since the page is almost entirely static with a handful of
scroll and pointer interactions.

Two practical notes for the port:

- **Inline styles are a prototype constraint, not a design decision.** Move them into whatever
  the codebase uses (CSS modules, Tailwind, styled-components…). The token table below is the
  source of truth for values.
- **The `data-*` attributes are behaviour hooks** used by the prototype's script (`data-rail`,
  `data-ba`, `data-reveal`, `data-vc`…). In a component-based rewrite they become component
  boundaries, refs and props. They are useful as a map of "what is interactive"; keep the ones
  that genuinely help, drop the rest.

## Fidelity

**High fidelity.** Colours, typography, spacing, radii, shadows, easing curves and copy are
final and deliberate. Recreate the UI pixel-perfectly, then substitute the host codebase's own
primitives (buttons, inputs, cards) only where they already match this visual language.

Two caveats:

1. **Content is placeholder in two places.** The client logo band and some imagery use stand-in
   assets, flagged in *Assets* below.
2. **The 15 customer reviews and their portraits are fictional demo content**, generated for the
   prototype. See *Legal / content warnings*.

---

## Design Tokens

Declared as CSS custom properties on `:root`. **Do not introduce colours outside this set.**

### Colour

| Token | Value | Role |
| --- | --- | --- |
| `--color-bg` | `#FFFFFF` | Page ground; alternating sections |
| `--color-surface` | `#F6F8FA` | Alternate section ground (boat types, case studies, FAQ) |
| `--color-text` | `#072948` | All body and heading ink (deep navy, never pure black) |
| `--color-accent` | `#0B3A67` | Primary buttons, links, review stars, CTA band, contact pills |
| `--color-accent-600` | `#072948` | Hover / pressed on accent |
| `--color-accent-700` | `#061F37` | Link hover |
| `--color-divider` | `#DFE5EC` | All 1px rules and card borders |

Additional literals used in specific places:

| Value | Where |
| --- | --- |
| `#FCFDFE` | Review card ground (a hair off white) |
| `#16283C` | Review quote text |
| `#4C6072` | Review author name |
| `#7C8A99` | "Ils nous font confiance" eyebrow label |
| `#05080C` | Video player panel ground |
| `#000000` | Video letterbox bars |
| `#2E6DA8`, `#4E8FCB` | Player seekbar gradient (lighter steps of the accent) |
| `rgba(11,58,103,0.10)` | Nav link hover tint |
| `color-mix(in srgb, var(--color-text) 78%, transparent)` | Muted body copy |
| `color-mix(in srgb, var(--color-text) 45%, transparent)` | Service step numerals |

### Typography

**Geist** for everything, headings and body alike, with fallbacks
`'Helvetica Neue', Helvetica, Arial, sans-serif`. Headings 600, subheads 500, body 400.

Negative letter-spacing is applied per level and is important to the feel:

| Element | Size | Weight | Letter-spacing | Line-height |
| --- | --- | --- | --- | --- |
| `h1` (hero) | 54px | 600 | −0.032em | 1.04 |
| `h2` (section) | 36px (38–40px on process + CTA) | 600 | −0.024em | 1.12 |
| `h3` | 24px | 500 | −0.014em | 1.2 |
| Body / lead | 15–17px | 400 | −0.005em | 1.6–1.62 |
| Review quote | 16px (15px < 560px) | 400 | — | 1.55 |
| Nav links | 16px | 500 | −0.004em | — |
| Buttons | 15px | 500 | −0.002em | — |
| Eyebrow labels | 11px | — | 0.1em, uppercase | — |
| Stat captions / meta | 13px | 400 | — | — |

Numeric runs in the stat row use `font-variant-numeric: tabular-nums`.

### Spacing, radius, elevation

- Section padding: `96–120px` vertical, `64px` horizontal on desktop; `24px` horizontal below 860px.
- Radii: `999px` for every pill (buttons, nav, contact discs, avatars); `26px` mobile drawer;
  `18px` cards and the video panel; `14px` drawer links. **The FAQ and quote-form borders are square** (0).
- Shadows: nav `0 10px 40px rgba(7,41,72,0.08)`; review card `0 6px 22px rgba(7,41,72,0.05)`
  rising to `0 16px 40px rgba(7,41,72,0.12)` on hover; drawer `0 24px 64px rgba(7,41,72,0.20)`;
  modal `0 40px 120px rgba(7,25,43,0.45)`.
- Standard easing: `cubic-bezier(0.22, 1, 0.36, 1)` for anything that should feel sprung;
  plain `ease` at 170–320ms for tints and opacity.

### Breakpoints

`1320px`, `1000px`, `900px`, `860px`, `700px`, `560px`. Below 1000px the desktop nav links are
replaced by a burger + glass drawer. Below 860px multi-column sections stack and **all text
centres** (a deliberate mobile decision, not a fallback). Below 700px the video control bar drops
its volume group and total duration.

---

## Screens / Views

One page, twelve blocks in DOM order.

### 1. Navigation bar — sticky "liquid glass"

- `position: sticky; top: 16px`, `margin: 16px 32px 0`, `z-index: 30`.
- Three-column grid `1fr auto 1fr`: logo left, links centred, CTA + burger right.
- Fully rounded (`999px`). Background is a diagonal translucent gradient
  `linear-gradient(160deg, rgba(255,255,255,0.52), rgba(255,255,255,0.24) 46%, rgba(255,255,255,0.4))`,
  border `1px solid rgba(255,255,255,0.6)`, and a layered shadow that creates the glass bevel:
  `0 10px 40px rgba(7,41,72,0.08), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(7,41,72,0.06), inset 0 0 22px rgba(255,255,255,0.35)`.
- Backdrop: `blur(26px) saturate(190%) brightness(1.06)`.
- **On scroll past 24px** the gradient densifies (0.62/0.34/0.5), the outer shadow deepens to
  `0 14px 44px rgba(7,41,72,0.12)`, and vertical padding tightens by 2px. Transition 320ms ease.
- Links: 10px 18px, pill hover `rgba(11,58,103,0.10)` + ring + `0 6px 22px rgba(11,58,103,0.20)`,
  colour shifts to `#0B3A67`.
- Nav items: Services, Embarcations, Méthode, Réalisations, Contact. CTA: **Demander un devis**.
- Logo `assets/logo-nav.png`, 46px tall. **The nav logo and footer logo are aligned on the same
  horizontal axis (51px from the page edge)** — preserve this.

### 2. Mobile drawer

Appears below 1000px. `position: fixed; left/right: 16px; top: 84px`, radius 26px, background
`rgba(255,255,255,0.72)`, `blur(26px) saturate(180%)`, border `rgba(255,255,255,0.8)`.
Animates from `opacity: 0; translateY(-8px) scale(0.985)` with `transform-origin: top center`,
320ms/420ms on the sprung curve. Contains the five nav links plus *Questions fréquentes*,
*Contact*, and the primary CTA. Burger bars animate into a cross. `aria-expanded` on the button,
`aria-controls="menu-mobile"`.

### 3. Hero — pinned, with photographic ground

- `position: sticky; top: 0`, `height: 100vh; min-height: 720px`, inside a `data-pin-scope` wrapper.
  `margin-top: -88px; padding-top: 88px` so it slides under the floating nav.
- Background photo `assets/hero-cale-seche.png`, `object-fit: cover`, `object-position: 62% 60%`,
  `fetchpriority="high"`.
- Over it, a white top-down scrim for legibility:
  `linear-gradient(180deg, rgba(255,255,255,0.90) 0%, rgba(255,255,255,0.72) 38%, rgba(255,255,255,0.30) 68%, rgba(255,255,255,0.10) 100%)`.
- Content is **centred** (headline, lead, both buttons).
  - H1: "Un savoir-faire français au service de votre embarcation." — 54px, max-width 900px.
  - Lead: 17px, max-width 640px, 78% ink. Contains non-breaking spaces around the em dash —
    keep them.
  - Buttons: *Demander un devis* (primary), *Voir nos réalisations* (secondary).
- **Client logo band** sits at the bottom of the hero (`margin-top: auto`): eyebrow
  "Ils nous font confiance", then an infinite CSS marquee (`clients-slide`, 58s linear) of
  210×80px cells. Logos are `grayscale(1)` at `opacity: 0.68`; **hover restores full colour and
  pauses the track**. Edges fade via a horizontal mask
  (`transparent 0, #000 12%, #000 88%, transparent 100%`).

### 4. Video section — custom player over Wistia

The most intricate block. **Wistia is the playback engine; 100% of the visible UI is ours.**

- Wistia media id `o968et3qik`, a **9:16 vertical** video. Scripts:
  `fast.wistia.com/embed/medias/o968et3qik.jsonp` and `fast.wistia.com/assets/external/E-v1.js`.
- Initialised via `window._wq.push({ id, options, onReady })` with **all native UI disabled**:
  `videoFoam: false, fitStrategy: 'contain', playbar: false, playButton: false,
  smallPlayButton: false, fullscreenButton: false, volumeControl: false, settingsControl: false,
  controlsVisibleOnLoad: false, playsinline: true`. Options must go through `options`, not the
  legacy class-token syntax.
- Belt-and-braces on top of that: the embed host is `pointer-events: none`, and a DOM scan hides
  every node in the embed that is not an ancestor of the `<video>` element (class-name agnostic,
  re-run by a MutationObserver). **Without this a stray native play triangle reappears.**

**Geometry (critical).** The outer panel is animated by scroll; the video inside must stay
exactly 9:16 at all times.

- Panel: `width/height: 100%`, ground `#05080C`, radius 18px, `overflow: hidden`,
  `transform-origin: 50% 100%`, `backface-visibility: hidden`.
- **Scroll animation is a single transform** — `translate3d(0, Ypercent, 0) scale(s)` where the
  panel rises from `translateY(100%) scale(0.62)` to `translateY(0) scale(1)`. Earlier versions
  animated width/height and caused reflow, layout thrash and ratio jumps mid-flight. **Do not
  reintroduce animated dimensions.**
- Inside, a frame element is sized by JS: `w = min(containerWidth, containerHeight × 9/16)`,
  `h = w × 16/9`, measured with `clientWidth/clientHeight` (immune to the parent's `scale`) and
  recomputed on ResizeObserver, resize, orientationchange and fullscreen change. Remaining space
  is black. Never `object-fit: cover` on the video.
- **All player UI is a child of that 9:16 frame**, absolutely positioned — so the centre play
  button is centred on *the image*, not on the wider panel. (This was the single biggest bug in
  development: the button was a flex sibling of the frame and sat off to the right.)

**Controls.** Centre play button: 148px hit area (96px < 700px), 104px disc with
`linear-gradient(160deg, rgba(24,84,143,0.86), rgba(11,58,103,0.72))`, 1px light rim,
inset highlight, hover `scale(1.04)`, active `scale(0.97)`. Open-sided white triangle outline
(a stroked path, not a filled polygon), optically nudged 3px right.

Bottom bar is a single-layer glass strip: `linear-gradient(to top, rgba(7,41,72,0.74), rgba(7,41,72,0.42))`,
`blur(14px) saturate(1.25)`, 1px top rim `rgba(140,186,226,0.26)`, inset highlight. Contents:
play/pause, current time, seekbar, total duration, volume (icon + slider), fullscreen.
Seekbar progress is `linear-gradient(90deg, #0B3A67, #4E8FCB)` on a `rgba(214,231,245,0.28)`
track; the 11px white handle carries a 3px accent halo and grows to 13px on hover.

**Behaviour contract — the live Wistia instance is the only source of truth.**

- Every control re-reads `Wistia.api('o968et3qik')` at interaction time rather than holding a
  captured reference (a stale reference was the cause of "paused but audio keeps playing").
- Pause calls `pause()` on all active Wistia instances **and** on every `<video>` in the embed.
- An explicit **intent flag** (`playing`/`paused`) is set on user action. Wistia's `play` handler
  checks it and immediately re-pauses any playback the user did not ask for — this is what stops
  remounts, buffering retries and stray events from restarting the video.
- Loader (a 42px spinning ring in accent blue) shows **only** on real `waiting`, and hides on
  `play`/`playing`/`canplay`/`pause`/`end` and on any advancing `timechange`. Never on a timeout.
- `end` → progress pinned to 100%, centre button returns as a **replay** icon, bar persists.
- Duration and progress are only written once `duration > 0` (avoids a flashed "0:01" and NaN).
- Control bar auto-hides 2.6s into playback, returns on pointer move or tap, and stays visible
  while paused. When hidden it also gets `pointer-events: none` (otherwise phantom buttons).
- Fullscreen requests the **frame wrapper**, so it is the same instance and timestamp — no reset,
  our bar stays, video stays 9:16 with black sides.
- Keyboard on the player: Space/K play-pause, ←/→ ±5s, F fullscreen, M mute.
  Focus ring `2px solid #0B3A67`, offset 2px.
- **IntersectionObserver auto-pause**: below 30% visibility, a playing video pauses.
  Returning to view does **not** auto-play — state stays paused at the exact timestamp.
- Fallbacks: opaque `rgba(7,41,72,0.9)` bar where `backdrop-filter` is unsupported;
  blur reduced to 8px on touch devices.

### 5. Stat row

Four equal cells, `#F6F8FA` ground, 1px rules top/bottom and between cells, padding 32px 40px.
Each: an `h3` label plus a 13px muted caption.

| Label | Caption |
| --- | --- |
| Diagnostic | complet avant chiffrage |
| Cale sèche | ou intervention à flot |
| Équipe qualifiée | produits professionnels |
| Devis 72 h | détaillé poste par poste |

### 6. Services — "Trois interventions, un seul standard"

Two-column grid `340px 1fr`, gap 80px, padding `104px 64px`, white.
Right column is three rows separated by 1px top rules, each `44px 1fr` with a muted ordinal
(`01`, `02`, `03`) beside a 24px heading and 15px copy capped at 640px.
Row 02 also carries `.tag.tag-neutral` chips: Époxy, Polyuréthane, Antirouille (and further tags).

### 7. Boat types — "Nous intervenons sur tous types d'embarcations fluviales"

`#F6F8FA`, rules top and bottom, centred 36px heading capped at 760px, then a
`repeat(5, 1fr)` grid with 20px gaps. Collapses to a single column below 560px.

### 8. Process timeline — "Le déroulement d'un chantier"

Centred intro (max-width 720px), then a three-column grid `1fr 96px 1fr` with 56px row gaps,
max-width 1080px, cards alternating left and right of a central 2px rule (`--color-divider`).
A second absolutely-positioned 2px bar in `--color-accent` **fills downward as the section
scrolls** (height driven by scroll progress, `transition: height 240ms linear`).
Step titles turn `#0B3A67` on hover.
Below 900px the grid becomes `40px 1fr`, all cards move to column 2, and the rails shift to `left: 20px`.

### 9. Case studies — "Des chantiers que l'on peut regarder de près"

`#F6F8FA`. One large before/after comparator (≈557×440) above two smaller ones
(≈370×197, ratio 1.884 — this ratio matters, see *Assets*).

**Comparator mechanics.** Two stacked images fill the frame; the "after" layer is clipped with
`clip-path: inset(0 0 0 var(--p))` where `--p` is the handle position as a percentage. The
handle is draggable and **spring-loaded: it snaps to 0 / 50 / 100%**; double-click returns to 50%.
Handle hover deepens its shadow, active scales to 0.94.

Project titles (verbatim):
1. **Rénovation de coque — Yacht fluvial en acier** (23px title)
2. **Rénovation du revêtement de pont** (18px)
3. **Rénovation de la « Libellule »** (18px)

### 10. Reviews — "La satisfaction comme mot d'ordre"

Centred intro, then **two independent horizontal rails**: 8 cards drifting left, 7 drifting right.
Each rail's card list is **duplicated once** in the DOM to make the loop seamless.

**Card**: 348px wide (306px < 900px, 268px < 560px), padding `26px 28px 24px`, ground `#FCFDFE`,
1px divider border, radius 18px, shadow `0 6px 22px rgba(7,41,72,0.05)`. Vertical stack, gap 14px:

1. The quote, 16px/1.55, `#16283C`, wrapped in French guillemets, `text-wrap: pretty`
2. Five 13px stars filled with `var(--color-accent)`, in a flex row with 5px gaps,
   `role="img" aria-label="5 étoiles sur 5"`
3. Caption row: 30px circular portrait (`object-fit: cover`, `loading="lazy"`, explicit
   width/height, `alt=""` + `aria-hidden` since the name follows in text) then the name at
   13px `#4C6072`

Hover: `translateY(-3px)` and shadow to `0 16px 40px rgba(7,41,72,0.12)`, 260ms.

**Rail engine** — hand-rolled, no carousel library:

- One `requestAnimationFrame` loop per rail writing `translate3d(x, 0, 0)`. No state updates
  per frame, no re-render.
- Auto speed 32px/s, direction per rail.
- `x` is normalised every frame against the loop period. **The period must be derived from
  geometry** — `cards[n].offsetLeft − cards[0].offsetLeft` where `n` is half the card count —
  *not* `scrollWidth / 2`, which omits half a flex gap and produces a visible 10px jump each cycle.
  Recompute on ResizeObserver so breakpoint changes are handled.
- Hover (mouse only) eases the rail to a stop via a factor lerped toward 0 at ~4.5/s; leaving
  eases it back to 1. **No jump, no reset** — it resumes from its current position.
- Pointer drag moves the track 1:1 with the pointer. Release applies **inertia** (velocity
  captured from the last move, decayed exponentially) that blends back into the auto drift.
  Cursor `grab` → `grabbing`; text selection disabled; a click that followed a drag is suppressed
  in the capture phase.
- **Axis detection**: on the first 6px of movement, if the gesture is more vertical than
  horizontal the rail lets go and the page scrolls normally. `touch-action: pan-y`.
- `setPointerCapture` plus window-level `pointerup`/`pointercancel` so a release **outside** the
  rail still ends the drag (otherwise the rail freezes permanently).
- The two rails are fully independent — pausing one leaves the other running.

### 11. Quote section — "Quelques photos suffisent pour commencer"

Two columns `1fr 1fr`, gap 72px, padding `104px 64px`.

Left: 36px heading, 16px lead capped at 480px, then three 46px accent-filled circular contact
pills with white glyphs — phone (`tel:+33184000000`), e-mail
(`mailto:contact@eclatdesflots.fr`), LinkedIn (`https://www.linkedin.com/`, `target="_blank" rel="noopener"`).
**All three URLs are placeholders awaiting the real ones.**

Right: a square-cornered 1px-bordered panel, padding 36px, gap 16px:
Nom + Téléphone side by side, then Type d'embarcation, then a Besoin textarea (min-height 110px),
then a full-width primary submit **Envoyer la demande**. Inputs are white with `min-height: 44px`.
**The form is not wired to a backend** — needs an endpoint, validation and success/error states.

### 12. FAQ, CTA band, booking modal, footer

- **FAQ**: `#F6F8FA`, grid `360px 1fr`, native `<details>/<summary>` rows on 1px rules, 22px
  vertical padding, a −/+ glyph on the right. First item open by default. Five questions.
- **CTA band**: full-bleed `var(--color-accent)`, 88px vertical padding, centred white 40px
  heading, and two pills — white-on-accent primary and an outlined `rgba(255,255,255,0.5)` ghost.
- **Booking modal** (`data-cal-overlay`): fixed, `z-index: 100`, backdrop `rgba(7,25,43,0.62)`
  + `blur(10px)`. Dialog `min(1080px, 100%) × min(760px, 100%)`, grid `340px 1fr`, navy
  `#072948` info rail beside the scheduling pane, entering from `translateY(18px) scale(0.985)`.
  `role="dialog" aria-modal="true"`. Opened by any `[data-cal-open]` trigger.
  **Needs wiring to a real scheduling provider.**
- **Footer**: `#072948`, padding `76px 51px 32px`, grid `1.6fr 1fr 1fr 1fr` — logo (58px) plus
  three link columns. Below 860px: logo left-aligned, columns stacked, text centred.

---

## Interactions & Behaviour

Summary of everything scripted, so nothing is missed in the port:

| Behaviour | Trigger | Notes |
| --- | --- | --- |
| Nav densify | scroll > 24px | background, shadow, padding |
| Burger drawer | click | fade + slide + scale, sprung curve |
| Hero pin | scroll | sticky; video panel rises over it |
| Video panel rise | scroll progress | **one** `translate3d + scale` |
| Client marquee | always | CSS animation; pause + decolour on hover |
| Reveal on enter | IntersectionObserver | `[data-reveal]` elements fade/rise once |
| Timeline fill | scroll progress | accent bar height |
| Before/after drag | pointer | snaps to 0/50/100; dblclick → 50 |
| Review rails | rAF | hover stop, drag, inertia, seamless loop |
| Player | see §4 | Wistia is the single source of truth |
| Auto-pause video | IntersectionObserver < 30% | never auto-plays on return |
| FAQ | native `<details>` | no JS needed |
| Booking modal | `[data-cal-open]` | focus trap + Escape to close still to add |

**Accessibility to carry over**: `aria-expanded`/`aria-controls` on the burger, `role="dialog"`
+ `aria-modal` on the modal, `aria-label` on every icon-only control, `role="img"` with a text
label on the star groups, `alt=""` + `aria-hidden` on decorative avatars, and a themed
`:focus-visible` ring (`2px solid #0B3A67`, offset 2px) — never the browser default.
Hit targets stay ≥ 44px.

**Reduced motion** is not yet handled — please add `prefers-reduced-motion` guards that stop the
marquees, rail drift and panel rise.

## State Management

Deliberately minimal; nothing needs a global store.

- **Nav**: `scrolledPast` boolean.
- **Drawer**: `open` boolean.
- **Scroll progress**: hero pin, video panel transform, timeline fill — all derived from
  scroll position, ideally one shared rAF-throttled listener rather than three.
- **Each comparator**: `handlePercent` (0–100) + `dragging`.
- **Each rail**: `x`, `velocity`, `speedFactor`, `dragging`, `axis`, `period` — local, mutable,
  and **must live outside React state** (they update every frame; setState here would be a
  performance bug).
- **Player**: `intent` ('playing' | 'paused'), `started`, `isPlaying`, `currentTime`,
  `duration`, `volume`, `buffering`, `fullscreen`, `barVisible`. Every one of these is a
  *reflection* of a Wistia event, never an independent claim about playback.
- **Modal**: `open`.
- **Quote form**: field values, validation errors, submit state — to be built.

## Assets

All in `assets/`, copied into this bundle.

| File(s) | Notes |
| --- | --- |
| `logo-nav.png`, `logo-footer.png` | Brand marks. Nav 46px, footer 58px tall |
| `hero-cale-seche.png` | Hero photograph |
| `bretagne-coque-avant-43.png`, `bretagne-coque-apres-43.png` | Case study 1, recropped to a **matched 4:3** so both sides share one focal length and the waterline registers across the wipe. Originals `bretagne-coque-avant.jpg` / `-apres.jpg` kept alongside |
| `pont-revetement-avant-w.png`, `-apres-w.png` | Case study 2, cropped to **16:9** to match the card frame with no distortion. Originals kept |
| `libellule-avant-w.png`, `-apres-w.png` | Case study 3, same treatment |
| `avis-*.jpg` (15 files) | Review portraits, 72px JPEG (2.4× the 30px display size for retina) |
| `clients/paris-seine.svg`, `clients/cemex.png`, `clients/bateaux-parisiens.png` | **Placeholder client logos** — replace with real, cleared brand assets before launch. One band slot is a text lockup ("Société Navale Seine & Oise") standing in for a missing logo |

**Before/after cropping rule** — when new case-study photos are supplied: crop both images to the
card's aspect ratio (**16:9** for the small cards, matched 4:3 for the large one) at the **same
focal length**, then use `object-fit: cover`. Mismatched source ratios were the cause of a
"two different boats" effect; forcing them with `object-fit: fill` distorted the hull.

Fonts: **Geist** must be self-hosted or loaded from a webfont service in the target project.
Icons follow **Lucide** geometry; use the real Lucide package rather than the inlined SVG paths.

## Legal / content warnings

- **The 15 reviews and the 15 portraits are fictional demo content.** The portraits are
  AI-generated; the people do not exist. The section deliberately carries **no** "verified
  review", Google, Trustpilot or third-party certification badge, and none must be added while
  the content is fictional. Replace with real, consented testimonials before launch.
- Client logos in the trust band are placeholders and are **not** cleared for use.
- Phone number, e-mail address and LinkedIn URL are placeholders.

## Running this bundle

The bundle is **static HTML — there is no build step and no dependencies to install.**

```
unzip …
cd design_handoff_eclat_des_flots_homepage
open index.html          # or: npm start  (serves on http://localhost:5173)
```

`index.html` simply forwards to `Accueil.dc.html`, which is the design reference itself.
`npm start` runs `npx serve` — useful because a few things (the Wistia embed, font loading)
behave more like production over `http://` than over `file://`.

**No environment variables are required** to view the reference, and the bundle contains no
secrets. `.env.example` documents the variables the *production rebuild* will need once the
quote form and booking modal are wired up. The Wistia media id (`o968et3qik`) is public by
design and safe to commit.

**Deliberately external** (do not vendor these locally):

| Resource | Why |
| --- | --- |
| `fast.wistia.com/embed/medias/o968et3qik.jsonp` + `E-v1.js` | Wistia is the video engine; the media is hosted there |
| `fonts.googleapis.com` / `fonts.gstatic.com` (Geist) | Webfont delivery. Self-host in production if you prefer |

Every other reference in the page is local and included in this bundle.

## Files

| File | What it is |
| --- | --- |
| `Accueil.dc.html` | The full homepage design reference (markup + inline styles + behaviour) |
| `assets/` | Every image, logo and portrait referenced above |
| `_ds/modernist-*/styles.css` | Token sheet and component layer the page links (`.btn`, `.card`, `.tag`, `.field`, `.input`) |
| `image-slot.js` | Prototype-only drag-and-drop image placeholder. Needed to open the reference; **do not port** |
| `support.js` | Prototype runtime. Needed to open the reference; **do not port** |
| `index.html` | Convenience entry point that forwards to `Accueil.dc.html` |
| `package.json` | Static-preview script only — no dependencies, no build |
| `.env.example` | Variables the production rebuild will need. No secrets |
| `.gitignore` | Standard ignores for the GitHub repo |
| `assets/originals/` | Uncropped source photographs for the "Libellule" case study, kept so the 16:9 crops can be redone |

### Reading `Accueil.dc.html`

- Global CSS (tokens, keyframes, breakpoint overrides, hover states) sits in the `<helmet><style>`
  block at the top — **read this first**, it holds everything the inline styles do not.
- Section markup follows in DOM order, matching the twelve blocks above.
- The `class Component` block at the bottom holds all behaviour: scroll handler, reveal observer,
  comparators, review rails, then the video player (the largest part).

## Suggested build order

1. Tokens, fonts, layout scaffold, section rhythm and the 1px rule system.
2. Static sections: stats, services, boat types, FAQ, CTA, footer.
3. Nav + drawer, including the scroll state.
4. Hero with its pin and the client marquee.
5. Before/after comparators.
6. Review rails (get the seamless-loop period right from the start).
7. The video player last — it is the highest-risk piece; treat the behaviour contract in §4 as
   a test checklist.
8. Wire the quote form and the booking modal to real services.
