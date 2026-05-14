import { NextRequest, NextResponse } from "next/server";
import { fetchOdsayTransit } from "@/lib/odsay";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { sx?: number; sy?: number; ex?: number; ey?: number };
    const { sx, sy, ex, ey } = body;
    if (sx === undefined || sy === undefined || ex === undefined || ey === undefined) {
      return NextResponse.json({ ok: false, error: "sx,sy,ex,ey required" }, { status: 400 });
    }
    const data = await fetchOdsayTransit(sx, sy, ex, ey);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 502 },
    );
  }
}
