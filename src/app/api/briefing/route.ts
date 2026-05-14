import { NextRequest, NextResponse } from "next/server";
import { generateBriefing } from "@/lib/gemini";
import type { BriefingInput } from "@/types/briefing";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BriefingInput;
    if (!body?.apt || !body?.destination) {
      return NextResponse.json({ ok: false, error: "apt, destination required" }, { status: 400 });
    }
    const text = await generateBriefing(body);
    return NextResponse.json({ ok: true, text });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 502 },
    );
  }
}
