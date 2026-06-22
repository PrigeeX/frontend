"use client";

// Real swap layer (FE-06..15): balances, live QuoterV2 quotes, and execution via
// the V3 SwapRouter. Mirrors the lib/staking.ts adapter shape. The swap UI uses
// this whenever both selected tokens are real on-chain DEX tokens, and falls
// back to its illustrative preview otherwise.

import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContracts,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Token } from "@uniswap/sdk-core";
import { FeeAmount } from "@uniswap/v3-sdk";
import { erc20Abi, quoterV2Abi, swapRouterAbi } from "./contracts";
import { DEX } from "./dex";
import { DEX_TOKENS } from "./liquidity";

export { DEX_TOKENS };

/** Resolve a UI symbol to a real DEX token (ETH is treated as WETH). */
export function dexTokenFor(symbol: string): Token | undefined {
  const want = symbol === "ETH" ? "WETH" : symbol;
  return DEX_TOKENS.find((t) => t.symbol === want);
}

type Cb = { onSuccess?: (hash: `0x${string}`) => void; onError?: (e: Error) => void };

/** Wallet balance + router allowance for a token. */
export function useTokenAccount(token?: Token) {
  const { address } = useAccount();
  const { data } = useReadContracts({
    contracts:
      token && address
        ? [
            { address: token.address as `0x${string}`, abi: erc20Abi, functionName: "balanceOf", args: [address] },
            { address: token.address as `0x${string}`, abi: erc20Abi, functionName: "allowance", args: [address, DEX.swapRouter] },
          ]
        : [],
    query: { enabled: Boolean(token && address), refetchInterval: 12_000 },
  });
  const balanceRaw = data?.[0]?.status === "success" ? (data[0].result as bigint) : undefined;
  const allowance = data?.[1]?.status === "success" ? (data[1].result as bigint) : undefined;
  return {
    balanceRaw,
    allowance,
    balance: balanceRaw !== undefined && token ? Number(balanceRaw) / 10 ** token.decimals : undefined,
  };
}

/**
 * Live quote via QuoterV2.quoteExactInputSingle, simulated (the quoter is a
 * state-changing call used read-only). Debounce happens in the caller.
 */
export function useSwapQuote(tokenIn?: Token, tokenOut?: Token, amountIn?: bigint, fee: FeeAmount = FeeAmount.MEDIUM) {
  const enabled = Boolean(tokenIn && tokenOut && amountIn && amountIn > 0n);
  const { data, isFetching } = useSimulateContract({
    address: DEX.quoterV2,
    abi: quoterV2Abi,
    functionName: "quoteExactInputSingle",
    args: enabled
      ? [
          {
            tokenIn: tokenIn!.address as `0x${string}`,
            tokenOut: tokenOut!.address as `0x${string}`,
            amountIn: amountIn!,
            fee,
            sqrtPriceLimitX96: 0n,
          },
        ]
      : undefined,
    query: { enabled },
  });

  const result = data?.result as readonly [bigint, bigint, number, bigint] | undefined;
  return {
    amountOutRaw: result?.[0],
    gasEstimate: result?.[3],
    amountOut: result && tokenOut ? Number(result[0]) / 10 ** tokenOut.decimals : undefined,
    loading: enabled && isFetching,
    noRoute: enabled && !isFetching && !result,
  };
}

/** approve(router) + exactInputSingle, tracked through one receipt wait. */
export function useSwapActions(onMined?: () => void) {
  const { address } = useAccount();
  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: mined } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (mined) {
      onMined?.();
      reset();
    }
  }, [mined, onMined, reset]);

  const busy = isPending || mining;

  const approve = (token: Token, amount: bigint, cb?: Cb) =>
    writeContract(
      { address: token.address as `0x${string}`, abi: erc20Abi, functionName: "approve", args: [DEX.swapRouter, amount] },
      cb,
    );

  const swap = (
    tokenIn: Token,
    tokenOut: Token,
    amountIn: bigint,
    minOut: bigint,
    fee: FeeAmount,
    cb?: Cb,
  ) => {
    if (!address) return;
    writeContract(
      {
        address: DEX.swapRouter,
        abi: swapRouterAbi,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn: tokenIn.address as `0x${string}`,
            tokenOut: tokenOut.address as `0x${string}`,
            fee,
            recipient: address,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 30 * 60),
            amountIn,
            amountOutMinimum: minOut,
            sqrtPriceLimitX96: 0n,
          },
        ],
      },
      cb,
    );
  };

  return { approve, swap, busy, txHash };
}

/** Debounce a changing value (FE-08: quote updates as the user types). */
export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export { FeeAmount };
