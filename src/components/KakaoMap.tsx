"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export type MapMarker = {
  id: string;
  x: number;
  y: number;
  label?: string;
  highlight?: boolean;
};

type Props = {
  center: { x: number; y: number };
  markers: MapMarker[];
  onSelect?: (id: string) => void;
  className?: string;
};

const JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

export default function KakaoMap({ center, markers, onSelect, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerObjsRef = useRef<any[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "no-key" | "sdk-failed" | "domain-blocked">(
    JS_KEY ? "loading" : "no-key",
  );

  useEffect(() => {
    if (!JS_KEY) return;
    let cancelled = false;
    const start = Date.now();

    function tryInit() {
      if (cancelled) return;
      const w = window as any;
      if (!w.kakao?.maps?.load) {
        if (Date.now() - start > 8000) {
          console.error("[KakaoMap] SDK did not load within 8s. Check (1) ad-blocker blocking dapi.kakao.com, (2) network, (3) Kakao Developers > 앱 설정 > 플랫폼 > Web 사이트 도메인 등록 여부 (현재 호스트:", window.location.host, ")");
          setStatus("sdk-failed");
          window.clearInterval(id);
        }
        return;
      }
      w.kakao.maps.load(() => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        try {
          const kakao = w.kakao;
          const map = new kakao.maps.Map(containerRef.current, {
            center: new kakao.maps.LatLng(center.y, center.x),
            level: 4,
          });
          mapRef.current = map;
          setStatus("ready");
          window.clearInterval(id);
        } catch (e) {
          console.error("[KakaoMap] map init failed (likely domain not whitelisted):", e);
          setStatus("domain-blocked");
          window.clearInterval(id);
        }
      });
    }
    tryInit();
    const id = window.setInterval(tryInit, 200);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [center.x, center.y]);

  useEffect(() => {
    const w = window as any;
    if (!mapRef.current || !w.kakao?.maps) return;
    const kakao = w.kakao;
    mapRef.current.setCenter(new kakao.maps.LatLng(center.y, center.x));
  }, [center.x, center.y]);

  useEffect(() => {
    const w = window as any;
    if (!mapRef.current || !w.kakao?.maps) return;
    const kakao = w.kakao;
    for (const m of markerObjsRef.current) m.setMap(null);
    markerObjsRef.current = [];
    for (const m of markers) {
      const pos = new kakao.maps.LatLng(m.y, m.x);
      const marker = new kakao.maps.Marker({
        position: pos,
        map: mapRef.current,
        title: m.label,
      });
      if (onSelect) {
        kakao.maps.event.addListener(marker, "click", () => onSelect(m.id));
      }
      markerObjsRef.current.push(marker);
    }
  }, [markers, onSelect]);

  const overlay = (() => {
    if (status === "ready" || status === "loading") return null;
    const msg = {
      "no-key": "지도 키(NEXT_PUBLIC_KAKAO_JS_KEY)가 설정되지 않았습니다.",
      "sdk-failed":
        "카카오 지도 SDK 로드 실패. 광고/추적 차단 확장프로그램을 끄거나, 카카오 디벨로퍼스 콘솔에서 현재 호스트를 사이트 도메인에 등록했는지 확인해 주세요.",
      "domain-blocked":
        "카카오 지도 초기화 실패. 현재 도메인이 카카오 디벨로퍼스 사이트 도메인 화이트리스트에 등록됐는지 확인해 주세요.",
    }[status];
    return (
      <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
        <div className="glass-soft p-4 text-sm text-[var(--text-2)] max-w-sm">{msg}</div>
      </div>
    );
  })();

  return (
    <>
      {JS_KEY && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${JS_KEY}&autoload=false&libraries=services`}
          strategy="afterInteractive"
          onError={(e) => {
            console.error("[KakaoMap] <Script> failed to load:", e);
            setStatus("sdk-failed");
          }}
        />
      )}
      <div className="relative w-full h-full">
        <div ref={containerRef} className={className ?? "w-full h-full rounded-2xl overflow-hidden"} />
        {overlay}
      </div>
    </>
  );
}
