import { NextRequest, NextResponse } from "next/server";
import { kakaoAddressSearch } from "@/lib/kakao";
import { bCodeToLawdCd } from "@/lib/lawd";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("query");
  if (!q) {
    return NextResponse.json({ ok: false, error: "query required" }, { status: 400 });
  }
  try {
    const docs = await kakaoAddressSearch(q);
    const enriched = docs.map((d) => ({
      ...d,
      lawdCd: bCodeToLawdCd(d.address?.b_code),
    }));
    return NextResponse.json(
      { ok: true, documents: enriched },
      { headers: { "Cache-Control": "public, s-maxage=600" } },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 502 },
    );
  }
}
