# PrigeeX Theme

> **Institutional aviation-fintech. Calm cockpit, not casino floor.**

Theme lives in `theme.css` (CSS tokens + shared components). Apply it to **every** PrigeeX surface , landing, swap, LP, stake, analytics, settings , via:

```html
<link rel="stylesheet" href="theme.css" />
```

The goal is one coherent venue. Anything outside this system needs justification.

---

## Voice

- **Capital-markets gravitas.** Restraint over excitement. We do not hype, we report.
- **Aviation lexicon as structure, not costume.** *Apogee, altitude, flight plan, ascent, cruise, boarding, heading, telemetry, runway.* Used to organize sections and label state , never to decorate.
- **Numbers are the loudest signal.** Show TVL, fees distributed, depth, latency in plain mono before you show copy.
- **No DeFi tropes.** No emoji, no "WAGMI," no purple→pink gradient, no glowing 3D coin, no "Empower the future of finance."

---

## Color

| Token | Hex | Use |
|---|---|---|
| `--matte` | `#06070a` | Page bg, dark sections |
| `--matte-2` | `#0c0d12` | Cards, surfaces |
| `--matte-3` | `#11131a` | Surface hover |
| `--paper` | `#efe9dd` | Contrast / manifest section |
| `--paper-ink` | `#1c1a14` | Text on paper |
| `--ink` | `#f3efe6` | Primary text |
| `--ink-soft` | 66% | Body / secondary |
| `--ink-dim` | 40% | Labels / tertiary |
| `--hairline` | 14% | 1px gridlines, dividers |
| `--hairline-strong` | 22% | Pill borders, card edges |
| `--warm` | `#e8c089` | **The accent.** Section labels, numerals, italic emphasis, warm CTAs |
| `--warm-soft` | 18% | Warm hairlines & halos |
| `--warm-hot` | `#f0d4a2` | Hover state for warm CTAs |
| `--good` / `--warn` / `--bad` | semantic | State only |

**Rule:** color is rationed. Warm is the only chromatic accent. Greens / reds appear only as **functional state** (gain / loss, in-range / out-of-range, pass / fail). Never decorative.

---

## Typography

| Family | Use |
|---|---|
| **Instrument Serif** | Display headlines, large numerals (TVL, prices, big balances) |
| **Geist** | Body, UI, buttons |
| **Geist Mono** | Telemetry, eyebrows, labels, section numbers, timestamps, addresses, % changes |

Guidelines:
- Headlines: Instrument Serif 400, italic for warm emphasis.
- Body: Geist 300–400, soft ink (66% opacity).
- Mono labels: 10.5–11px, `letter-spacing: .18em`, `text-transform: uppercase`.
- All financial numbers: `font-variant-numeric: tabular-nums`.

---

## Components in `theme.css`

| Class | Purpose |
|---|---|
| `.btn` + `.btn--primary` / `.btn--ghost` / `.btn--warm` | Pill buttons. Primary for default, warm for high-conviction CTAs (Launch App, Confirm Swap), ghost for secondary. |
| `.eyebrow` | Status pill above headlines. Add `.pulse` dot for live signals. |
| `.pill` | Generic mono status badge , use for network, version, address, latency. |
| `.nav-pill` | Floating glass nav chassis. |
| `.sec-head` (with `.sec-num` + `.sec-title`) | Section header , 140px mono number column + serif title. |
| `.hairline-grid` | Multi-column grid of cards joined by 1px hairlines. Used for phases, pillars, swap-route cards, position rows. |
| `.surface` | Single dark card. |
| `.bg-grid` / `.bg-grid--fine` | Warm-tinted instrumentation grid backdrop. Use on flat dark sections to add depth. |
| `.divider-warm` / `.divider-hairline` | Section separators. |
| `.reveal` | Scroll-fade primitive , add `.in` via IntersectionObserver. |
| `.tel-val` + `.tel-label` | Numeric readout cell. |

---

## Motion

- **Reveals:** 0.8s fade + 14px translateY, triggered on scroll via IntersectionObserver.
- **Pulse:** 2.4s, used **sparingly** , only on live-state indicators (online, in-flight, indexing).
- **Hover:** 0.18s ease, max 1px translateY lift on buttons.
- **No autoplay carousels, no spinning logos, no parallax for parallax's sake.**

---

## Layout

- Max container: **1240px**, 32px gutters.
- Section vertical padding: **140px top / bottom** by default; 160–180px for hero and final-CTA.
- Cards joined by 1px hairline gaps (use `.hairline-grid`) , never gap with empty whitespace.

---

## Application to app surfaces

When building the app (Swap, LP, Stake, Analytics):

1. **Same nav.** Reuse `.nav-pill` chassis , same pill, same brand, just different active links.
2. **No video bg in-app.** Reserve the halftone hero for the landing. App pages sit on flat `--matte` with `.bg-grid` for texture.
3. **Swap card:** `.surface` + 32px padding. Token rows are big Instrument Serif amounts + Geist Mono ticker.
4. **Numeric readouts** (TVL, balances, APY, fees): always `.tel-val` / `.tel-label`. Tabular-nums or it didn't ship.
5. **Primary action (Confirm Swap, Provide Liquidity, Stake):** `.btn--warm`. Everything else `.btn--ghost`.
6. **Charts:** warm accent for primary line, `--ink-soft` for axes/grid, `--good` / `--bad` only for delta states.
7. **In-range / out-of-range** LP positions: warm dot in range, `--ink-dim` dot out of range. Never green/red here , those are reserved for P&L.
8. **Empty states:** mono caption + small instrumentation glyph (no illustrated empty states with characters).

---

## What this theme is NOT

- Not a Tailwind. CSS variables and a small set of utility classes only.
- Not a place for decorative gradients, glassmorphism stunts, or 3D illustration.
- Not a sandbox for novel typography. Three families. Hold the line.
