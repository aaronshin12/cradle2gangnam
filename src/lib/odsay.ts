import { env } from "./env";

const ENDPOINT = "https://api.odsay.com/v1/api/searchPubTransPathT";

export type OdsayTransitResult = {
  totalTimeMin: number;
  totalDistanceM: number;
  payment: number;
  transferCount: number;
  busTransitCount: number;
  subwayTransitCount: number;
  firstStartStation?: string;
  lastEndStation?: string;
  pathType: number;
  summaryLine: string;
};

export async function fetchOdsayTransit(
  sx: number,
  sy: number,
  ex: number,
  ey: number,
): Promise<OdsayTransitResult | null> {
  const u = new URL(ENDPOINT);
  u.searchParams.set("apiKey", env.odsayApiKey);
  u.searchParams.set("lang", "0");
  u.searchParams.set("SX", String(sx));
  u.searchParams.set("SY", String(sy));
  u.searchParams.set("EX", String(ex));
  u.searchParams.set("EY", String(ey));
  u.searchParams.set("OPT", "0");
  u.searchParams.set("SearchType", "0");
  u.searchParams.set("SearchPathType", "0");

  const res = await fetch(u, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`ODsay HTTP ${res.status}`);
  // ODsay returns errors in multiple shapes across endpoints/versions:
  //   { error: { code, msg } }
  //   { error: [{ code, msg }] }
  //   { code, msg } (top-level on auth failures)
  //   { result: { code, msg } } (some product errors)
  const json = (await res.json()) as Record<string, unknown>;
  const extractError = (j: Record<string, unknown>): string | null => {
    const fmt = (e: Record<string, unknown>): string =>
      `${e.code ?? e.errorCode ?? "?"} ${e.msg ?? e.message ?? e.errorMessage ?? ""}`.trim();
    if (j.error) {
      if (Array.isArray(j.error) && j.error.length) return fmt(j.error[0] as Record<string, unknown>);
      if (typeof j.error === "object") return fmt(j.error as Record<string, unknown>);
      return String(j.error);
    }
    if (j.code !== undefined && !j.result) return fmt(j);
    const result = j.result as Record<string, unknown> | undefined;
    if (result?.code !== undefined && !result.path) return fmt(result);
    return null;
  };
  const errMsg = extractError(json);
  if (errMsg) {
    console.error("[odsay] response error:", errMsg, "raw=", JSON.stringify(json).slice(0, 500));
    throw new Error(`ODsay error: ${errMsg}`);
  }
  const result = json.result as
    | {
        path?: Array<{
          pathType: number;
          info: {
            totalTime: number;
            totalDistance?: number;
            totalWalk?: number;
            payment: number;
            busTransitCount: number;
            subwayTransitCount: number;
            firstStartStation?: string;
            lastEndStation?: string;
          };
          subPath?: Array<{
            trafficType: number;
            startName?: string;
            endName?: string;
            lane?: Array<{ name?: string; busNo?: string }>;
          }>;
        }>;
      }
    | undefined;
  const path = result?.path?.[0];
  if (!path) {
    console.error("[odsay] no path in response. raw=", JSON.stringify(json).slice(0, 500));
    return null;
  }

  const lines: string[] = [];
  for (const sp of path.subPath ?? []) {
    if (sp.trafficType === 3) {
      lines.push("도보");
    } else if (sp.trafficType === 1) {
      const ln = sp.lane?.[0]?.name ?? "지하철";
      lines.push(ln);
    } else if (sp.trafficType === 2) {
      const ln = sp.lane?.[0]?.busNo ?? "버스";
      lines.push(`버스 ${ln}`);
    }
  }

  return {
    totalTimeMin: path.info.totalTime,
    totalDistanceM: path.info.totalDistance ?? 0,
    payment: path.info.payment,
    transferCount: (path.info.busTransitCount ?? 0) + (path.info.subwayTransitCount ?? 0) - 1,
    busTransitCount: path.info.busTransitCount ?? 0,
    subwayTransitCount: path.info.subwayTransitCount ?? 0,
    firstStartStation: path.info.firstStartStation,
    lastEndStation: path.info.lastEndStation,
    pathType: path.pathType,
    summaryLine: lines.join(" → "),
  };
}
