import { NextRequest, NextResponse } from "next/server";
import { fetchNearby } from "@/lib/kakao";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const x = sp.get("x");
  const y = sp.get("y");
  const radius = sp.get("radius");
  if (!x || !y) {
    return NextResponse.json({ ok: false, error: "x, y required" }, { status: 400 });
  }
  try {
    const data = await fetchNearby(x, y, radius ? Number(radius) : 1000);
    return NextResponse.json(
      { ok: true, nearby: data },
      { headers: { "Cache-Control": "public, s-maxage=600" } },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 502 },
    );
  }
}
