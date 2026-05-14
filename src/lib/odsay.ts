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
  u.searchParams.set("SX", String(sx));
  u.searchParams.set("SY", String(sy));
  u.searchParams.set("EX", String(ex));
  u.searchParams.set("EY", String(ey));
  u.searchParams.set("OPT", "0");
  u.searchParams.set("SearchType", "0");
  u.searchParams.set("SearchPathType", "0");

  const res = await fetch(u, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`ODsay failed: ${res.status}`);
  const json = (await res.json()) as {
    result?: {
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
    };
    error?: { code?: string; message?: string };
  };
  if (json.error) {
    throw new Error(`ODsay error: ${json.error.code} ${json.error.message ?? ""}`);
  }
  const path = json.result?.path?.[0];
  if (!path) return null;

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
