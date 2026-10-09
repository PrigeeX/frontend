"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { shortAddr } from "@/lib/format";
import { DEX_CHAIN } from "@/lib/dex";
import { useToast } from "./toast";
import "@/lib/appkit";

type WalletCtxValue = {
  connected: boolean;
  address?: `0x${string}`;
  chainId?: number;
  providerName?: string;
  open: () => void;
  close: () => void;
  disconnect: () => void;
};

const WalletCtx = createContext<WalletCtxValue | null>(null);

export const useWallet = () => {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet outside WalletProvider");
  return ctx;
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const { address, chainId, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { open, close } = useAppKit();
  const toast = useToast();

  const previous = React.useRef(isConnected);
  useEffect(() => {
    if (!previous.current && isConnected) {
      toast({
        title: "Wallet connected",
        body: `${connector?.name ?? "Wallet"} · ${shortAddr(address)}`,
      });
    }
    previous.current = isConnected;
  }, [isConnected, connector, address, toast]);

  // If the wallet is on any other chain, switch it to this deployment's network.
  useEffect(() => {
    if (isConnected && chainId && chainId !== DEX_CHAIN.id) {
      switchChain({ chainId: DEX_CHAIN.id });
    }
  }, [isConnected, chainId, switchChain]);

  const value: WalletCtxValue = {
    connected: isConnected,
    address,
    chainId,
    providerName: connector?.name,
    open: () => open(),
    close: () => close(),
    disconnect: () => {
      disconnect();
      toast({ title: "Wallet disconnected" });
    },
  };

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>;
};
