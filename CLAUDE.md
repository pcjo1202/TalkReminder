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

## 아키텍처 (FSD)

```
src/
├── app/       # 라우팅, 레이아웃, API 핸들러
├── views/     # 페이지 단위 조합 (서버 컴포넌트)
├── widgets/   # 독립 복합 블록 (서버 컴포넌트)
├── features/  # 인터랙션 기능 ("use client" 허용)
├── entities/  # 도메인 모델 UI (서버 컴포넌트 전용, "use client" 금지)
└── shared/    # ui/, lib/, hooks/, types/
```

**핵심 원칙:**
- `entities`는 순수 표시 전용 — `onClick`, `useState`, `useEffect` 금지
- 인터랙션(클릭, 폼, 모달)은 `features`에서만
- `"use client"` 경계는 최대한 아래로 (features 내부에서만 시작)
- 의존성 방향: `app → views → widgets → features → entities → shared`
- 슬라이스 외부 접근은 반드시 `index.ts`를 통해서만

→ 상세: [docs/architecture.md](docs/architecture.md)

## 코드 규약

**파일명:** 컴포넌트 `kebab-case.tsx`, 모듈 `kebab-case.ts`, 훅 `use-<name>.ts`

**TypeScript:** props는 `interface` 사용. `any` 금지 (불가피 시 eslint-disable 주석 필수).

**컴포넌트:** shadcn/ui 우선 활용. 조건부 className은 반드시 `cn()` 사용.

## 상세 문서

- [개발 워크플로 (Skills 호출 순서)](docs/workflow.md)
- [아키텍처 (FSD 상세)](docs/architecture.md)
- [데이터베이스 (Supabase)](docs/database.md)
- [인증 (better-auth)](docs/auth.md)
- [테스트 (Vitest)](docs/testing.md)
- [스타일링 (Tailwind v4)](docs/styling.md)
