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

- **Design tokens:** `public/theme.css`. Do not duplicate tokens in `app/globals.css`. If you need a new token, add it to `theme.css`. This file is duplicated by hand into the `prigeex-web` repo (marketing site) - port token/shared-component changes there too.
- **Compatibility aliases** (`--accent` → `--warm` etc.) and small layout helpers (`.row`, `.col`, `.gap-*`): `app/globals.css`.
- **dApp pages:** `components/swap.tsx`, `components/stake.tsx`, `components/rewards.tsx`. These were migrated from the prior project at `/home/kaushal/prigeex/prigeex-app/` and rely on the alias variables in `globals.css` to render against the new palette.
- **Floating nav:** `components/Nav.tsx`. The brand link points out to `prigeex.com` (the marketing site repo); every other link is a local dApp route.
- **Marketing/landing page:** lives in the separate `prigeex-web` repo, not here.

## Hard rules to honor on every change

- No em dashes (U+2014) anywhere. Use `-`, `,`, parens, or a new sentence. Grep to verify: `grep -R "—" app components lib public/theme.css THEME.md AGENTS.md`.

## Source map for migrated components

If you need to diff against the prior implementation, the originals live at:

- `components/wallet.tsx` ← `/home/kaushal/prigeex/prigeex-app/components/wallet.tsx`
- `components/toast.tsx` ← `/home/kaushal/prigeex/prigeex-app/components/toast.tsx`
- `components/icons.tsx` ← `/home/kaushal/prigeex/prigeex-app/components/icons.tsx`
- `components/swap.tsx` ← `/home/kaushal/prigeex/prigeex-app/components/swap.tsx`
- `components/stake.tsx` ← `/home/kaushal/prigeex/prigeex-app/components/stake.tsx`
- `components/rewards.tsx` ← `/home/kaushal/prigeex/prigeex-app/components/rewards.tsx`
- `lib/*.ts` ← `/home/kaushal/prigeex/prigeex-app/lib/*.ts`

## Wagmi target

`lib/wagmi.ts` is wired to Sepolia testnet. The live contracts are:

- PGX: `0x828B8fAF6c38eB666dFA8c1F22b106ca1FCecf0c`
- Staking: `0xDD8A20b1ABbD84a52d02Dc623E756E880FB13b6b`

Mainnet flip will happen later; do not change the wagmi target without coordinating.

## When you change `theme.css`

`theme.css` is the source of truth for this repo's dApp surfaces, and is duplicated by hand into `prigeex-web`. Touch it carefully:

1. Open `/swap`, `/stake`, `/rewards` in browser tabs.
2. Make the change.
3. Refresh all three; confirm nothing regressed.
4. Update `THEME.md` in the same commit if the change affects voice / palette / type / component vocabulary.
5. Port the same change to `public/theme.css` in the `prigeex-web` repo so the two stay visually aligned.
