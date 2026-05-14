"use client";
import { useEffect, useRef } from "react";
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

  useEffect(() => {
    function tryInit() {
      const w = window as any;
      if (!w.kakao?.maps?.load) return;
      w.kakao.maps.load(() => {
        if (!containerRef.current || mapRef.current) return;
        const kakao = w.kakao;
        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center.y, center.x),
          level: 4,
        });
        mapRef.current = map;
      });
    }
    tryInit();
    const id = window.setInterval(tryInit, 200);
    return () => window.clearInterval(id);
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

  return (
    <>
      {JS_KEY && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${JS_KEY}&autoload=false&libraries=services`}
          strategy="afterInteractive"
        />
      )}
      <div ref={containerRef} className={className ?? "w-full h-full rounded-2xl overflow-hidden"} />
    </>
  );
}
