import { XMLParser } from "fast-xml-parser";
import { env } from "./env";
import type { MolitTrade, MolitGroupedAptSummary } from "@/types/molit";

const ENDPOINT =
  "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev";

const parser = new XMLParser({
  ignoreAttributes: true,
  numberParseOptions: { hex: false, leadingZeros: false, eNotation: false },
  trimValues: true,
});

type RawItem = Record<string, string | number | undefined>;

function pickStr(item: RawItem, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = item[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return undefined;
}

function pickNum(item: RawItem, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = item[k];
    if (v === undefined || v === null || v === "") continue;
    const cleaned = String(v).replace(/,/g, "").trim();
    const n = Number(cleaned);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function normalize(item: RawItem): MolitTrade | null {
  const aptName = pickStr(item, "aptNm", "aptName");
  if (!aptName) return null;
  const dealAmount = pickNum(item, "dealAmount", "dealAmount", "dealAmountStr");
  if (dealAmount === undefined) return null;
  const dealYear = pickNum(item, "dealYear");
  const dealMonth = pickNum(item, "dealMonth");
  const dealDay = pickNum(item, "dealDay");
  if (!dealYear || !dealMonth || !dealDay) return null;
  return {
    aptName,
    aptSeq: pickStr(item, "aptSeq"),
    umdNm: pickStr(item, "umdNm"),
    jibun: pickStr(item, "jibun"),
    roadName: pickStr(item, "roadNm"),
    dealAmount,
    excluUseArea: pickNum(item, "excluUseAr") ?? 0,
    floor: pickNum(item, "floor"),
    buildYear: pickNum(item, "buildYear"),
    dealYear,
    dealMonth,
    dealDay,
  };
}

export async function fetchMolitTrades(lawdCd: string, dealYmd: string): Promise<MolitTrade[]> {
  const params = new URLSearchParams({
    serviceKey: env.dataGoKrServiceKey,
    LAWD_CD: lawdCd,
    DEAL_YMD: dealYmd,
    pageNo: "1",
    numOfRows: "1000",
  });
  const url = `${ENDPOINT}?${params.toString()}`;
  const res = await fetch(url, {
    next: { revalidate: 600 },
    headers: { Accept: "application/xml" },
  });
  if (!res.ok) {
    throw new Error(`MOLIT API failed: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();
  const json = parser.parse(xml) as {
    response?: {
      header?: { resultCode?: string | number; resultMsg?: string };
      body?: { items?: { item?: RawItem | RawItem[] } | "" };
    };
  };
  const code = json.response?.header?.resultCode;
  if (code !== undefined && String(code) !== "00" && String(code) !== "000") {
    throw new Error(
      `MOLIT API error code=${code} msg=${json.response?.header?.resultMsg ?? ""}`,
    );
  }
  const items = json.response?.body?.items;
  if (!items || items === "" || !("item" in items)) return [];
  const rawItems = items.item;
  const arr = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  return arr.map(normalize).filter((x): x is MolitTrade => x !== null);
}

export async function fetchMolitTradesForMonths(
  lawdCd: string,
  dealYmds: string[],
): Promise<MolitTrade[]> {
  const results = await Promise.allSettled(
    dealYmds.map((ymd) => fetchMolitTrades(lawdCd, ymd)),
  );
  const out: MolitTrade[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") out.push(...r.value);
  }
  return out;
}

function dealKey(t: MolitTrade): string {
  return `${t.aptName}|${t.umdNm ?? ""}|${t.jibun ?? ""}`;
}

export function groupTradesByApt(trades: MolitTrade[]): MolitGroupedAptSummary[] {
  const groups = new Map<string, MolitTrade[]>();
  for (const t of trades) {
    const k = dealKey(t);
    const arr = groups.get(k);
    if (arr) arr.push(t);
    else groups.set(k, [t]);
  }
  const summaries: MolitGroupedAptSummary[] = [];
  for (const [, arr] of groups) {
    const sorted = [...arr].sort((a, b) => {
      const ka = a.dealYear * 10000 + a.dealMonth * 100 + a.dealDay;
      const kb = b.dealYear * 10000 + b.dealMonth * 100 + b.dealDay;
      return kb - ka;
    });
    const amounts = sorted.map((t) => t.dealAmount);
    const areas = sorted.map((t) => t.excluUseArea).filter((n) => n > 0);
    const first = sorted[0];
    summaries.push({
      aptName: first.aptName,
      aptSeq: first.aptSeq,
      umdNm: first.umdNm,
      jibun: first.jibun,
      roadName: first.roadName,
      buildYear: first.buildYear,
      trades: sorted,
      latestDealDate: `${first.dealYear}-${String(first.dealMonth).padStart(2, "0")}-${String(first.dealDay).padStart(2, "0")}`,
      avgAmount: Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length),
      minAmount: Math.min(...amounts),
      maxAmount: Math.max(...amounts),
      totalTrades: sorted.length,
      areaRange: areas.length
        ? { min: Math.min(...areas), max: Math.max(...areas) }
        : { min: 0, max: 0 },
    });
  }
  summaries.sort((a, b) => b.latestDealDate.localeCompare(a.latestDealDate));
  return summaries;
}
