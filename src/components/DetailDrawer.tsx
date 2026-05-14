"use client";
import { useEffect, useState } from "react";
import type { MolitGroupedAptSummary } from "@/types/molit";
import type { Destination } from "@/lib/preset";
import type { KakaoCarDirectionsResult } from "@/lib/kakao";
import type { OdsayTransitResult } from "@/lib/odsay";
import type { NearbyCategoryResult } from "@/types/kakao";
import { formatManwon, formatDealDate, formatArea } from "@/lib/format";
import RouteSummary from "./RouteSummary";
import NearbyList from "./NearbyList";
import BriefingPanel from "./BriefingPanel";

type Props = {
  open: boolean;
  apt: MolitGroupedAptSummary | null;
  coord: { x: number; y: number } | null;
  destination: Destination;
  onClose: () => void;
};

type Section<T> = { ok: boolean; data?: T; error?: string };

export default function DetailDrawer({ open, apt, coord, destination, onClose }: Props) {
  const [car, setCar] = useState<Section<KakaoCarDirectionsResult>>({ ok: false });
  const [transit, setTransit] = useState<Section<OdsayTransitResult | null>>({ ok: false });
  const [nearby, setNearby] = useState<Section<NearbyCategoryResult[]>>({ ok: false });
  const [briefing, setBriefing] = useState<{ loading: boolean; text: string | null; error?: string }>({
    loading: false,
    text: null,
  });

  useEffect(() => {
    if (!open || !apt || !coord) return;
    setCar({ ok: false });
    setTransit({ ok: false });
    setNearby({ ok: false });
    setBriefing({ loading: true, text: null });

    const carP = fetch("/api/route/car", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: { x: coord.x, y: coord.y },
        destination: { x: destination.x, y: destination.y },
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        setCar(d.ok ? { ok: true, data: d.data } : { ok: false, error: d.error });
        return d.ok ? (d.data as KakaoCarDirectionsResult) : null;
      })
      .catch((e: Error) => {
        setCar({ ok: false, error: e.message });
        return null;
      });

    const transitP = fetch("/api/route/transit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sx: coord.x, sy: coord.y, ex: destination.x, ey: destination.y }),
    })
      .then((r) => r.json())
      .then((d) => {
        setTransit(d.ok ? { ok: true, data: d.data } : { ok: false, error: d.error });
        return d.ok ? (d.data as OdsayTransitResult | null) : null;
      })
      .catch((e: Error) => {
        setTransit({ ok: false, error: e.message });
        return null;
      });

    const nearbyP = fetch(`/api/local/nearby?x=${coord.x}&y=${coord.y}&radius=1000`)
      .then((r) => r.json())
      .then((d) => {
        setNearby(d.ok ? { ok: true, data: d.nearby } : { ok: false, error: d.error });
        return d.ok ? (d.nearby as NearbyCategoryResult[]) : [];
      })
      .catch((e: Error) => {
        setNearby({ ok: false, error: e.message });
        return [] as NearbyCategoryResult[];
      });

    Promise.all([carP, transitP, nearbyP]).then(async ([carRes, transitRes, nearbyRes]) => {
      try {
        const res = await fetch("/api/briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apt,
            destination,
            car: carRes,
            transit: transitRes,
            nearby: nearbyRes,
          }),
        });
        const json = await res.json();
        if (json.ok) setBriefing({ loading: false, text: json.text });
        else setBriefing({ loading: false, text: null, error: json.error });
      } catch (e) {
        setBriefing({
          loading: false,
          text: null,
          error: e instanceof Error ? e.message : "unknown",
        });
      }
    });
  }, [open, apt, coord, destination]);

  if (!open || !apt) return null;
  const hasCoord = Boolean(coord);
  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/15 backdrop-blur-[2px]" />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="relative h-full w-full max-w-xl glass glass-strong overflow-y-auto"
        style={{ borderRadius: 0 }}
      >
        <header className="sticky top-0 z-10 px-5 py-4 glass-strong border-b border-white/40 flex items-start justify-between">
          <div>
            <div className="eyebrow">매물 상세 · 비서 브리핑</div>
            <h2 className="h-display mt-1" style={{ fontSize: 24 }}>
              {apt.aptName}
            </h2>
            <p className="text-sm text-[var(--text-2)] mt-1">
              {apt.umdNm} {apt.jibun}
              {apt.roadName ? ` · ${apt.roadName}` : ""}
              {apt.buildYear ? ` · ${apt.buildYear}년 준공` : ""}
            </p>
          </div>
          <button onClick={onClose} className="btn-glass text-sm">
            닫기
          </button>
        </header>

        <div className="p-5 space-y-5">
          {!hasCoord && (
            <div className="glass-soft p-3 text-sm text-[var(--text-2)]">
              단지 위치를 확인 중입니다… 잠시 후 자가용/대중교통/주변 정보가 채워집니다.
            </div>
          )}
          <section className="glass-soft p-4">
            <h4 className="font-bold mb-2">최근 거래</h4>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Stat label="평균" value={formatManwon(apt.avgAmount)} />
              <Stat label="최저" value={formatManwon(apt.minAmount)} />
              <Stat label="최고" value={formatManwon(apt.maxAmount)} />
            </div>
            <ul className="text-sm divide-y divide-white/40">
              {apt.trades.slice(0, 6).map((t, i) => (
                <li key={i} className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-[var(--text-3)]">
                    {formatDealDate(t.dealYear, t.dealMonth, t.dealDay)}
                  </span>
                  <span className="text-[var(--text-2)] text-xs truncate">
                    {formatArea(t.excluUseArea)} {t.floor ? `· ${t.floor}층` : ""}
                  </span>
                  <span className="font-semibold">{formatManwon(t.dealAmount)}</span>
                </li>
              ))}
            </ul>
          </section>

          <RouteSummary destLabel={destination.label} car={car} transit={transit} />

          <section>
            <h4 className="font-bold mb-2">주변 정보 (반경 1km)</h4>
            {nearby.ok && nearby.data ? (
              <NearbyList nearby={nearby.data} />
            ) : (
              <div className="text-sm text-[var(--text-3)]">정보 없음</div>
            )}
          </section>

          <BriefingPanel loading={briefing.loading} text={briefing.text} error={briefing.error} />
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/55 border border-white/60 p-2.5">
      <div className="eyebrow">{label}</div>
      <div className="font-bold mt-1" style={{ fontSize: 15 }}>
        {value}
      </div>
    </div>
  );
}
