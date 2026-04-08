# 카카오톡 로그인 추가 설계

## 개요

Talk Reminder 프로젝트에 카카오톡 소셜 로그인을 추가한다. better-auth 내장 kakao 프로바이더를 사용하여 기존 Google/GitHub 패턴과 동일하게 구현한다.

## 배경

- 현재 Google(필수), GitHub(조건부) 소셜 로그인이 구현되어 있음
- better-auth 1.4.18에 kakao 프로바이더가 내장되어 있음
- 향후 카카오톡 채널/메시지 발송 기능 확장을 고려하되, 이번 스코프는 로그인만

## 스코프

- 카카오 로그인 구현 (기본 정보: 닉네임, 프로필 이미지)
- 채널 연동, 친구 목록, 메시지 발송은 별도 작업으로 분리

## 결정 사항

| 항목 | 결정 | 이유 |
|------|------|------|
| 프로바이더 방식 | better-auth 내장 kakao | 기존 패턴과 일관성, 최소 코드 변경 |
| 환경변수 | 필수 (조건부 아님) | 카카오가 서비스 핵심 채널 |
| 버튼 순서 | 카카오 → Google → GitHub | 한국 서비스, 카카오 최상단 |
| 버튼 스타일 | 카카오 브랜드 컬러 (#FEE500 배경, #000000 텍스트) | 카카오 브랜드 가이드라인 준수 |

## 수정 대상 파일

### 1. `src/auth.ts` — kakao provider 추가

`socialProviders`에 kakao를 Google과 동일하게 필수로 추가한다.

```typescript
socialProviders: {
  google: {
    clientId: process.env.AUTH_GOOGLE_ID!,
    clientSecret: process.env.AUTH_GOOGLE_SECRET!,
  },
  kakao: {
    clientId: process.env.AUTH_KAKAO_ID!,
    clientSecret: process.env.AUTH_KAKAO_SECRET!,
  },
  ...(github 조건부),
}
```

### 2. `src/features/social-login/ui/social-login-buttons.tsx` — 카카오 버튼 추가

- `provider` 타입에 `"kakao"` 추가: `"google" | "github" | "kakao"`
- 카카오는 Google과 동일하게 즉시 `signIn.social` 호출 (GitHub의 조건부 alert 분기와 구분)
- `KakaoIcon` SVG 컴포넌트를 파일 하단에 인라인 정의 (기존 GoogleIcon, GithubIcon 패턴과 동일). 카카오 디벨로퍼스 공식 브랜드 리소스에서 로고 사용
- 카카오 브랜드 컬러 스타일링: `className="bg-[#FEE500] text-black hover:bg-[#FEE500]/90"` (Tailwind arbitrary value)
- 버튼 순서: 카카오 → Google → GitHub

### 3. `src/features/social-login/ui/__tests__/social-login-buttons.test.tsx` — 테스트 확장

- 기존 테스트 설명을 "Kakao, Google, GitHub 로그인 버튼을 렌더링한다"로 업데이트
- 카카오 버튼 렌더링 테스트
- 카카오 버튼 클릭 시 `authClient.signIn.social({ provider: "kakao" })` 호출 테스트

### 4. `docs/auth.md` — 환경변수 및 카카오 로그인 문서 추가

- 환경변수 섹션에 `AUTH_KAKAO_ID`, `AUTH_KAKAO_SECRET` 추가
- 카카오 디벨로퍼스 콜백 URL 설정 안내: `{BETTER_AUTH_URL}/api/auth/callback/kakao`

> 참고: 프로젝트에 `.env.example` 파일이 없으므로 `docs/auth.md`에서 환경변수를 문서화한다.

### 5. `docs/auth.md` — 카카오 로그인 문서 추가

- 환경변수 설명
- 카카오 디벨로퍼스 콜백 URL 설정 안내: `{BETTER_AUTH_URL}/api/auth/callback/kakao`

## 변경하지 않는 파일

- `src/proxy.ts` — `/api/auth/*` 이미 공개 경로로 처리됨
- `src/shared/lib/auth-client.ts` — 기본 구성으로 충분
- 데이터베이스 스키마 — better-auth가 자동 처리
