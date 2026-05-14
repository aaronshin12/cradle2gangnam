"use client";
import type { KakaoCarDirectionsResult } from "@/lib/kakao";
import type { OdsayTransitResult } from "@/lib/odsay";
import { formatDistanceM, formatDurationSec, formatDurationMin } from "@/lib/format";

type Props = {
  destLabel: string;
  car: { ok: boolean; data?: KakaoCarDirectionsResult; error?: string };
  transit: { ok: boolean; data?: OdsayTransitResult | null; error?: string };
};

export default function RouteSummary({ destLabel, car, transit }: Props) {
  return (
    <section className="glass-soft p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold">출퇴근</h4>
        <span className="tag tag-neutral">→ {destLabel}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="rounded-xl bg-white/55 border border-white/60 p-3">
          <div className="eyebrow mb-1">자가용</div>
          {car.ok && car.data ? (
            <>
              <div className="font-bold text-[var(--primary-hover)]" style={{ fontSize: 20 }}>
                {formatDurationSec(car.data.durationSec)}
              </div>
              <div className="text-xs text-[var(--text-3)] mt-0.5">
                {formatDistanceM(car.data.distanceM)}
                {car.data.tollFare ? ` · 통행료 ${car.data.tollFare.toLocaleString()}원` : ""}
              </div>
            </>
          ) : (
            <div className="text-sm text-[var(--text-3)]">
              정보 없음
              {car.error && <div className="text-[10px] text-[var(--status-stuck)] mt-0.5 truncate" title={car.error}>{car.error}</div>}
            </div>
          )}
        </div>
        <div className="rounded-xl bg-white/55 border border-white/60 p-3">
          <div className="eyebrow mb-1">대중교통</div>
          {transit.ok && transit.data ? (
            <>
              <div className="font-bold text-[var(--primary-hover)]" style={{ fontSize: 20 }}>
                {formatDurationMin(transit.data.totalTimeMin)}
              </div>
              <div className="text-xs text-[var(--text-3)] mt-0.5 truncate">
                환승 {transit.data.transferCount < 0 ? 0 : transit.data.transferCount}회 · {transit.data.summaryLine}
              </div>
            </>
          ) : (
            <div className="text-sm text-[var(--text-3)]">
              정보 없음
              {transit.error && <div className="text-[10px] text-[var(--status-stuck)] mt-0.5 truncate" title={transit.error}>{transit.error}</div>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
