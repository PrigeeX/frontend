import { NextRequest, NextResponse } from "next/server";
import { subgraphUpstream } from "@/packages/dex-config";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ graph: string }> },
) {
  const { graph } = await params;
  const upstream = subgraphUpstream(graph);

  if (!upstream) {
    return NextResponse.json({ errors: [{ message: "unknown subgraph" }] }, { status: 404 });
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = process.env.SUBGRAPH_BEARER_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const body = await req.text();
    const upstream_res = await fetch(upstream, { method: "POST", headers, body });
    const data = await upstream_res.json();
    return NextResponse.json(data, { status: upstream_res.status });
  } catch (e) {
    console.error("[subgraph proxy] error:", e);
    return NextResponse.json({ errors: [{ message: "subgraph unreachable" }] }, { status: 502 });
  }
}
