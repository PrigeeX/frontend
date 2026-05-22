export type TokenSymbol =
  | "PGX"
  | "ETH"
  | "USDC"
  | "USDT"
  | "WBTC"
  | "DAI"
  | "ARB"
  | "OP";

export type Token = {
  symbol: TokenSymbol;
  name: string;
  price: number;
  balanceKey: TokenSymbol;
};

export const TOKENS: Token[] = [
  { symbol: "PGX", name: "PrigeeX", price: 0.4218, balanceKey: "PGX" },
  { symbol: "ETH", name: "Ethereum", price: 3450.12, balanceKey: "ETH" },
  { symbol: "USDC", name: "USD Coin", price: 1.0, balanceKey: "USDC" },
  { symbol: "USDT", name: "Tether", price: 1.0, balanceKey: "USDT" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", price: 68420.5, balanceKey: "WBTC" },
  { symbol: "DAI", name: "Dai", price: 0.9998, balanceKey: "DAI" },
  { symbol: "ARB", name: "Arbitrum", price: 1.21, balanceKey: "ARB" },
  { symbol: "OP", name: "Optimism", price: 2.48, balanceKey: "OP" },
];

export const tokenBySymbol = (s: TokenSymbol) =>
  TOKENS.find((t) => t.symbol === s)!;
