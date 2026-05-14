export type Destination = { label: string; x: number; y: number };

export const DEFAULT_DESTINATION: Destination = {
  label: "강남역",
  x: 127.027583,
  y: 37.497952,
};

const KEY = "c2g.destination.v1";

export function loadDestination(): Destination {
  if (typeof window === "undefined") return DEFAULT_DESTINATION;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_DESTINATION;
    const v = JSON.parse(raw) as Partial<Destination>;
    if (
      typeof v.label === "string" &&
      typeof v.x === "number" &&
      typeof v.y === "number" &&
      Number.isFinite(v.x) &&
      Number.isFinite(v.y)
    ) {
      return v as Destination;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_DESTINATION;
}

export function saveDestination(d: Destination): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(d));
}
