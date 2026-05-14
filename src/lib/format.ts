export function formatManwon(amount: number): string {
  if (!Number.isFinite(amount)) return "-";
  const eok = Math.floor(amount / 10000);
  const man = amount % 10000;
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${man.toLocaleString()}만원`;
}

export function formatDistanceM(meters: number): string {
  if (!Number.isFinite(meters)) return "-";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters)}m`;
}

export function formatDurationSec(seconds: number): string {
  if (!Number.isFinite(seconds)) return "-";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}분`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}시간` : `${h}시간 ${rem}분`;
}

export function formatDurationMin(minutes: number): string {
  return formatDurationSec(minutes * 60);
}

export function formatArea(m2: number): string {
  if (!Number.isFinite(m2)) return "-";
  const pyeong = m2 / 3.305785;
  return `${m2.toFixed(2)}㎡ (${pyeong.toFixed(1)}평)`;
}

export function formatDealDate(year: number, month: number, day: number): string {
  const yy = String(year).padStart(4, "0");
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
