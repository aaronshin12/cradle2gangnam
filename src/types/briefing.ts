import type { KakaoCarDirectionsResult } from "@/lib/kakao";
import type { OdsayTransitResult } from "@/lib/odsay";
import type { MolitGroupedAptSummary } from "./molit";
import type { NearbyCategoryResult } from "./kakao";

export type BriefingInput = {
  apt: MolitGroupedAptSummary;
  destination: { label: string; x: number; y: number };
  car?: KakaoCarDirectionsResult | null;
  transit?: OdsayTransitResult | null;
  nearby: NearbyCategoryResult[];
};

export type DetailPayload = {
  apt: MolitGroupedAptSummary;
  coord: { x: number; y: number };
  destination: { label: string; x: number; y: number };
  car: { ok: boolean; data?: KakaoCarDirectionsResult; error?: string };
  transit: { ok: boolean; data?: OdsayTransitResult | null; error?: string };
  nearby: { ok: boolean; data?: NearbyCategoryResult[]; error?: string };
};
