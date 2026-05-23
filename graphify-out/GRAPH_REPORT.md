# Graph Report - .  (2026-05-23)

## Corpus Check
- Corpus is ~16,185 words - fits in a single context window. You may not need a graph.

## Summary
- 201 nodes · 344 edges · 16 communities (10 shown, 6 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.82)
- Token cost: 29,500 input · 6,400 output

## Community Hubs (Navigation)
- [[_COMMUNITY_dApp UI Components|dApp UI Components]]
- [[_COMMUNITY_App Shell and Routing|App Shell and Routing]]
- [[_COMMUNITY_Landing Page Sections|Landing Page Sections]]
- [[_COMMUNITY_NPM Runtime Dependencies|NPM Runtime Dependencies]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_dApp Navigation and Pages|dApp Navigation and Pages]]
- [[_COMMUNITY_Staking and Rewards UI|Staking and Rewards UI]]
- [[_COMMUNITY_Dev and Build Tooling|Dev and Build Tooling]]
- [[_COMMUNITY_Brand Identity Assets|Brand Identity Assets]]
- [[_COMMUNITY_Project Config Files|Project Config Files]]
- [[_COMMUNITY_Claude Settings|Claude Settings]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Generic UI Icons|Generic UI Icons]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `Icon` - 16 edges
3. `StakePage()` - 14 edges
4. `RewardsPage()` - 13 edges
5. `SwapPage()` - 13 edges
6. `fmtNum()` - 13 edges
7. `useToast()` - 10 edges
8. `TokenIcon()` - 9 edges
9. `useWallet()` - 8 edges
10. `WalletProvider()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Home()` --semantically_similar_to--> `Manifest()`  [INFERRED] [semantically similar]
  app/page.tsx → components/landing/Manifest.tsx
- `Swap page` --references--> `Design system (theme.css)`  [INFERRED]
  app/swap/page.tsx → THEME.md
- `Broad landing copy rule` --rationale_for--> `Manifest()`  [INFERRED]
  AGENTS.md → components/landing/Manifest.tsx
- `Broad landing copy rule` --rationale_for--> `Engineering()`  [INFERRED]
  AGENTS.md → components/landing/Engineering.tsx
- `Perpetuals page` --references--> `Institutional venue positioning`  [INFERRED]
  app/perpetuals/page.tsx → AGENTS.md

