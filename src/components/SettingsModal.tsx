"use client";
import { useEffect, useState } from "react";
import type { KakaoPlaceDoc } from "@/types/kakao";
import { DEFAULT_DESTINATION, type Destination, saveDestination } from "@/lib/preset";

type Props = {
  open: boolean;
  current: Destination;
  onClose: () => void;
  onChange: (d: Destination) => void;
};

export default function SettingsModal({ open, current, onClose, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KakaoPlaceDoc[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/local/keyword?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.ok) setResults(data.documents as KakaoPlaceDoc[]);
    } finally {
      setLoading(false);
    }
  }

  function pick(p: KakaoPlaceDoc) {
    const d: Destination = { label: p.place_name, x: Number(p.x), y: Number(p.y) };
    saveDestination(d);
    onChange(d);
    onClose();
  }

  function resetDefault() {
    saveDestination(DEFAULT_DESTINATION);
    onChange(DEFAULT_DESTINATION);
    onClose();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className="glass glass-strong relative max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between">
          <h2 className="h-display" style={{ fontSize: 22 }}>
            기준 목적지
          </h2>
          <button className="text-sm text-[var(--text-3)] hover:text-[var(--text-1)]" onClick={onClose}>
            닫기
          </button>
        </div>
        <p className="text-[var(--text-2)] text-sm mt-1">
          매물에서 이 지점까지의 자가용/대중교통 소요시간을 계산합니다.
        </p>
        <div className="mt-3 text-sm">
          현재: <b>{current.label}</b>
          <span className="ml-2 text-[var(--text-3)]">
            ({current.x.toFixed(4)}, {current.y.toFixed(4)})
          </span>
        </div>

        <form className="mt-4 flex gap-2" onSubmit={search}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="장소 검색 (예: 광화문역, 판교역)"
            className="flex-1 px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus-ring"
          />
          <button type="submit" className="btn-primary">
            검색
          </button>
        </form>

        <div className="mt-3 max-h-64 overflow-auto space-y-2">
          {loading && <div className="skeleton h-12" />}
          {!loading &&
            results.map((p) => (
              <button
                key={p.id}
                onClick={() => pick(p)}
                className="block w-full text-left glass-soft p-3 hover:bg-white/70 transition-colors"
              >
                <div className="font-semibold">{p.place_name}</div>
                <div className="text-xs text-[var(--text-3)] mt-0.5">
                  {p.road_address_name || p.address_name}
                </div>
              </button>
            ))}
        </div>

        <div className="divider-soft my-4" />
        <button onClick={resetDefault} className="btn-glass text-sm">
          강남역 기본값으로 되돌리기
        </button>
      </div>
    </div>
  );
}
