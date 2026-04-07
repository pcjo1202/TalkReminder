# shared

프로젝트 전체에서 공유하는 UI, 유틸리티, 타입, 훅.

## 세그먼트

| 세그먼트 | 역할 |
|----------|------|
| `ui/` | shadcn/ui 컴포넌트 (`pnpm dlx shadcn@latest add`로 추가). 커스터마이징 시 원본 직접 수정 |
| `lib/` | 공용 유틸리티 함수, Supabase 클라이언트 (`supabase/server.ts`, `supabase/client.ts`, `supabase/admin.ts`) |
| `hooks/` | 공용 커스텀 훅 (`use-<name>.ts`) |
| `types/` | 공용 타입 정의, Supabase 자동 생성 타입 (`supabase.ts`) |

## 규칙

- `"use client"`는 인터랙티브 UI 프리미티브(`ui/`)에서만 필요 시 허용
- 모든 레이어에서 import 가능 — shared는 다른 레이어를 import하지 않음
- 2개 이상 슬라이스에서 사용되는 모듈만 shared에 배치 (1개 슬라이스 전용이면 해당 슬라이스 내부에)
- 조건부 className은 반드시 `cn()` 유틸 사용
