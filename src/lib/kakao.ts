import { env } from "./env";
import type { KakaoAddressDoc, KakaoPlaceDoc, NearbyCategoryResult } from "@/types/kakao";

const LOCAL_BASE = "https://dapi.kakao.com/v2/local";
const MOBILITY_DIRECTIONS = "https://apis-navi.kakaomobility.com/v1/directions";

function kakaoAuthHeaders(): HeadersInit {
  return { Authorization: `KakaoAK ${env.kakaoRestKey}` };
}

export async function kakaoAddressSearch(query: string): Promise<KakaoAddressDoc[]> {
  const u = new URL(`${LOCAL_BASE}/search/address.json`);
  u.searchParams.set("query", query);
  u.searchParams.set("size", "10");
  const res = await fetch(u, {
    headers: kakaoAuthHeaders(),
    next: { revalidate: 600 },
  });
  if (!res.ok) throw new Error(`Kakao address search failed: ${res.status}`);
  const json = (await res.json()) as { documents: KakaoAddressDoc[] };
  return json.documents ?? [];
}

export async function kakaoKeywordSearch(
  query: string,
  opts: { x?: string; y?: string; radius?: number; size?: number; categoryGroupCode?: string } = {},
): Promise<KakaoPlaceDoc[]> {
  const u = new URL(`${LOCAL_BASE}/search/keyword.json`);
  u.searchParams.set("query", query);
  u.searchParams.set("size", String(opts.size ?? 15));
  if (opts.x && opts.y) {
    u.searchParams.set("x", opts.x);
    u.searchParams.set("y", opts.y);
    u.searchParams.set("sort", "distance");
    if (opts.radius) u.searchParams.set("radius", String(opts.radius));
  }
  if (opts.categoryGroupCode) u.searchParams.set("category_group_code", opts.categoryGroupCode);
  const res = await fetch(u, {
    headers: kakaoAuthHeaders(),
    next: { revalidate: 600 },
  });
  if (!res.ok) throw new Error(`Kakao keyword search failed: ${res.status}`);
  const json = (await res.json()) as { documents: KakaoPlaceDoc[] };
  return json.documents ?? [];
}

async function kakaoCategorySearch(
  groupCode: string,
  x: string,
  y: string,
  radius: number,
): Promise<KakaoPlaceDoc[]> {
  const u = new URL(`${LOCAL_BASE}/search/category.json`);
  u.searchParams.set("category_group_code", groupCode);
  u.searchParams.set("x", x);
  u.searchParams.set("y", y);
  u.searchParams.set("radius", String(radius));
  u.searchParams.set("sort", "distance");
  u.searchParams.set("size", "15");
  const res = await fetch(u, {
    headers: kakaoAuthHeaders(),
    next: { revalidate: 600 },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { documents: KakaoPlaceDoc[] };
  return json.documents ?? [];
}

export const CATEGORY_GROUPS: { code: string; label: string }[] = [
  { code: "SC4", label: "학교" },
  { code: "SW8", label: "지하철역" },
  { code: "MT1", label: "대형마트" },
  { code: "CS2", label: "편의점" },
  { code: "HP8", label: "병원" },
  { code: "PM9", label: "약국" },
  { code: "BK9", label: "은행" },
  { code: "FD6", label: "음식점" },
  { code: "CE7", label: "카페" },
];

export async function fetchNearby(
  x: string,
  y: string,
  radius = 1000,
): Promise<NearbyCategoryResult[]> {
  const categoryResults = await Promise.all(
    CATEGORY_GROUPS.map(async ({ code, label }) => ({
      groupCode: code,
      label,
      items: await kakaoCategorySearch(code, x, y, radius),
    })),
  );
  const [parkItems, hagwonItems] = await Promise.all([
    kakaoKeywordSearch("공원", { x, y, radius, size: 10 }),
    kakaoKeywordSearch("학원", { x, y, radius, size: 10 }),
  ]);
  return [
    ...categoryResults,
    { groupCode: "PARK", label: "공원", items: parkItems },
    { groupCode: "HAGWON", label: "학원", items: hagwonItems },
  ];
}

export type KakaoCarDirectionsResult = {
  distanceM: number;
  durationSec: number;
  tollFare?: number;
  taxiFare?: number;
  fuelPrice?: number;
};

export async function kakaoCarDirections(
  origin: { x: number; y: number },
  destination: { x: number; y: number },
): Promise<KakaoCarDirectionsResult> {
  const u = new URL(MOBILITY_DIRECTIONS);
  u.searchParams.set("origin", `${origin.x},${origin.y}`);
  u.searchParams.set("destination", `${destination.x},${destination.y}`);
  u.searchParams.set("priority", "RECOMMEND");
  const res = await fetch(u, {
    headers: { ...kakaoAuthHeaders(), "Content-Type": "application/json" },
    next: { revalidate: 600 },
  });
  if (!res.ok) throw new Error(`Kakao directions failed: ${res.status}`);
  const json = (await res.json()) as {
    routes?: Array<{
      result_code: number;
      summary?: {
        distance?: number;
        duration?: number;
        fare?: { taxi?: number; toll?: number };
      };
    }>;
  };
  const route = json.routes?.[0];
  if (!route || route.result_code !== 0 || !route.summary) {
    throw new Error(`Kakao directions: no route (code=${route?.result_code ?? "none"})`);
  }
  return {
    distanceM: route.summary.distance ?? 0,
    durationSec: route.summary.duration ?? 0,
    tollFare: route.summary.fare?.toll,
    taxiFare: route.summary.fare?.taxi,
  };
}
