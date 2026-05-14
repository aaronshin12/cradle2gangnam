"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import SearchBar from "@/components/SearchBar";
import ApartmentCard from "@/components/ApartmentCard";
import KakaoMap, { type MapMarker } from "@/components/KakaoMap";
import SettingsModal from "@/components/SettingsModal";
import DetailDrawer from "@/components/DetailDrawer";
import { DEFAULT_DESTINATION, loadDestination, type Destination } from "@/lib/preset";
import type { MolitGroupedAptSummary } from "@/types/molit";
import type { KakaoPlaceDoc } from "@/types/kakao";

type SearchHit = {
  lawdCd: string;
  center: { x: number; y: number };
  label: string;
};

export default function Home() {
  const [destination, setDestination] = useState<Destination>(DEFAULT_DESTINATION);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [hit, setHit] = useState<SearchHit | null>(null);
  const [apartments, setApartments] = useState<MolitGroupedAptSummary[]>([]);
  const [filterKeyword, setFilterKeyword] = useState<string>("");
  const [filteredCoords, setFilteredCoords] = useState<Record<string, { x: number; y: number }>>({});

  const [selectedAptIdx, setSelectedAptIdx] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    setDestination(loadDestination());
  }, []);

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoadingSearch(true);
    setSearchError(null);
    setApartments([]);
    setSelectedAptIdx(null);
    try {
      const [addrRes, kwRes] = await Promise.all([
        fetch(`/api/local/address?query=${encodeURIComponent(q)}`).then((r) => r.json()),
        fetch(`/api/local/keyword?query=${encodeURIComponent(q)}`).then((r) => r.json()),
      ]);

      let lawdCd: string | null = null;
      let center: { x: number; y: number } | null = null;
      let label = q;
      let viaRegion = false;

      if (addrRes.ok && addrRes.documents?.length) {
        const first = addrRes.documents[0];
        if (first.lawdCd) {
          lawdCd = first.lawdCd;
          viaRegion = true;
        }
        center = { x: Number(first.x), y: Number(first.y) };
        label = first.address_name;
      }

      if ((!lawdCd || !center) && kwRes.ok && kwRes.documents?.length) {
        const first = kwRes.documents[0] as KakaoPlaceDoc;
        center = { x: Number(first.x), y: Number(first.y) };
        label = first.place_name;
        if (!lawdCd) {
          const addrByCoord = await fetch(
            `/api/local/address?query=${encodeURIComponent(first.address_name || first.place_name)}`,
          )
            .then((r) => r.json())
            .catch(() => null);
          if (addrByCoord?.ok && addrByCoord.documents?.length) {
            lawdCd = addrByCoord.documents[0].lawdCd ?? null;
          }
        }
      }

      if (!lawdCd || !center) {
        setSearchError("검색 결과를 찾지 못했습니다. 동/구/단지명을 더 명확하게 입력해 주세요.");
        setHit(null);
        return;
      }

      setHit({ lawdCd, center, label });
      setFilterKeyword(viaRegion ? "" : q);

      const apartRes = await fetch(`/api/apartments/search?lawdCd=${lawdCd}`).then((r) => r.json());
      if (apartRes.ok) {
        setApartments(apartRes.apartments as MolitGroupedAptSummary[]);
      } else {
        setSearchError(`매물 조회 실패: ${apartRes.error}`);
      }
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "unknown");
    } finally {
      setLoadingSearch(false);
    }
  }, [query]);

  const visible = useMemo(() => {
    if (!filterKeyword.trim()) return apartments;
    const k = filterKeyword.toLowerCase();
    return apartments.filter((a) => a.aptName.toLowerCase().includes(k));
  }, [apartments, filterKeyword]);

  useEffect(() => {
    let cancelled = false;
    async function geocodeMissing() {
      const want = visible.slice(0, 20).filter((a) => !filteredCoords[a.aptName]);
      if (want.length === 0) return;
      const updates: Record<string, { x: number; y: number }> = {};
      for (const a of want) {
        const q = `${a.aptName}`;
        try {
          const res = await fetch(
            `/api/local/keyword?query=${encodeURIComponent(q)}${hit ? `&x=${hit.center.x}&y=${hit.center.y}&radius=3000` : ""}`,
          ).then((r) => r.json());
          if (res.ok && res.documents?.length) {
            updates[a.aptName] = { x: Number(res.documents[0].x), y: Number(res.documents[0].y) };
          }
        } catch {
          /* ignore */
        }
        if (cancelled) return;
      }
      if (!cancelled && Object.keys(updates).length > 0) {
        setFilteredCoords((prev) => ({ ...prev, ...updates }));
      }
    }
    geocodeMissing();
    return () => {
      cancelled = true;
    };
  }, [visible, hit, filteredCoords]);

  const mapCenter = useMemo(() => hit?.center ?? { x: destination.x, y: destination.y }, [hit, destination]);
  const mapMarkers: MapMarker[] = useMemo(
    () =>
      visible
        .map((a, i) => {
          const c = filteredCoords[a.aptName];
          return c ? { id: String(i), x: c.x, y: c.y, label: a.aptName } : null;
        })
        .filter(Boolean) as MapMarker[],
    [visible, filteredCoords],
  );

  const selectedApt = selectedAptIdx !== null ? visible[selectedAptIdx] : null;
  const selectedCoord = selectedApt ? filteredCoords[selectedApt.aptName] : null;

  return (
    <main className="min-h-screen">
      <header className="mx-auto max-w-7xl px-6 pt-8 pb-4 flex items-end justify-between">
        <div>
          <div className="eyebrow">Cradle 2 Gangnam</div>
          <h1 className="h-display mt-1">아파트 매물 비서</h1>
          <p className="text-[var(--text-2)] mt-1 max-w-md">
            국토교통부 실거래가, 카카오 로컬·지도, ODsay 대중교통, Gemini가 모여 매물을 한눈에.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSettingsOpen(true)} className="btn-glass text-sm">
            기준: {destination.label} ⚙
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pb-12 grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-5">
        <section className="space-y-4">
          <SearchBar value={query} onChange={setQuery} onSubmit={handleSearch} loading={loadingSearch} />

          {hit && (
            <div className="glass-soft px-3 py-2 text-xs text-[var(--text-2)] flex items-center justify-between">
              <span>
                기준 동: <b className="text-[var(--text-1)]">{hit.label}</b>{" "}
                <span className="text-[var(--text-3)]">(LAWD_CD {hit.lawdCd})</span>
              </span>
              <input
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                placeholder="단지명 필터"
                className="bg-white/55 border border-white/60 rounded-lg px-2 py-1 text-xs focus-ring"
              />
            </div>
          )}

          <div className="space-y-3 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
            {loadingSearch && (
              <>
                <div className="skeleton h-28" />
                <div className="skeleton h-28" />
                <div className="skeleton h-28" />
              </>
            )}
            {searchError && (
              <div className="glass-soft p-3 text-sm text-[var(--status-stuck)]">{searchError}</div>
            )}
            {!loadingSearch && !searchError && hit && visible.length === 0 && (
              <div className="glass-soft p-4 text-sm text-[var(--text-2)]">
                최근 3개월 거래가 발견되지 않았습니다. 다른 동/구로 검색해 보세요.
              </div>
            )}
            {!loadingSearch &&
              visible.map((apt, i) => (
                <ApartmentCard
                  key={`${apt.aptName}-${i}`}
                  apt={apt}
                  selected={selectedAptIdx === i}
                  onSelect={() => setSelectedAptIdx(i)}
                  onDetail={() => {
                    setSelectedAptIdx(i);
                    setDetailOpen(true);
                  }}
                />
              ))}
            {!hit && !loadingSearch && (
              <div className="glass p-5">
                <div className="eyebrow mb-2">사용 안내</div>
                <ol className="text-sm space-y-1 list-decimal pl-5 text-[var(--text-2)]">
                  <li>주소(시·구·동) 또는 단지명을 입력해 검색합니다.</li>
                  <li>지도와 리스트에서 매물을 고릅니다.</li>
                  <li>“정보보기”로 강남역까지의 출퇴근, 학군, 편의시설, Gemini 브리핑을 봅니다.</li>
                  <li>우측 상단 “기준” 버튼으로 출퇴근 목적지를 바꿀 수 있어요.</li>
                </ol>
              </div>
            )}
          </div>
        </section>

        <section className="glass overflow-hidden h-[calc(100vh-160px)] min-h-[420px]">
          <KakaoMap
            center={mapCenter}
            markers={mapMarkers}
            onSelect={(id) => setSelectedAptIdx(Number(id))}
            className="w-full h-full"
          />
        </section>
      </div>

      <SettingsModal
        open={settingsOpen}
        current={destination}
        onClose={() => setSettingsOpen(false)}
        onChange={setDestination}
      />

      <DetailDrawer
        open={detailOpen}
        apt={selectedApt}
        coord={selectedCoord}
        destination={destination}
        onClose={() => setDetailOpen(false)}
      />
    </main>
  );
}
