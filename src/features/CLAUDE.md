# features

사용자 인터랙션 기능 단위. `"use client"` 경계가 시작되는 레이어.

## 규칙

- `"use client"` **허용** — 인터랙션의 시작점
- Server Actions(`"use server"`)는 `api/` 세그먼트에 정의
- 하나의 feature = 하나의 사용자 행동 (예: 로그인, 리마인더 생성, 채널 토글)
- 외부 공개는 `index.ts`를 통해서만 — `export *` 금지, 명시적 named re-export

## 구조

```
features/<기능명>/
├── api/       # Server Actions, mutation 함수
├── ui/        # 인터랙티브 컴포넌트 ("use client")
├── model/     # 상태 관리, 유효성 검증 로직 (선택)
└── index.ts   # Public API
```

## 의존 가능 레이어

- `entities`, `shared` import 가능
- 다른 `features` import 금지
