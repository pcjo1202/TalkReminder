---
paths:
  - "src/proxy.ts"
  - "src/app/api/**"
  - "src/**/api/**"
  - "src/shared/lib/supabase/**"
  - "next.config.ts"
  - ".env*"
---

## CSP (Content Security Policy)

- nonce 기반 strict CSP 적용 — `proxy.ts` 또는 `next.config.ts` headers에서 설정
- 배포 전 `Content-Security-Policy-Report-Only`로 테스트 필수
- `object-src 'none'`, `base-uri 'none'` 필수

## XSS 방어

- 사용자 입력/외부 데이터를 HTML에 삽입 시 반드시 이스케이프
- `dangerouslySetInnerHTML` 사용 시 신뢰할 수 있는 소스만 허용 — 사용 전 DOMPurify 등으로 sanitize
- `innerHTML` 직접 사용 금지

## 환경 변수 보안

- `NEXT_PUBLIC_` 접두사가 없는 변수는 서버에서만 접근 가능 — 클라이언트 코드에서 참조 금지
- 시크릿 키(`SUPABASE_SECRET_KEY`, `BETTER_AUTH_SECRET` 등)는 절대 클라이언트에 노출 금지
- `.env.local`은 `.gitignore`에 포함 확인

## Server Actions 보안

- Server Actions는 공개 HTTP 엔드포인트로 동작 — 항상 인증/인가 검증 필수
- 사용자 입력은 Server Actions 내에서 반드시 검증 (클라이언트 검증만 의존 금지)
- 민감한 데이터는 hidden input이나 closure가 아닌 서버 세션에서 조회

## Supabase RLS

- 모든 테이블에 RLS 활성화 필수
- `admin.ts` (SERVICE_ROLE_KEY)는 RLS를 우회하므로 서버 전용 + 최소 범위로 사용
- 브라우저 클라이언트(`client.ts`)는 항상 RLS 정책 하에서 동작
