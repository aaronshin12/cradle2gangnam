"use client";
import { useMemo } from "react";

function renderMarkdown(src: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const lines = src.split("\n");
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = escape(raw);
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
    if (/^#{1,6}\s+/.test(line)) {
      const level = (line.match(/^#+/)?.[0].length ?? 2);
      const content = line.replace(/^#+\s+/, "");
      out.push(`<h${Math.min(level, 4)}>${inline(content)}</h${Math.min(level, 4)}>`);
    } else if (line.trim() === "") {
      out.push("<br/>");
    } else {
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  if (inList) out.push("</ul>");
  return out.join("");
}

function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

type Props = {
  loading: boolean;
  text: string | null;
  error?: string | null;
};

export default function BriefingPanel({ loading, text, error }: Props) {
  const html = useMemo(() => (text ? renderMarkdown(text) : ""), [text]);
  return (
    <section className="glass p-5">
      <div className="flex items-center justify-between">
        <h4 className="font-bold">비서 브리핑</h4>
        <span className="eyebrow">Gemini 2.5 Flash</span>
      </div>
      <div className="mt-3">
        {loading && (
          <div className="space-y-2">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        )}
        {!loading && error && (
          <div className="text-sm text-[var(--status-stuck)]">브리핑 생성 실패: {error}</div>
        )}
        {!loading && text && (
          <div className="briefing-md" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </section>
  );
}
