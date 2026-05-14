import { GoogleGenAI } from "@google/genai";
import { env } from "./env";
import type { BriefingInput } from "@/types/briefing";
import { formatManwon, formatDistanceM, formatDurationSec, formatDurationMin } from "./format";

let _client: GoogleGenAI | null = null;
function client(): GoogleGenAI {
  if (!_client) _client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  return _client;
}

const MODEL = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `당신은 한국 부동산 매물 비서입니다.
- 한국어 존댓말로 친근하고 신뢰감 있게, 풍부한 설명으로 답합니다.
- 광고, 과장, 추측은 금지. 제공된 데이터에만 근거합니다.
- 마크다운을 사용하며 다음 구조를 따릅니다:
  1) 한두 문장 인사 + 단지 요약 (가격대·평형·연식·거래 활성도 등)
  2) **시세 분석** — 평균/최저/최고가 의미, 거래량과 면적 분포에서 읽히는 특징 (2-3 문장)
  3) **출퇴근** — 프리셋 목적지까지 자가용/대중교통 시간·거리·환승, 비교 코멘트 (2-3 문장)
  4) **교육·학군** — 주변 학교·학원을 이름 인용해 구체적으로 (2-3 문장)
  5) **생활 편의** — 마트·편의점·병원·지하철·공원·은행 등 인상적인 항목을 이름 인용 (3-4 문장)
  6) **종합 의견** — 어떤 가구/라이프스타일에 적합한지, 강점·약점 (3-4 문장)
- 총 길이는 한국어 기준 800~1200자. 각 섹션이 한 줄로 끝나지 않게 충분히 서술합니다.
- 데이터가 없는 항목은 정직하게 "정보 없음"이라고 적되, 다른 섹션을 더 충실히 채웁니다.`;

function describeApt(input: BriefingInput): string {
  const a = input.apt;
  const lines = [
    `단지명: ${a.aptName}`,
    `지번/도로명: ${a.umdNm ?? ""} ${a.jibun ?? ""}${a.roadName ? ` / ${a.roadName}` : ""}`,
    `준공년도: ${a.buildYear ?? "-"}`,
    `최근 거래일: ${a.latestDealDate}`,
    `최근 ${a.totalTrades}건 거래 평균 ${formatManwon(a.avgAmount)} (최저 ${formatManwon(a.minAmount)} ~ 최고 ${formatManwon(a.maxAmount)})`,
    `전용면적 범위: ${a.areaRange.min.toFixed(1)} ~ ${a.areaRange.max.toFixed(1)} ㎡`,
  ];
  return lines.join("\n");
}

function describeRoutes(input: BriefingInput): string {
  const lines: string[] = [`목적지: ${input.destination.label}`];
  if (input.car) {
    lines.push(
      `자가용: 거리 ${formatDistanceM(input.car.distanceM)}, 소요 ${formatDurationSec(input.car.durationSec)}${input.car.tollFare ? `, 통행료 ${input.car.tollFare.toLocaleString()}원` : ""}`,
    );
  } else {
    lines.push("자가용: 정보 없음");
  }
  if (input.transit) {
    lines.push(
      `대중교통: 소요 ${formatDurationMin(input.transit.totalTimeMin)}, 환승 ${input.transit.transferCount}회, 경로 ${input.transit.summaryLine}`,
    );
  } else {
    lines.push("대중교통: 정보 없음");
  }
  return lines.join("\n");
}

function describeNearby(input: BriefingInput): string {
  return input.nearby
    .filter((c) => c.items.length > 0)
    .map(
      (c) =>
        `${c.label} (${c.items.length}곳): ${c.items
          .slice(0, 5)
          .map((p) => p.place_name)
          .join(", ")}`,
    )
    .join("\n");
}

export function buildBriefingPrompt(input: BriefingInput): string {
  return [
    "[단지]",
    describeApt(input),
    "",
    "[경로]",
    describeRoutes(input),
    "",
    "[주변 시설 (반경 약 1km)]",
    describeNearby(input) || "정보 없음",
    "",
    "위 데이터로 비서 브리핑을 작성하세요.",
  ].join("\n");
}

export async function generateBriefing(input: BriefingInput): Promise<string> {
  const prompt = buildBriefingPrompt(input);
  const res = await client().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.6,
      maxOutputTokens: 1800,
    },
  });
  return res.text ?? "";
}
