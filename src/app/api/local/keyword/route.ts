import { NextRequest, NextResponse } from "next/server";
import { kakaoKeywordSearch } from "@/lib/kakao";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("query");
  if (!q) {
    return NextResponse.json({ ok: false, error: "query required" }, { status: 400 });
  }
  const x = sp.get("x") ?? undefined;
  const y = sp.get("y") ?? undefined;
  const radius = sp.get("radius");
  const categoryGroupCode = sp.get("categoryGroupCode") ?? undefined;
  try {
    const docs = await kakaoKeywordSearch(q, {
      x,
      y,
      radius: radius ? Number(radius) : undefined,
      categoryGroupCode,
    });
    return NextResponse.json(
      { ok: true, documents: docs },
      { headers: { "Cache-Control": "public, s-maxage=600" } },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 502 },
    );
  }
}
