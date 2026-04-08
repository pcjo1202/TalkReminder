# 카카오톡 로그인 추가 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** better-auth 내장 kakao 프로바이더를 사용하여 카카오톡 소셜 로그인을 추가한다.

**Architecture:** 기존 Google/GitHub 소셜 로그인 패턴을 그대로 따라 `src/auth.ts`에 kakao provider를 추가하고, `social-login-buttons.tsx`에 카카오 버튼을 추가한다. 신규 파일 생성 없이 기존 파일 수정만으로 완료한다.

**Tech Stack:** better-auth 1.4.18 (내장 kakao provider), Next.js 16, Tailwind CSS v4, Vitest

---

## 파일 맵

| 파일 | 작업 | 역할 |
|------|------|------|
| `src/auth.ts` | 수정 | kakao socialProvider 추가 |
| `src/features/social-login/ui/social-login-buttons.tsx` | 수정 | 카카오 버튼 UI + KakaoIcon + provider 타입 확장 |
| `src/features/social-login/ui/__tests__/social-login-buttons.test.tsx` | 수정 | 카카오 버튼 렌더링/클릭 테스트 |
| `docs/auth.md` | 수정 | 카카오 환경변수 및 콜백 URL 문서화 |

---

### Task 0: 테스트 의존성 설치

**Files:** 없음 (패키지 설치만)

- [ ] **Step 1: @testing-library/user-event 설치**

Task 3의 클릭 테스트에서 필요한 패키지를 사전 설치한다.

```bash
pnpm add -D @testing-library/user-event
```

