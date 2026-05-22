# AGENTS.md

Repo-wide contributor instructions for the PrigeeX frontend. This file travels with the repository and is loaded by every AI coding assistant working in this codebase. Local-only personal rules go in `CLAUDE.md` (which is `.gitignore`d), not here.

## What this repo is

The PrigeeX frontend. Next.js 16 + React 19 + wagmi + viem. The landing page deploys to `prigeex.com`. The dApp routes (`/swap`, `/stake`, `/rewards`, `/perpetuals`) live in this same codebase, deploy target to be decided.

PrigeeX is positioned as an institutional venue for on-chain markets: liquidity, settlement, and tokenised real-world assets, engineered for capital arriving on-chain. Read `THEME.md` for the voice and design system before writing copy or components.

## Design system

The source of truth is `public/theme.css` (tokens + shared component classes) and `THEME.md` (voice and component spec). Apply it to every surface.

- Reach for `theme.css` primitives first: `.btn` + `.btn--primary` / `.btn--warm` / `.btn--ghost`, `.surface`, `.hairline-grid`, `.eyebrow`, `.pill`, `.sec-head` with `.sec-num` + `.sec-title`, `.bg-grid`, `.tel-val` + `.tel-label`, `.reveal`.
- The `--warm` accent is the only chromatic color. Greens and reds appear only as functional state (gain / loss, in-range / out-of-range, pass / fail), never decoratively.
- All financial numbers use `font-variant-numeric: tabular-nums` and Geist Mono.
- Primary actions on dApp surfaces are `.btn--warm`. Everything secondary is `.btn--ghost`. Never use the old `.btn-grad` (blue gradient).
- Headlines are Instrument Serif, italic for warm emphasis. Body is Geist. Telemetry / labels / addresses are Geist Mono.

The file `app/globals.css` provides aliases (`--accent` → `--warm`, `--text` → `--ink`, `.panel` → matte-2 surface) so the migrated dApp components from `prigeex-app` resolve correctly without per-line rewrites. Add a new alias to `globals.css` if you find a stray legacy reference, but do not duplicate tokens that already live in `theme.css`.

## Content rules for landing copy

- **Keep landing copy broad.** Do not list specific fee tiers, library names, function-parameter names, contract module names, or hyper-specific market segments. Engineering pillars describe qualities of the venue (institutional grade, precision, audited, transparent, open analytics). Phase cards describe what each phase delivers in one or two general lines. Implementation specifics live in documentation, not on the investor landing.
- **No Phase-1 markers.** No "Phase 1" / "BETA" / "MVP" eyebrows, stamps, or footer cells on the landing. Phase 1 / Phase 2 / Phase 3 are valid structural section labels *inside* the Flight Plan section only.
- **No fake telemetry.** Do not fabricate TVL, volume, fees, or APY figures. If the number is not real, leave the placeholder cell at `-` or omit the metric.
- **No DeFi tropes.** No emoji, no "WAGMI", no purple-to-pink gradients, no glowing 3D coins, no "Empower the future of finance".

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
- [ ] No fabricated metrics on the landing.
- [ ] Design-system primitives used where they apply (instead of inline styles or one-off CSS).
- [ ] Landing changes preserve the broad-copy rule above.

## Repository layout

```
app/              Next.js App Router routes
  page.tsx        Landing
  swap/           dApp swap page
  stake/          dApp stake page
  rewards/        dApp rewards page
  perpetuals/     coming-soon placeholder
  layout.tsx      imports /theme.css, mounts Providers
  providers.tsx   wagmi + react-query + toast + wallet
  globals.css     aliases, layout helpers, app-shell chrome
components/
  Nav.tsx         floating pill nav, shared by landing + dApp
  landing/        landing-only sections + landing.css
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
public/
  theme.css       design system, source of truth
  assets/         aviation video, other media
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

## What is NOT in scope here

- Smart contract source. Lives in the contracts repo.
- Subgraph definitions. Live in the subgraph repo.
- Marketing site outside `prigeex.com`.

If you find yourself wanting to add one of these, open a separate repo, not this one.
