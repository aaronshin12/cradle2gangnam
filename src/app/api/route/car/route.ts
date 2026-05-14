import { NextRequest, NextResponse } from "next/server";
import { kakaoCarDirections } from "@/lib/kakao";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      origin?: { x: number; y: number };
      destination?: { x: number; y: number };
    };
    if (!body.origin || !body.destination) {
      return NextResponse.json({ ok: false, error: "origin/destination required" }, { status: 400 });
    }
    const data = await kakaoCarDirections(body.origin, body.destination);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 502 },
    );
  }
}
