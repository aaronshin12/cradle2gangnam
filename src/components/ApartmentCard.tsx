"use client";
import type { MolitGroupedAptSummary } from "@/types/molit";
import { formatManwon } from "@/lib/format";

type Props = {
  apt: MolitGroupedAptSummary;
  selected?: boolean;
  onSelect: () => void;
  onDetail: () => void;
};

export default function ApartmentCard({ apt, selected, onSelect, onDetail }: Props) {
  return (
    <article
      onClick={onSelect}
      className={`glass p-4 cursor-pointer transition-transform ${
        selected ? "ring-1 ring-[var(--primary)]" : "hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold truncate" style={{ fontSize: 16 }}>
            {apt.aptName}
          </h3>
          <p className="text-xs text-[var(--text-3)] mt-0.5 truncate">
            {apt.umdNm} {apt.jibun}
            {apt.buildYear ? ` · ${apt.buildYear}년` : ""}
          </p>
        </div>
        <span className="tag">{apt.totalTrades}건</span>
      </div>

      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
        <span className="text-[var(--text-3)] text-xs">평균</span>
        <span className="font-bold" style={{ fontSize: 18 }}>
          {formatManwon(apt.avgAmount)}
        </span>
        <span className="text-xs text-[var(--text-3)]">
          ({formatManwon(apt.minAmount)} ~ {formatManwon(apt.maxAmount)})
        </span>
      </div>

      <div className="mt-2 text-xs text-[var(--text-3)]">
        전용 {apt.areaRange.min.toFixed(1)} ~ {apt.areaRange.max.toFixed(1)} ㎡ · 최근 거래 {apt.latestDealDate}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDetail();
          }}
          className="btn-primary text-sm"
        >
          정보보기 →
        </button>
      </div>
    </article>
  );
}
