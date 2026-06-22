"use client";

// Small adapter that isolates all PrigeeXStaking reads/writes behind one hook so the
// rest of the app never references the staking ABI or makes assumptions about which
// functions exist. The staking contract is not final; when it changes, this file is the
// only thing that should need updating.
//
// Contract surface (see PrigeeXStaking.sol / IPrigeeXStaking.sol):
//   writes: stake(amount), unstake(amount), claimRewards(), depositRewards(amount)
//   views : earned(user), getStakingInfo(user), stakedBalance(user), totalStaked(),
//           totalRewardsDeposited(), rewardReserve(), paused()
//
// Deliberately NOT modelled, because the contract does not expose them and the SRS says
// not to fabricate them: per-second reward rate, emissions schedule, APR/APY. Those can
// only be derived from real fee-distribution history (the subgraph), which is not wired
// yet, so consumers should render "-" for them.

import { useEffect } from "react";
import {
  useAccount,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { PGX_ADDRESS, STAKING_ADDRESS, erc20Abi, stakingAbi } from "./contracts";

export const PGX_DECIMALS = 18;

export type StakingState = {
  /** Wallet PGX balance, raw + formatted number. */
  walletBalance?: bigint;
  /** PGX allowance granted to the staking contract. */
  allowance?: bigint;
  /** Caller's staked principal. */
  staked?: bigint;
  /** Caller's claimable rewards. */
  earned?: bigint;
  /** Global PGX staked across all users. */
  totalStaked?: bigint;
  /** Lifetime rewards deposited (analytics). */
  totalRewardsDeposited?: bigint;
  /** Rewards reserved for stakers but not yet claimed. */
  rewardReserve?: bigint;
  /** Whether stake() is paused. Unstake and claim remain enabled while paused. */
  paused?: boolean;
};

const toNum = (v?: bigint) =>
  v === undefined ? 0 : Number(formatUnits(v, PGX_DECIMALS));

export const fmtPgx = toNum;

/** Parse a user-entered amount string into wei, tolerant of empty/invalid input. */
export function parsePgx(amount: string): bigint {
  if (!amount) return 0n;
  try {
    return parseUnits(amount, PGX_DECIMALS);
  } catch {
    return 0n;
  }
}

export function useStaking() {
  const { address } = useAccount();

  const { data, refetch, status, error } = useReadContracts({
    contracts: [
      { address: PGX_ADDRESS, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
      { address: PGX_ADDRESS, abi: erc20Abi, functionName: "allowance", args: [address!, STAKING_ADDRESS] },
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "stakedBalance", args: [address!] },
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "earned", args: [address!] },
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "totalStaked" },
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "totalRewardsDeposited" },
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "rewardReserve" },
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "paused" },
    ],
    query: { enabled: Boolean(address), refetchInterval: 10_000 },
  });

  // Global reads that should resolve even without a connected wallet.
  const { data: globalData } = useReadContracts({
    contracts: [
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "totalStaked" },
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "paused" },
    ],
    query: { enabled: !address, refetchInterval: 15_000 },
  });

  const ok = <T,>(i: number): T | undefined =>
    data?.[i]?.status === "success" ? (data[i].result as T) : undefined;

  const state: StakingState = {
    walletBalance: ok<bigint>(0),
    allowance: ok<bigint>(1),
    staked: ok<bigint>(2),
    earned: ok<bigint>(3),
    totalStaked:
      ok<bigint>(4) ??
      (globalData?.[0]?.status === "success" ? (globalData[0].result as bigint) : undefined),
    totalRewardsDeposited: ok<bigint>(5),
    rewardReserve: ok<bigint>(6),
    paused:
      ok<boolean>(7) ??
      (globalData?.[1]?.status === "success" ? (globalData[1].result as boolean) : undefined),
  };

  const loading = Boolean(address) && status === "pending";
  const hasError = Boolean(address) && data?.some((r) => r.status === "failure");

  useEffect(() => {
    if (!error) return;
    console.error("[staking] read error:", error);
  }, [error]);

  return { state, loading, hasError, refetch };
}

/** Write helper that exposes the four staking actions plus PGX approval. */
export function useStakingActions(onMined?: () => void) {
  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: mined } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (mined) {
      onMined?.();
      reset();
    }
  }, [mined, onMined, reset]);

  const busy = isPending || mining;

  const approve = (
    amount: bigint,
    cb?: { onSuccess?: () => void; onError?: (e: Error) => void }
  ) =>
    writeContract(
      { address: PGX_ADDRESS, abi: erc20Abi, functionName: "approve", args: [STAKING_ADDRESS, amount] },
      cb
    );

  const stake = (amount: bigint, cb?: { onSuccess?: () => void; onError?: (e: Error) => void }) =>
    writeContract(
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "stake", args: [amount] },
      cb
    );

  const unstake = (amount: bigint, cb?: { onSuccess?: () => void; onError?: (e: Error) => void }) =>
    writeContract(
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "unstake", args: [amount] },
      cb
    );

  const claim = (cb?: { onSuccess?: () => void; onError?: (e: Error) => void }) =>
    writeContract(
      { address: STAKING_ADDRESS, abi: stakingAbi, functionName: "claimRewards" },
      cb
    );

  return { approve, stake, unstake, claim, busy };
}
