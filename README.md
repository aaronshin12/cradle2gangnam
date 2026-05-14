# Cradle2Gangnam · 아파트 매물 비서

국토교통부 실거래가 + 카카오 로컬/지도/모빌리티 + ODsay 대중교통 + Google Gemini를 묶어,
**주소·단지명 검색 → 매물 선택 → 강남역(또는 지정 목적지)까지의 출퇴근·학군·생활편의 → Gemini 비서 브리핑** 을 한 화면에서 제공하는 Next.js 웹앱.

> 디자인 톤: **Forest Editorial** 색상 + **Glassmorphism** 질감 (Pretendard).

---

## 사용한 4종 API

| 제공처 | 용도 | 인증 |
| --- | --- | --- |
| 공공데이터포털 (국토교통부) | 아파트매매 실거래가 상세 자료 (`RTMSDataSvcAptTradeDev`, XML) | `DATA_GO_KR_SERVICE_KEY` |
| 카카오 디벨로퍼스 | 로컬(주소·키워드·카테고리), 카카오맵 JS SDK, 카카오모빌리티 길찾기 | `KAKAO_REST_API_KEY`, `NEXT_PUBLIC_KAKAO_JS_KEY` |
| Google AI Studio | Gemini (`gemini-2.5-flash`) — 비서 브리핑 생성 | `GEMINI_API_KEY` |
| ODsay LAB | 대중교통 길찾기 (`searchPubTransPathT`) | `ODSAY_API_KEY` |

---

## 환경변수

`.env.local` 파일에 다음 5개를 채워주세요. 로컬 개발 외 Vercel 배포 시 동일 항목을 Vercel 환경변수에 등록해야 합니다.

```env
DATA_GO_KR_SERVICE_KEY=         # 공공데이터포털 (Decoding 키 권장)
KAKAO_REST_API_KEY=             # 카카오 REST API 키 (서버 전용)
NEXT_PUBLIC_KAKAO_JS_KEY=       # 카카오 JavaScript 키 (지도 SDK용, 클라이언트 노출)
GEMINI_API_KEY=                 # Google Gemini API 키
ODSAY_API_KEY=                  # ODsay LAB API 키
```

`.env.local`은 `.gitignore`에 등록되어 있어 절대 저장소에 올라가지 않습니다.

### 카카오 콘솔에서 추가 설정

1. **앱 설정 → 플랫폼 → Web** 도메인에 다음을 등록:
   - 로컬: `http://localhost:3000`, `http://localhost`
   - 배포: `https://<your-vercel-domain>` (배포 후 추가)

---

## 로컬 실행

```bash
pnpm install   # 또는 npm install / yarn
pnpm dev       # http://localhost:3000
```

빌드 검증:

```bash
pnpm build
pnpm start
```

타입 체크:

```bash
pnpm typecheck
```

---

## API 라우트 (서버 사이드)

브라우저는 외부 API 키를 절대 만지지 않습니다. 모든 외부 호출은 다음 라우트를 경유합니다.

| 라우트 | 메서드 | 역할 |
| --- | --- | --- |
| `/api/apartments/search` | GET | 국토부 RTMS XML → 단지별 거래 요약 |
| `/api/local/address` | GET | 카카오 주소 검색 + `b_code` 앞 5자리(`lawdCd`) 추출 |
| `/api/local/keyword` | GET | 카카오 키워드 검색 |
| `/api/local/nearby` | GET | 카카오 카테고리(학교/지하철/마트/편의점/병원/약국/은행/음식점/카페) + 키워드(공원/학원) 병렬 호출 |
| `/api/route/car` | POST | 카카오모빌리티 자동차 길찾기 |
| `/api/route/transit` | POST | ODsay 대중교통 길찾기 |
| `/api/briefing` | POST | Gemini로 비서 톤 브리핑 생성 |

샘플 호출:

```bash
curl 'http://localhost:3000/api/apartments/search?lawdCd=11680'
curl 'http://localhost:3000/api/local/nearby?x=127.0276&y=37.4979'
```

---

## 디렉터리 구조

```
src/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   └── api/
│       ├── apartments/search/route.ts
│       ├── local/{address,keyword,nearby}/route.ts
│       ├── route/{car,transit}/route.ts
│       └── briefing/route.ts
├── components/
│   ├── SearchBar.tsx, ApartmentCard.tsx
│   ├── KakaoMap.tsx
│   ├── RouteSummary.tsx, NearbyList.tsx
│   ├── BriefingPanel.tsx
│   ├── DetailDrawer.tsx, SettingsModal.tsx
├── lib/
│   ├── env.ts, format.ts, lawd.ts, preset.ts
│   ├── molit.ts, kakao.ts, odsay.ts, gemini.ts
└── types/
    ├── molit.ts, kakao.ts, briefing.ts
```

---

## Vercel 배포

1. 이 저장소를 GitHub에 푸시
2. [vercel.com](https://vercel.com) 대시보드 → **Add New → Project** → 이 저장소 import
3. **Environment Variables** 섹션에 `.env.local`의 5개 키 등록 (Production/Preview/Development 모두)
4. **Deploy**
5. 배포 후 받은 도메인을 카카오 디벨로퍼스 콘솔의 **Web 플랫폼 도메인**에 추가

> 빌드 명령은 기본값(`pnpm install && pnpm build`)으로 충분합니다. 별도 설정 없음.

---

## MVP 범위 밖 (Next)

- 거래내역 차트, 평형별 시세 그래프
- 즐겨찾기, 사용자별 프리셋 동기화
- 모바일 PWA / 오프라인 캐싱
- 다국어 / 다크 모드
