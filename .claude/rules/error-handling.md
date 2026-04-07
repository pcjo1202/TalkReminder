---
paths:
  - "src/app/**/error.tsx"
  - "src/app/**/not-found.tsx"
  - "src/app/**/global-error.tsx"
  - "src/app/**/loading.tsx"
  - "src/**/api/**"
---

## Next.js App Router 에러 페이지

| 파일 | 역할 | 비고 |
|------|------|------|
| `error.tsx` | 라우트 세그먼트 에러 경계 | `"use client"` 필수, `reset` prop으로 재시도 |
| `not-found.tsx` | 404 페이지 | `notFound()` 호출 시 렌더링 |
| `global-error.tsx` | root layout 에러 경계 | `<html>`, `<body>` 직접 렌더링 필요. production에서만 동작 |
| `loading.tsx` | Suspense fallback | 스트리밍 SSR 로딩 UI |

- `error.tsx`는 같은 세그먼트의 `layout.tsx` 에러는 잡지 못함 — 부모 세그먼트의 `error.tsx`가 처리
- 핵심 라우트(`/dashboard`, `/reminders`)에는 `error.tsx` 배치 권장
- `error.digest`: 서버 에러의 해시값. 에러 추적에 사용하되, 원본 메시지는 클라이언트에 노출 금지
- `error.tsx` 내 `useEffect`로 에러 로깅 서비스(Sentry 등) 연동 권장

## 에러 경계 격리

- Client Components 내 에러가 전체 페이지를 깨뜨리지 않도록 세그먼트별 `error.tsx` 배치
- fallback UI는 해당 영역 크기를 유지하여 CLS 방지
- `reset()` 호출로 에러 복구 시도 제공

## Server Actions 에러 처리

- Server Actions에서 `throw`하면 클라이언트의 가장 가까운 `error.tsx`가 처리
- 사용자 피드백이 필요한 에러(유효성 검증 등)는 `throw` 대신 에러 객체 반환

```ts
// 검증 에러 — 반환
export async function createReminder(formData: FormData) {
  const result = validate(formData)
  if (!result.success) return { error: result.error.message }
  // ...
}

// 시스템 에러 — throw (error.tsx가 처리)
export async function createReminder(formData: FormData) {
  const { error } = await supabase.from("reminders").insert(data)
  if (error) throw error
}
```

## 일반 원칙

- catch 블록에서 에러를 무시하지 말 것 (빈 catch 금지)
- 에러 로깅 시 원본 에러 객체 보존 (`cause` 체이닝 활용)
- RSC에서 데이터 페칭 실패 시 에러를 삼키지 말 것 — `throw`로 `error.tsx` 위임
