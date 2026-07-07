// Base URL for the published GitBook docs site.
// Not live yet - set NEXT_PUBLIC_DOCS_URL once the space is published, and every
// link below resolves automatically. Until then they fall back to "#".
const DOCS_BASE = process.env.NEXT_PUBLIC_DOCS_URL || "";

const docsPath = (path: string) =>
  DOCS_BASE ? `${DOCS_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}` : "#";

export const DOCS = {
  root: DOCS_BASE || "#",
  gettingStarted: {
    whatYouNeed: docsPath("getting-started/what-you-need"),
    setUpWallet: docsPath("getting-started/set-up-a-wallet"),
    getFunds: docsPath("getting-started/get-funds-on-arbitrum"),
    connect: docsPath("getting-started/connect-to-prigeex"),
  },
  guides: {
    swap: docsPath("guides/swap-tokens"),
    liquidityOverview: docsPath("guides/liquidity-v2-vs-v3"),
    addLiquidityV2: docsPath("guides/provide-liquidity-v2"),
    addLiquidityV3: docsPath("guides/provide-liquidity-v3"),
    managePositions: docsPath("guides/manage-positions"),
    stake: docsPath("guides/stake-pgx"),
    analytics: docsPath("guides/read-the-analytics"),
  },
  learn: {
    whatIsADex: docsPath("learn/what-is-a-dex"),
    impermanentLoss: docsPath("learn/impermanent-loss"),
    feesAndGas: docsPath("learn/fees-and-gas"),
    security: docsPath("learn/security-and-safety"),
  },
  investors: {
    vision: docsPath("investors/vision"),
    tokenomics: docsPath("investors/pgx-tokenomics"),
    roadmap: docsPath("investors/roadmap"),
    roadmapSecurity: docsPath("investors/roadmap") + (DOCS_BASE ? "#a-note-on-security" : ""),
  },
  reference: {
    faq: docsPath("reference/faq"),
    glossary: docsPath("reference/glossary"),
    contracts: docsPath("reference/contract-addresses"),
  },
};
