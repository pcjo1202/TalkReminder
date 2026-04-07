# entities

도메인 모델의 표시 전용 UI 레이어.

## 규칙

- `"use client"` **금지** — 순수 서버 컴포넌트만 허용
- `onClick`, `onChange`, `useState`, `useEffect` 등 인터랙션/상태 훅 금지
- props만으로 데이터를 받아 표시하는 역할
- 데이터 접근 함수는 `api/` 세그먼트에 정의 (`get-*`, `create-*` 등)
- 외부 공개는 `index.ts`를 통해서만 — `export *` 금지, 명시적 named re-export

## 구조

```
entities/<도메인>/
├── api/       # Supabase 쿼리 함수
├── ui/        # 표시 전용 컴포넌트
└── index.ts   # Public API
```

## 의존 가능 레이어

- `shared` 만 import 가능
