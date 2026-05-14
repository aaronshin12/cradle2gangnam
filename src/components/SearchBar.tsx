"use client";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading?: boolean;
};

export default function SearchBar({ value, onChange, onSubmit, loading }: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="glass glass-strong p-2 flex items-center gap-2"
    >
      <span aria-hidden className="pl-2 text-[var(--text-3)]">⌕</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="주소 · 동 · 단지명 (예: 강남구 역삼동, 은마아파트)"
        className="flex-1 bg-transparent px-1 py-2 outline-none placeholder:text-[var(--text-3)]"
      />
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "검색중…" : "검색"}
      </button>
    </form>
  );
}
