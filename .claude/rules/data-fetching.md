---
paths:
  - "src/**/api/**"
  - "src/**/model/**"
  - "src/app/api/**"
  - "src/shared/lib/supabase/**"
---

## 데이터 경계: 서버 vs 클라이언트

| 질문 | 서버 (RSC) | 클라이언트 |
|------|:---:|:---:|
| 초기 렌더링에 필요한가? | O | |
| SEO/크롤러가 인식해야 하는가? | O | |
| 사용자 인터랙션 후 변경되는가? | | O |
| 실시간 업데이트가 필요한가? | | O |

## 서버 데이터 페칭 (RSC)

- `async` 서버 컴포넌트에서 Supabase 서버 클라이언트(`server.ts`)로 직접 조회
- 관리자 권한 필요 시: `admin.ts` (서버 전용, RLS 우회)

## FSD api 세그먼트

- 데이터 접근 함수: 슬라이스 `api/` 세그먼트에 정의
- 함수명: `get` / `create` / `update` / `delete` + 리소스명
- 서버 컴포넌트와 Server Actions 양쪽에서 동일 함수 재사용

## Mutation (Server Actions)

- 데이터 변경은 `"use server"` Server Actions으로 처리
- Server Actions는 `features/*/api/` 세그먼트에 정의
- 캐시 무효화 API:

| API | 사용 위치 | 동작 | 용도 |
|-----|----------|------|------|
| `updateTag('tag')` | Server Actions 전용 | 즉시 만료 | 변경 결과를 즉시 봐야 할 때 |
| `revalidateTag('tag', 'max')` | Actions + Route Handler | SWR | 백그라운드 갱신 허용 시 |
| `revalidatePath('/path')` | Actions + Route Handler | 경로 전체 무효화 | 태그 없이 경로 단위 갱신 |
| `refresh()` | Server Actions 전용 | 비캐시만 새로고침 | 동적 데이터 갱신 |

## 클라이언트 데이터 페칭

- 실시간/폴링 등 클라이언트에서만 가능한 경우에 한해 사용
- Supabase 브라우저 클라이언트: `client.ts`
- Realtime 구독은 `useEffect` 내에서 설정/해제

## API 응답 타입

- Supabase 자동 생성 타입: `src/shared/types/supabase.ts`
- 커스텀 타입은 슬라이스 `api/` 세그먼트에 co-locate

## 데이터베이스 규칙

- 테이블 명명: snake_case 복수형 (예: `reminders`, `alarm_schedules`)
- RLS: 모든 테이블에 기본 활성화
- 타입 생성: `pnpm supabase gen types typescript --project-id <id> > src/shared/types/supabase.ts`

## 에러 처리

- Supabase `error` 항상 확인 — 무시 금지
- RSC 에러: `throw` → `error.tsx` 처리
- Server Actions 에러: 호출부에서 처리 (toast, 에러 상태)