- [ ] **Step 2: 커밋**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): @testing-library/user-event를 추가합니다"
```

---

### Task 1: 카카오 버튼 렌더링 테스트 작성

**Files:**
- Modify: `src/features/social-login/ui/__tests__/social-login-buttons.test.tsx`

- [ ] **Step 1: 카카오 버튼 렌더링 테스트 추가**

기존 테스트 파일을 아래 내용으로 **전체 교체**한다. 기존 `"renders Google and GitHub login buttons"` 테스트를 한글로 변경하고 카카오 assertion을 추가한다. `afterEach`에 `vi.clearAllMocks()`를 추가하여 테스트 간 mock 상태를 초기화한다.

```typescript
// src/features/social-login/ui/__tests__/social-login-buttons.test.tsx — 전체 교체
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SocialLoginButtons } from "../social-login-buttons";

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
    },
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SocialLoginButtons", () => {
  it("카카오, Google, GitHub 로그인 버튼을 렌더링한다", () => {
    render(<SocialLoginButtons />);
    expect(
      screen.getByRole("button", { name: /카카오로 계속하기/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Google로 계속하기/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /GitHub로 계속하기/i })
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm test src/features/social-login/ui/__tests__/social-login-buttons.test.tsx`
Expected: FAIL — "카카오로 계속하기" 버튼을 찾을 수 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/social-login/ui/__tests__/social-login-buttons.test.tsx
git commit -m "test(social-login): 카카오 버튼 렌더링 테스트를 추가합니다"
```

---

### Task 2: 카카오 버튼 UI 구현

**Files:**
- Modify: `src/features/social-login/ui/social-login-buttons.tsx`

- [ ] **Step 1: provider 타입 확장 및 카카오 버튼 추가**

`handleLogin`의 provider 타입에 `"kakao"`를 추가하고, 카카오 버튼을 최상단에 배치한다. 카카오는 Google과 동일하게 즉시 `signIn.social`을 호출한다 (GitHub의 alert 분기와 다름).

```typescript
// src/features/social-login/ui/social-login-buttons.tsx
"use client";

import { Button } from "@/shared/ui/button";
import { authClient } from "@/shared/lib/auth-client";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface SocialLoginButtonProps {
  callbackUrl?: string;
}

export function SocialLoginButtons({
  callbackUrl = "/dashboard",
}: SocialLoginButtonProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleLogin = async (provider: "google" | "github" | "kakao") => {
    if (provider === "github") {
      alert("GitHub 로그인은 준비 중입니다.");
      return;
    }
    setLoading(provider);
    await authClient.signIn.social({
      provider,
      callbackURL: callbackUrl,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        size="lg"
        className="bg-[#FEE500] text-black hover:bg-[#FEE500]/90"
        onClick={() => handleLogin("kakao")}
        disabled={loading !== null}
      >
        {loading === "kakao" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <KakaoIcon className="mr-2 h-4 w-4" />
        )}
        카카오로 계속하기
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={() => handleLogin("google")}
        disabled={loading !== null}
      >
        {loading === "google" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 h-4 w-4" />
        )}
        Google로 계속하기
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={() => handleLogin("github")}
        disabled={loading !== null}
      >
        {loading === "github" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GithubIcon className="mr-2 h-4 w-4" />
        )}
        GitHub로 계속하기 (준비 중)
      </Button>
    </div>
  );
}

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.72 1.8 5.108 4.516 6.457-.197.735-.714 2.665-.818 3.08-.128.512.188.504.394.367.163-.108 2.592-1.76 3.644-2.476.734.103 1.49.157 2.264.157 5.523 0 10-3.463 10-7.585C22 6.463 17.523 3 12 3z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
```

- [ ] **Step 2: 테스트 실행 — 통과 확인**

Run: `pnpm test src/features/social-login/ui/__tests__/social-login-buttons.test.tsx`
Expected: PASS

- [ ] **Step 3: 커밋**

```bash
git add src/features/social-login/ui/social-login-buttons.tsx
git commit -m "feat(social-login): 카카오 로그인 버튼을 추가합니다"
```

---

### Task 3: 카카오 버튼 클릭 테스트 추가

**Files:**
- Modify: `src/features/social-login/ui/__tests__/social-login-buttons.test.tsx`

- [ ] **Step 1: 클릭 테스트 추가**

카카오 버튼 클릭 시 `authClient.signIn.social`이 `provider: "kakao"`로 호출되는지 검증한다.

```typescript
// 기존 테스트 파일 하단에 추가
import userEvent from "@testing-library/user-event";
import { authClient } from "@/shared/lib/auth-client";

it("카카오 버튼 클릭 시 signIn.social을 kakao provider로 호출한다", async () => {
  const user = userEvent.setup();
  render(<SocialLoginButtons />);

  const kakaoButton = screen.getByRole("button", { name: /카카오로 계속하기/i });
  await user.click(kakaoButton);

  expect(authClient.signIn.social).toHaveBeenCalledWith({
    provider: "kakao",
    callbackURL: "/dashboard",
  });
});

it("카카오 버튼 클릭 시 커스텀 callbackUrl을 전달한다", async () => {
  const user = userEvent.setup();
  render(<SocialLoginButtons callbackUrl="/settings" />);

  const kakaoButton = screen.getByRole("button", { name: /카카오로 계속하기/i });
  await user.click(kakaoButton);

  expect(authClient.signIn.social).toHaveBeenCalledWith({
    provider: "kakao",
    callbackURL: "/settings",
  });
});
```

- [ ] **Step 2: 테스트 실행 — 통과 확인**

Run: `pnpm test src/features/social-login/ui/__tests__/social-login-buttons.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 3: 커밋**

```bash
git add src/features/social-login/ui/__tests__/social-login-buttons.test.tsx
git commit -m "test(social-login): 카카오 버튼 클릭 테스트를 추가합니다"
```

---

### Task 4: better-auth 서버에 kakao provider 추가

**Files:**
- Modify: `src/auth.ts`

- [ ] **Step 1: kakao provider 추가**

Google과 동일하게 필수 환경변수로 추가한다. Google → kakao → GitHub(조건부) 순서로 배치.

```typescript
// src/auth.ts
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

export const auth = betterAuth({
  // Supabase 연동
  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  }),

  // 소셜 로그인 연동
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    },
    kakao: {
      clientId: process.env.AUTH_KAKAO_ID!,
      clientSecret: process.env.AUTH_KAKAO_SECRET!,
    },
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? {
          github: {
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
          },
        }
      : {}),
  },
  plugins: [nextCookies()],
});
```

- [ ] **Step 2: 타입 체크**

Run: `pnpm tsc --noEmit`
Expected: 타입 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/auth.ts
git commit -m "feat(auth): kakao 소셜 프로바이더를 추가합니다"
```

---

### Task 5: 문서 업데이트

**Files:**
- Modify: `docs/auth.md`

- [ ] **Step 1: 카카오 환경변수 및 로그인 문서 추가**

소셜 로그인 코드 예시에 kakao를 추가하고, 환경 변수 섹션에 카카오 키를 추가한다.

`docs/auth.md` 수정 사항:

1. "소셜 로그인" 섹션의 코드 예시 주석에 `"kakao"` 추가:
```ts
await authClient.signIn.social({
  provider: "google", // 또는 "kakao", "github"
  callbackURL: "/dashboard",
})
```

2. "환경 변수" 섹션에 카카오 키 추가:
```bash
AUTH_KAKAO_ID=        # Kakao OAuth (REST API 키)
AUTH_KAKAO_SECRET=    # Kakao OAuth (Client Secret)
```

3. 환경 변수 섹션 하단에 콜백 URL 안내 추가:
```markdown
### 카카오 디벨로퍼스 설정

- Redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/kakao`
- 로컬 개발: `http://localhost:3000/api/auth/callback/kakao`
```

- [ ] **Step 2: 커밋**

```bash
git add docs/auth.md
git commit -m "docs(auth): 카카오 로그인 환경변수 및 콜백 URL 설정을 문서화합니다"
```
