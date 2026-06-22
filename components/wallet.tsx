"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { useAppKit, useAppKitNetwork } from "@reown/appkit/react";
import { shortAddr } from "@/lib/format";
import { useToast } from "./toast";
import "@/lib/appkit";

const SUPPORTED_CHAIN_IDS = new Set([42161, 421614]); // Arbitrum One, Arbitrum Sepolia

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
  const { caipNetwork } = useAppKitNetwork();
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

  // If the wallet is on an unsupported chain, switch to whatever AppKit
  // currently has selected (respects the user's testnet/mainnet preference).
  useEffect(() => {
    if (isConnected && chainId && !SUPPORTED_CHAIN_IDS.has(chainId)) {
      const targetId =
        typeof caipNetwork?.id === "number"
          ? caipNetwork.id
          : arbitrumSepolia.id;
      switchChain({ chainId: targetId });
    }
  }, [isConnected, chainId, caipNetwork, switchChain]);

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
