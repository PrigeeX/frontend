"use client";

// Sequences multi-transaction flows (approve → approve → action). A component
// enqueues every remaining step up front and wires `advance` into its actions
// hook's onMined callback, so each confirmed tx automatically prompts the next
// wallet signature without another button click.

import { useRef } from "react";

export function useTxQueue() {
  const steps = useRef<(() => void)[]>([]);

  /** Fire the first step now; keep the rest for `advance`. */
  const start = (list: (() => void)[]) => {
    steps.current = list.slice(1);
    list[0]?.();
  };

  /**
   * Call when a tx mines. Fires the next queued step and returns true, or
   * returns false when the chain is finished (the mined tx was the last step).
   */
  const advance = (): boolean => {
    const next = steps.current.shift();
    if (next) {
      next();
      return true;
    }
    return false;
  };

  /** Abort the chain (e.g. the user rejected a signature). */
  const clear = () => {
    steps.current = [];
  };

  return { start, advance, clear };
}