## Hyperedges (group relationships)
- **dApp page trio: Swap, Stake, Rewards share useWallet + useToast + Icon pattern** — components_swap_swappage, components_stake_stakepage, components_rewards_rewardspage, components_wallet_usewallet, components_toast_usetoast [EXTRACTED 1.00]
- **Landing page composition: Landing assembles Nav, Hero, FlightPlan, Boarding, Footer via RulerTick dividers** — landing_landing_landing, components_nav_nav, landing_hero_hero, landing_flightplan_flightplan, landing_boarding_boarding, landing_footer_footer, landing_rulertick_rulertick [EXTRACTED 1.00]
- **App-level context provider stack: ToastProvider wraps WalletProvider which wraps page components** — components_toast_toastprovider, components_wallet_walletprovider, concept_context_provider_pattern [INFERRED 0.85]
- **dApp pages share Nav + app-shell layout pattern** — app_swap_page_swap, app_stake_page_stake, app_rewards_page_rewards, app_perpetuals_page_perpetuals [EXTRACTED 0.95]
- **Wagmi config, provider stack, and contracts together enable on-chain interactions** — lib_wagmi_wagmiconfig, app_providers_providers, lib_contracts_pgx_address [INFERRED 0.85]
- **AGENTS.md, THEME.md, and CLAUDE.md together define the contributor rule set for design and copy** — agents_md_agentsmd, theme_md_thememd, claude_md_claudemd [EXTRACTED 0.95]
- **PrigeeX brand identity system - all SVG and raster assets sharing the signature crossing-X motif, deep navy palette (#0B2A6B/#03102E), and brand blue (#1670E8), forming a coherent multi-format brand system covering favicon, inline mark, square logo, solid mark, wordmark lockup, and PNG export.** — brand_prigeex_favicon, brand_prigeex_logo, brand_prigeex_mark_solid, brand_prigeex_x_inline, brand_prigeex_wordmark, public_prigeex_logo, public_image [INFERRED 0.95]

## Communities (16 total, 6 thin omitted)

### Community 0 - "dApp UI Components"
Cohesion: 0.11
Nodes (39): Icon, IconProps, TokenGlyph(), TokenIcon(), EarningsChart(), ILLUSTRATIVE_STREAMS, IllustrativeStream, REWARD_HISTORY (+31 more)

### Community 1 - "App Shell and Routing"
Cohesion: 0.10
Nodes (20): metadata, RootLayout(), viewport, Perpetuals page, Providers(), Swap page, Brand prompt (prompt.md), App shell (layout wrapper) (+12 more)

### Community 2 - "Landing Page Sections"
Cohesion: 0.17
Nodes (15): Home(), Broad landing copy rule, Scroll-triggered Reveal pattern (IntersectionObserver), Boarding(), Engineering(), PILLARS, FlightPlan(), Phase (+7 more)

### Community 3 - "NPM Runtime Dependencies"
Cohesion: 0.10
Nodes (20): dependencies, next, @rainbow-me/rainbowkit, react, react-dom, @tanstack/react-query, viem, wagmi (+12 more)

### Community 4 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 5 - "dApp Navigation and Pages"
Cohesion: 0.16
Nodes (7): LINKS, Nav(), NavLink, metadata, metadata, metadata, metadata

### Community 6 - "Staking and Rewards UI"
Cohesion: 0.22
Nodes (12): Rewards page, Stake page, EmissionsChart(), InlineStat(), Mode, SummaryCard(), PGX Token, Staking Contract (+4 more)

### Community 7 - "Dev and Build Tooling"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 8 - "Brand Identity Assets"
Cohesion: 0.38
Nodes (7): PrigeeX favicon SVG (256x256, viewBox 120x120) - compact version of the X-mark logo optimized for small sizes: rounded-rectangle with navy gradient background, two crossing diagonal bands in blue gradients, and a single highlight edge stroke. Used as the browser tab favicon and small-format icon., PrigeeX primary logo SVG (1024x1024, viewBox 120x120) - the full-resolution brand mark with rounded rectangle, deep navy-to-black gradient fill, radial blue glow, and the signature crossing-X diagonal band motif with multi-stop blue gradients and edge highlight paths. Canonical high-resolution logo for use in marketing, press kits, and large-format display., PrigeeX solid mark SVG (1024x1024, viewBox 120x120) - simplified flat variant of the logo mark: rounded rectangle filled with a single flat navy (#071D49), and two crossing diagonal X bands in flat blue (#1670E8) with slight opacity variation. Used where gradients are not appropriate (e.g. single-color print, embossing, dark monochrome contexts)., PrigeeX wordmark SVG (1200x240, viewBox 600x120) - horizontal lockup combining the square X-mark logo (left) with the full brand name 'PrigeeX' as bold text (font-weight 800, Inter/Manrope, letter-spacing -2.5) in near-white (#F4F6F5) with the 'X' character accent-colored in brand blue (#1670E8). Used for horizontal header placements, marketing banners, and contexts requiring the full brand name alongside the mark., PrigeeX inline X mark SVG (120x120) - the full-gradient logo mark at a compact square size, sharing identical gradient vocabulary (navy background, radial glow, multi-stop blue X bands, edge highlights) with the primary logo. Intended for inline use within UI contexts such as nav bars, headers, or embedded brand stamps., PrigeeX brand mark as a rasterized PNG - shows the characteristic crossing-X diagonal band motif on a dark navy rounded-rectangle background, rendered in blue gradients. This is the PNG export/fallback of the PrigeeX logo mark, used where SVG is not appropriate (e.g. social previews, app manifests, or legacy contexts)., PrigeeX app icon / logo mark (512x512, viewBox 120x120) - rounded-rectangle container with deep navy-to-near-black gradient background (#0B2A6B to #03102E), a radial blue glow overlay, and two crossing diagonal band shapes forming an 'X' motif rendered with multi-stop blue gradients (light sky-blue at top fading to near-black at bottom). Serves as the primary square logo asset in the public root, likely used as the app icon or OG image source.

## Knowledge Gaps
- **82 isolated node(s):** `nextConfig`, `eslintConfig`, `target`, `lib`, `allowJs` (+77 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Nav()` connect `dApp Navigation and Pages` to `Landing Page Sections`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `StakePage()` (e.g. with `RewardsPage()` and `SwapPage()`) actually correct?**
  _`StakePage()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `SwapPage()` (e.g. with `Wagmi on-chain contract integration pattern (Sepolia testnet)` and `StakePage()`) actually correct?**
  _`SwapPage()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nextConfig`, `eslintConfig`, `target` to the rest of the system?**
  _84 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dApp UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.1147086031452359 - nodes in this community are weakly interconnected._
- **Should `App Shell and Routing` be split into smaller, more focused modules?**
  _Cohesion score 0.10461538461538461 - nodes in this community are weakly interconnected._
- **Should `NPM Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._