export type MolitTrade = {
  aptName: string;
  aptSeq?: string;
  umdNm?: string;
  jibun?: string;
  dealAmount: number;
  excluUseArea: number;
  floor?: number;
  buildYear?: number;
  dealYear: number;
  dealMonth: number;
  dealDay: number;
  roadName?: string;
};

export type MolitGroupedAptSummary = {
  aptName: string;
  aptSeq?: string;
  umdNm?: string;
  jibun?: string;
  roadName?: string;
  buildYear?: number;
  trades: MolitTrade[];
  latestDealDate: string;
  avgAmount: number;
  minAmount: number;
  maxAmount: number;
  totalTrades: number;
  areaRange: { min: number; max: number };
};
