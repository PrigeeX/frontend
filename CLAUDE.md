# CLAUDE.md (local)

This file is gitignored. Personal / machine-local conventions only. Team conventions live in `AGENTS.md` (committed). If anything here conflicts with `AGENTS.md`, `AGENTS.md` wins.

## How to run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build, run before pushing
npm run lint
```

## What lives where

- **Design tokens:** `public/theme.css`. Do not duplicate tokens in `app/globals.css`. If you need a new token, add it to `theme.css`.
- **Compatibility aliases** (`--accent` → `--warm` etc.) and small layout helpers (`.row`, `.col`, `.gap-*`): `app/globals.css`.
- **Landing page sections:** `components/landing/`. The landing-only CSS is in `components/landing/landing.css`.
- **dApp pages:** `components/swap.tsx`, `components/stake.tsx`, `components/rewards.tsx`. These were migrated from the prior project at `/home/kaushal/prigeex/prigeex-app/` and rely on the alias variables in `globals.css` to render against the new palette.
- **Floating nav:** `components/Nav.tsx`. Used by both landing and dApp pages.

## When working on the landing

- Reach for the design-system primitives first: `.btn--primary`, `.btn--warm`, `.btn--ghost`, `.surface`, `.hairline-grid`, `.eyebrow`, `.pill`, `.sec-head`, `.bg-grid`, `.tel-val` + `.tel-label`, `.reveal`.
- Primary CTAs are `.btn--warm`. Secondary are `.btn--ghost`.
- Numeric callouts use `.tel-val` + `.tel-label` with `font-variant-numeric: tabular-nums`.
- Reach for `<Reveal>` (in `components/landing/Reveal.tsx`) for any scroll-faded section block.

## Hard rules to honor on every change

- No em dashes (U+2014) anywhere. Use `-`, `,`, parens, or a new sentence. Grep to verify: `grep -R "—" app components lib public/theme.css THEME.md AGENTS.md`.
- No "Phase 1" / "BETA" markers in landing eyebrows, gate stamps, or footer cells. Phase 1 / 2 / 3 are only valid as structural section labels inside the Flight Plan section.
- No fabricated TVL / volume / fees. Use `-` as a placeholder when data is not yet wired.
- Keep landing copy broad. Engineering pillars and phase cards describe qualities and outcomes, not implementation specifics (no fee tiers, no library names, no function names).

## Source map for migrated components

If you need to diff against the prior implementation, the originals live at:

- `components/wallet.tsx` ← `/home/kaushal/prigeex/prigeex-app/components/wallet.tsx`
- `components/toast.tsx` ← `/home/kaushal/prigeex/prigeex-app/components/toast.tsx`
- `components/icons.tsx` ← `/home/kaushal/prigeex/prigeex-app/components/icons.tsx`
- `components/swap.tsx` ← `/home/kaushal/prigeex/prigeex-app/components/swap.tsx`
- `components/stake.tsx` ← `/home/kaushal/prigeex/prigeex-app/components/stake.tsx`
- `components/rewards.tsx` ← `/home/kaushal/prigeex/prigeex-app/components/rewards.tsx`
- `lib/*.ts` ← `/home/kaushal/prigeex/prigeex-app/lib/*.ts`

The landing page is *not* migrated. It is implemented fresh from the Claude Design bundle that was extracted to `/tmp/prigeex-design/prigeex/`. The reference HTML lives at `/tmp/prigeex-design/prigeex/project/Landing.html` and the theme bundle README is at `/tmp/prigeex-design/prigeex/README.md`.

## Wagmi target

`lib/wagmi.ts` is wired to Sepolia testnet. The live contracts are:

- PGX: `0x828B8fAF6c38eB666dFA8c1F22b106ca1FCecf0c`
- Staking: `0xDD8A20b1ABbD84a52d02Dc623E756E880FB13b6b`

Mainnet flip will happen later; do not change the wagmi target without coordinating.

## When you change `theme.css`

`theme.css` is the source of truth across landing and dApp. Touch it carefully:

1. Open both the landing and `/swap`, `/stake`, `/rewards` in browser tabs.
2. Make the change.
3. Refresh all four; confirm nothing regressed.
4. Update `THEME.md` in the same commit if the change affects voice / palette / type / component vocabulary.
