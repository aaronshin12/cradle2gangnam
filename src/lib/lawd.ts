export function bCodeToLawdCd(bCode: string | undefined | null): string | null {
  if (!bCode) return null;
  const trimmed = String(bCode).trim();
  if (trimmed.length < 5) return null;
  return trimmed.slice(0, 5);
}

export function recentYmds(months = 3, now = new Date()): string[] {
  const out: string[] = [];
  const y = now.getFullYear();
  const m = now.getMonth();
  for (let i = 0; i < months; i++) {
    const d = new Date(y, m - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    out.push(`${yyyy}${mm}`);
  }
  return out;
}
