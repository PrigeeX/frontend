import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = process.env.RPC_URL || "https://arbitrum-sepolia.drpc.org";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const res = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("[rpc proxy] error:", e);
    return NextResponse.json({ error: "rpc unreachable" }, { status: 502 });
  }
}
