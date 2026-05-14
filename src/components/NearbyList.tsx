"use client";
import type { NearbyCategoryResult } from "@/types/kakao";

export default function NearbyList({ nearby }: { nearby: NearbyCategoryResult[] }) {
  const groups = nearby.filter((c) => c.items.length > 0);
  if (groups.length === 0) {
    return <div className="text-sm text-[var(--text-3)]">주변 정보를 찾을 수 없습니다.</div>;
  }
  return (
    <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {groups.map((c) => (
        <div key={c.groupCode} className="glass-soft p-3">
          <div className="flex items-baseline justify-between">
            <h5 className="font-bold text-sm">{c.label}</h5>
            <span className="text-xs text-[var(--text-3)]">{c.items.length}곳</span>
          </div>
          <ul className="mt-1.5 space-y-1">
            {c.items.slice(0, 4).map((p) => (
              <li key={p.id} className="text-xs truncate">
                <span className="text-[var(--text-1)] font-medium">{p.place_name}</span>
                {p.distance && (
                  <span className="ml-1 text-[var(--text-3)]">· {Number(p.distance)}m</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
