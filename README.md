# Policy Shorts Hunter (MVP scaffold)

웹 대시보드에서:
- RSS/HTML 소스 관리
- Run Now(수집만 / AI Top5 옵션)
- 후보 리스트 및 실행 히스토리 보기

## Quickstart

```bash
pnpm i
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- http://localhost:3000

## Notes

- 현재 스캐폴드는 **Collect-only(토큰 0)** 파이프라인이 동작합니다.
- `mode=ai_rank`는 API/DB 스키마까지는 준비되어 있고, GPT 호출/Top10 랭킹 저장은 TODO로 남겨뒀습니다.
  바이브코딩 단계에서 `app/api/run/route.ts` TODO를 채우면 됩니다.

## RSS sources (seed)
- 정책브리핑: https://www.korea.kr/rss/policy.xml
- 보건복지부: http://www.mohw.go.kr/rss/board.es?mid=a10503000000&bid=0027
- 고용노동부: https://www.moel.go.kr/rss/policy.do
- 매일경제(경제): https://www.mk.co.kr/rss/30100041/
- 한국경제(경제): https://www.hankyung.com/feed/economy
- 동아일보(경제): https://rss.donga.com/economy.xml


## Topic presets
- Dashboard에서 주제를 선택할 수 있습니다(제도/금융/주거/육아).
- 프리셋 키워드는 `prisma/seed.mjs`에 seed되어 있습니다.
