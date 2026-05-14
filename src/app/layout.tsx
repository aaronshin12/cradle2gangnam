import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cradle2Gangnam · 아파트 매물 비서",
  description: "주소를 검색하고 강남역까지의 출퇴근·학군·생활편의를 한눈에. Gemini가 비서처럼 정리해드립니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        <div className="scene" aria-hidden />
        {children}
      </body>
    </html>
  );
}
