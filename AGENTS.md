# AGENTS.md

Repo-wide contributor instructions for the PrigeeX frontend. This file travels with the repository and is loaded by every AI coding assistant working in this codebase. Local-only personal rules go in `CLAUDE.md` (which is `.gitignore`d), not here.

## What this repo is

The PrigeeX dApp. Next.js 16 + React 19 + wagmi + viem. Deploys to `app.prigeex.com`. `/` redirects to `/swap` - there is no marketing page here.

The landing page lives in a separate repo, `PrigeeX/prigeex-web`, deployed at `prigeex.com`. The nav brand link in this repo points out to it (`lib/web-url.ts`, `NEXT_PUBLIC_WEB_URL`).

PrigeeX is positioned as an institutional venue for on-chain markets: liquidity, settlement, and tokenised real-world assets, engineered for capital arriving on-chain. Read `THEME.md` for the voice and design system before writing copy or components.

## Design system

The source of truth is `public/theme.css` (tokens + shared component classes) and `THEME.md` (voice and component spec). Apply it to every surface.

- Reach for `theme.css` primitives first: `.btn` + `.btn--primary` / `.btn--warm` / `.btn--ghost`, `.surface`, `.hairline-grid`, `.eyebrow`, `.pill`, `.sec-head` with `.sec-num` + `.sec-title`, `.bg-grid`, `.tel-val` + `.tel-label`, `.reveal`.
- The `--warm` accent is the only chromatic color. Greens and reds appear only as functional state (gain / loss, in-range / out-of-range, pass / fail), never decoratively.
- All financial numbers use `font-variant-numeric: tabular-nums` and Geist Mono.
- Primary actions on dApp surfaces are `.btn--warm`. Everything secondary is `.btn--ghost`. Never use the old `.btn-grad` (blue gradient).
- Headlines are Instrument Serif, italic for warm emphasis. Body is Geist. Telemetry / labels / addresses are Geist Mono.

The file `app/globals.css` provides aliases (`--accent` → `--warm`, `--text` → `--ink`, `.panel` → matte-2 surface) so the migrated dApp components from `prigeex-app` resolve correctly without per-line rewrites. Add a new alias to `globals.css` if you find a stray legacy reference, but do not duplicate tokens that already live in `theme.css`.

## Style rule that applies everywhere

**No em dashes (U+2014) anywhere.** Not in code, comments, strings, markdown, copy, or commit messages. Use a hyphen (`-`), comma, parentheses, or a new sentence instead. The rule applies to JSX text and `string` literals just as much as to prose.

Verify locally before pushing:

```bash
grep -R "—" app components lib public/theme.css THEME.md AGENTS.md
```

The grep should return nothing.

## Pre-push contributor checklist

For every pull request:

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes with zero warnings.
- [ ] `grep -R "—"` returns nothing in `app/`, `components/`, `lib/`, `public/theme.css`, and the markdown files.
- [ ] Design-system primitives used where they apply (instead of inline styles or one-off CSS).

## Repository layout

```
app/              Next.js App Router routes
  page.tsx        redirects "/" to "/swap"
  swap/           dApp swap page
  stake/          dApp stake page
  rewards/        dApp rewards page
  perpetuals/     coming-soon placeholder
  layout.tsx      imports /theme.css, mounts Providers
  providers.tsx   wagmi + react-query + toast + wallet
  globals.css     aliases, layout helpers, app-shell chrome
components/
  Nav.tsx         floating pill nav - brand link points out to prigeex.com
  wallet.tsx      wagmi-driven connect modal
  toast.tsx
  icons.tsx
  swap.tsx        dApp swap component, migrated from prigeex-app
  stake.tsx       dApp stake component, migrated from prigeex-app
  rewards.tsx     dApp rewards component, migrated from prigeex-app
lib/
  wagmi.ts        Sepolia config + connectors
  contracts.ts    PGX + Staking addresses + ABIs
  tokens.ts       supported token list
  format.ts       number / address formatters
  docs.ts         doc link builder, defaults to docs.prigeex.com
  web-url.ts      marketing-site link builder, defaults to prigeex.com
public/
  theme.css       design system, source of truth (kept in sync with prigeex-web by hand)
  brand/          PrigeeX logo SVGs
THEME.md          design-system spec (voice, color, type, components)
AGENTS.md         this file
CLAUDE.md         local-only, not committed
```

## Local dev

```bash
npm install
npm run dev    # http://localhost:3000
npm run build
```

Required env vars (see `.env.example`):

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (WalletConnect Cloud project id)
- `NEXT_PUBLIC_SEPOLIA_RPC_URL` (optional custom RPC; public fallbacks are wired)

Optional env vars:

- `NEXT_PUBLIC_DOCS_URL` (defaults to `https://docs.prigeex.com`)
- `NEXT_PUBLIC_WEB_URL` (defaults to `https://prigeex.com`)

## What is NOT in scope here

- The marketing/landing page. Lives in `PrigeeX/prigeex-web`, deployed at `prigeex.com`.
- Smart contract source. Lives in the contracts repo.
- Subgraph definitions. Live in the subgraph repo.

If you find yourself wanting to add one of these, open the relevant repo, not this one.
