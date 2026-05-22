# PrigeeX - Claude Code prompt (paste into terminal)

Copy the block below and paste it as your message to Claude Code at the repo root. It will create the brand assets and wire the Prism logo into every surface (header, footer, favicon, loading states, token list entry, README, meta tags).

---

```
Integrate the finalized PrigeeX "Prism" logo across the codebase. Do all of the following:

1. Create the following SVG files under `public/brand/` (create the directory if needed). Each file should contain exactly the SVG markup shown, nothing else.

   `public/brand/prigeex-logo.svg` (primary, gradient):
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" role="img" aria-label="PrigeeX">
     <defs>
       <linearGradient id="pgx-face" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0%" stop-color="#D4F858"/>
         <stop offset="100%" stop-color="#9FD126"/>
       </linearGradient>
       <linearGradient id="pgx-shade" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0%" stop-color="#A8D636"/>
         <stop offset="100%" stop-color="#6F9A1C"/>
       </linearGradient>
     </defs>
     <path d="M36 6 L62 28 L50 56 L22 56 L10 28 Z" fill="url(#pgx-face)"/>
     <path d="M36 6 L50 56 L22 56 Z" fill="url(#pgx-shade)" opacity="0.9"/>
     <path d="M36 6 L36 56" stroke="#2B3A0F" stroke-width="1" opacity="0.35"/>
     <path d="M10 28 L62 28" stroke="#2B3A0F" stroke-width="1" opacity="0.35"/>
   </svg>
   ```

   `public/brand/prigeex-mark-solid.svg` (flat, for small sizes & monochrome contexts):
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" role="img" aria-label="PrigeeX">
     <path d="M36 6 L62 28 L50 56 L22 56 L10 28 Z" fill="#B8E839"/>
     <path d="M36 6 L50 56 L22 56 Z" fill="#7FB022" opacity="0.9"/>
   </svg>
   ```

   `public/brand/prigeex-favicon.svg` (favicon-optimized, no interior detail):
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 72 72">
     <path d="M36 6 L62 28 L50 56 L22 56 L10 28 Z" fill="#B8E839"/>
   </svg>
   ```

   `public/brand/prigeex-wordmark.svg` (horizontal lockup for dark backgrounds):
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" width="360" height="72" viewBox="0 0 360 72" role="img" aria-label="PrigeeX">
     <defs>
       <linearGradient id="pgx-face-w" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0%" stop-color="#D4F858"/>
         <stop offset="100%" stop-color="#9FD126"/>
       </linearGradient>
       <linearGradient id="pgx-shade-w" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0%" stop-color="#A8D636"/>
         <stop offset="100%" stop-color="#6F9A1C"/>
       </linearGradient>
     </defs>
     <g transform="translate(0,0)">
       <path d="M36 6 L62 28 L50 56 L22 56 L10 28 Z" fill="url(#pgx-face-w)"/>
       <path d="M36 6 L50 56 L22 56 Z" fill="url(#pgx-shade-w)" opacity="0.9"/>
     </g>
     <text x="88" y="48" font-family="Geist, Inter, system-ui, sans-serif" font-size="34" font-weight="600" letter-spacing="-0.5" fill="#F4F6F5">Prigee<tspan fill="#B8E839">X</tspan></text>
   </svg>
   ```

2. Create a reusable `<Logo />` React component at `src/components/Logo.tsx` (or `.jsx` if the project is JS). It should accept `size` (number, default 24), `variant` ("gradient" | "solid" | "wordmark", default "gradient"), and `className`. Internally render inline SVG with unique gradient IDs per instance (append a hook-generated ID) so multiple logos on one page don't clash. Export as default.

3. Header / navbar: replace any existing logo element with `<Logo size={22} />` followed by a `Prigee<span class="text-accent">X</span>` wordmark. Search for existing logo usages - look for files named `Header`, `Navbar`, `Nav`, `TopBar`, `AppShell` - and update all of them.

4. Footer: replace any existing logo element with `<Logo size={16} variant="solid" />`.

5. Favicons & meta: in the root HTML (usually `index.html` or `public/index.html`; for Next.js, update `app/layout.tsx` `metadata.icons`):
   - `<link rel="icon" type="image/svg+xml" href="/brand/prigeex-favicon.svg" />`
   - `<link rel="apple-touch-icon" href="/brand/prigeex-mark-solid.svg" />`
   - Add / update: `<meta property="og:image" content="/brand/prigeex-wordmark.svg" />`
   - Add / update: `<meta name="theme-color" content="#B8E839" />`
   - Update `<title>` to "PrigeeX · Non-custodial swap, stake, earn"

6. Loading / splash screens: any loading skeletons, spinners, or empty states that currently use a generic icon or text should show `<Logo size={40} />` centered. Search for "Loading", "Splash", "Spinner", "Placeholder".

7. Token list: find the PGX token entry (search for `"PGX"`, `symbol: "PGX"`, or `PGX_ADDRESS`) and set its `logoURI` / `image` / `icon` field to `/brand/prigeex-logo.svg`. If tokens are defined in a TS/JS object, update inline. If the project uses a separate tokenlist JSON, update that.

8. README: add the primary logo at the top of `README.md`:
   ```md
   <p align="center"><img src="public/brand/prigeex-logo.svg" width="96" alt="PrigeeX"/></p>
   <h1 align="center">PrigeeX</h1>
   <p align="center">Non-custodial swap, stake, and earn.</p>
   ```
   (If README already has a header, replace only the logo/title block, keep the rest intact.)

9. Brand tokens: ensure the accent color `#B8E839` is exposed as a CSS custom property `--accent` (or Tailwind color `accent`) in the global stylesheet / `tailwind.config`. If a placeholder color exists, update it; don't duplicate.

10. Do NOT modify: business logic, smart-contract interfaces, existing routes, test files, or any `.env`. Only branding surfaces.

After applying, run the project (or `npm run build`) and report any warnings/errors. List every file you created or modified.
```

---

**Files in this project you already have:**
- `brand/prigeex-logo.svg` - primary
- `brand/prigeex-mark-solid.svg` - flat
- `brand/prigeex-favicon.svg` - 32px optimized
- `brand/prigeex-wordmark.svg` - horizontal lockup

You can also just drag these into your repo's `public/brand/` directly if you prefer skipping the regeneration step.
