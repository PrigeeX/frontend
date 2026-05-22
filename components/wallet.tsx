"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import type { Connector } from "wagmi";
import { sepolia } from "wagmi/chains";
import { Icon } from "./icons";
import { shortAddr } from "@/lib/format";
import { useToast } from "./toast";

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

const CONNECTOR_LABELS: Record<string, { name: string; detail: string; color: string }> = {
  metaMaskSDK: { name: "MetaMask", detail: "Browser extension", color: "oklch(0.70 0.18 55)" },
  metaMask: { name: "MetaMask", detail: "Browser extension", color: "oklch(0.70 0.18 55)" },
  walletConnect: { name: "WalletConnect", detail: "Scan with mobile wallet", color: "oklch(0.70 0.15 240)" },
  coinbaseWalletSDK: { name: "Coinbase Wallet", detail: "Smart wallet or extension", color: "oklch(0.60 0.17 250)" },
  injected: { name: "Browser Wallet", detail: "Any EIP-1193 provider", color: "oklch(0.60 0.03 240)" },
};

const labelFor = (c: Connector) => {
  const fromId = CONNECTOR_LABELS[c.id];
  if (fromId) return fromId;
  return { name: c.name, detail: "Connect via " + c.name, color: "oklch(0.60 0.03 240)" };
};

const WalletGlyph = ({ color }: { color: string }) => (
  <div
    style={{
      width: 40,
      height: 40,
      borderRadius: 10,
      background: `color-mix(in oklch, ${color} 18%, transparent)`,
      border: `1px solid color-mix(in oklch, ${color} 40%, transparent)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color,
    }}
  >
    <Icon.Wallet size={18} />
  </div>
);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const { address, chainId, isConnected, connector } = useAccount();
  const { connect, connectors, isPending, variables } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const previous = React.useRef(isConnected);
  useEffect(() => {
    if (!previous.current && isConnected) {
      toast({ title: "Wallet connected", body: `${connector?.name ?? "Wallet"} · ${shortAddr(address)}` });
      setOpen(false);
    }
    previous.current = isConnected;
  }, [isConnected, connector, address, toast]);

  useEffect(() => {
    if (isConnected && chainId && chainId !== sepolia.id) {
      switchChain({ chainId: sepolia.id });
    }
  }, [isConnected, chainId, switchChain]);

  const value: WalletCtxValue = {
    connected: isConnected,
    address,
    chainId,
    providerName: connector?.name,
    open: () => setOpen(true),
    close: () => setOpen(false),
    disconnect: () => {
      disconnect();
      toast({ title: "Wallet disconnected" });
    },
  };

  return (
    <WalletCtx.Provider value={value}>
      {children}
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div
              className="row"
              style={{ justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--line)" }}
            >
              <div className="col gap-4">
                <div style={{ fontSize: 15, fontWeight: 600 }}>Connect a wallet</div>
                <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                  Non-custodial. You control your keys.
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: 6, borderRadius: 6 }}
              >
                <Icon.Close />
              </button>
            </div>

            {isPending ? (
              <div className="col" style={{ padding: "40px 24px", alignItems: "center", gap: 20 }}>
                <div style={{ position: "relative" }}>
                  <WalletGlyph color={"oklch(0.70 0.18 55)"} />
                  <div
                    style={{
                      position: "absolute",
                      inset: -6,
                      borderRadius: 12,
                      border: `1.5px solid var(--accent)`,
                      borderTopColor: "transparent",
                      animation: "spin 0.9s linear infinite",
                    }}
                  />
                </div>
                <div className="col gap-6" style={{ alignItems: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>
                    Opening {variables?.connector && "name" in variables.connector ? variables.connector.name : "wallet"}…
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-2)", textAlign: "center", maxWidth: 280 }}>
                    Approve the connection in your wallet to continue. PrigeeX never takes custody of your assets.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 12 }}>
                {connectors.map((c) => {
                  const m = labelFor(c);
                  return (
                    <button
                      key={c.uid}
                      onClick={() => connect({ connector: c })}
                      className="row gap-12"
                      style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 10,
                        background: "transparent",
                        textAlign: "left",
                        transition: "background .12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <WalletGlyph color={m.color} />
                      <div className="col gap-4" style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-2)" }}>{m.detail}</div>
                      </div>
                      <Icon.Arrow dir="right" />
                    </button>
                  );
                })}
              </div>
            )}

            <div
              className="row gap-8"
              style={{
                padding: "12px 20px",
                borderTop: "1px solid var(--line)",
                background: "var(--bg-2)",
                fontSize: 12,
                color: "var(--text-2)",
              }}
            >
              <Icon.Shield size={14} />
              <span>By connecting you accept the Terms. Signatures are gasless.</span>
            </div>
          </div>
        </div>
      )}
    </WalletCtx.Provider>
  );
};
