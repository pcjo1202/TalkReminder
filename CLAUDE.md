# CLAUDE.md

## 프로젝트

Talk Reminder — KakaoTalk, SMS, Slack 등을 통한 통합 알람 관리 서비스.

## 명령어

```bash
pnpm dev       # 개발 서버
pnpm build     # 프로덕션 빌드
pnpm start     # 프로덕션 서버
pnpm lint      # ESLint
pnpm test      # Vitest
pnpm test:watch # Vitest watch 모드
pnpm test:ui   # Vitest UI 모드
pnpm coverage  # 커버리지
```

> 패키지 매니저는 **pnpm**. npm/yarn 사용 금지.

## 기술 스택

- **Next.js 16** — App Router, RSC, React Compiler (`reactCompiler: true`)
- **Tailwind CSS v4** — CSS import 방식 (`@import "tailwindcss"`), JS 설정 없음
- **shadcn/ui** — new-york 스타일, neutral, CSS 변수. `src/shared/ui/`에 위치
- **Supabase** — PostgreSQL + 실시간 + 스토리지
- **better-auth** — 인증 (소셜 로그인, 세션 관리)
- **Vitest + @testing-library/react** — 테스트

## Next.js 16 주요 규약

- **proxy.ts** — `middleware.ts` 대체. `src/proxy.ts`에서 인증 라우트 보호 (Node.js 런타임)
- **Turbopack** — 기본 번들러. `--webpack` 플래그로 폴백 가능
- **async params/searchParams** — 페이지 props에서 반드시 `await params`, `await searchParams`
- **parallel routes** — 모든 슬롯에 `default.js` 필수
- **revalidateTag()** — 2번째 인자(cacheLife profile) 필수: `revalidateTag('tag', 'max')`

## 아키텍처 (FSD)

```
src/
├── app/       # 라우팅, 레이아웃, API 핸들러
├── widgets/   # 독립 복합 블록 (서버 컴포넌트)
├── features/  # 인터랙션 기능 ("use client" 허용)
├── entities/  # 도메인 모델 UI (서버 컴포넌트 전용, "use client" 금지)
└── shared/    # ui/, lib/, hooks/, types/
```

- 의존성 방향: `app → widgets → features → entities → shared`
- 슬라이스 외부 접근은 반드시 `index.ts`를 통해서만
- 세부 규칙은 `.claude/rules/`와 각 슬라이스의 `CLAUDE.md` 참조

## Gotchas

- shadcn/ui 컴포넌트 추가: `pnpm dlx shadcn@latest add <컴포넌트명>`
- `index.ts`에서 `export *` 금지 — 명시적 named re-export만 사용
- React Compiler 사용 중 — `useMemo`/`useCallback` 수동 최적화 불필요

## 참조 문서

> 아래 문서는 자동 로드되지 않습니다. 관련 작업 시 직접 참조하세요.

- [개발 워크플로 (Skills 호출 순서)](docs/workflow.md)
- [인증 (better-auth)](docs/auth.md)
- [스타일링 (Tailwind v4)](docs/styling.md)
