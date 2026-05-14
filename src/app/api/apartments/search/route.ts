import { NextRequest, NextResponse } from "next/server";
import { fetchMolitTradesForMonths, groupTradesByApt } from "@/lib/molit";
import { recentYmds } from "@/lib/lawd";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lawdCd = sp.get("lawdCd");
  const dealYmds = sp.getAll("dealYmd");
  if (!lawdCd || !/^\d{5}$/.test(lawdCd)) {
    return NextResponse.json({ ok: false, error: "lawdCd (5 digits) required" }, { status: 400 });
  }
  const months = dealYmds.length ? dealYmds : recentYmds(3);
  try {
    const trades = await fetchMolitTradesForMonths(lawdCd, months);
    const apts = groupTradesByApt(trades);
    return NextResponse.json(
      { ok: true, lawdCd, dealYmds: months, totalTrades: trades.length, apartments: apts },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300" } },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 502 },
    );
  }
}
