---
title: 인증
description: better-auth 파일 위치, 세션 접근 패턴, Route Handler 보호 방법
---

# 인증 (better-auth)

## 파일 위치

- 서버 설정: `src/auth.ts`
- 클라이언트: `src/shared/lib/auth-client.ts`
- Route Handler: `src/app/api/auth/[...all]/route.ts`
- 미들웨어 보호: `src/middleware.ts`

## 세션 접근

```ts
// 서버 컴포넌트
import { headers } from "next/headers"
import { auth } from "@/auth"
const session = await auth.api.getSession({
  headers: await headers(),
})

// 클라이언트 컴포넌트
import { authClient } from "@/shared/lib/auth-client"
const { data: session, isPending } = authClient.useSession()
```

## 소셜 로그인

```ts
// 클라이언트 컴포넌트
import { authClient } from "@/shared/lib/auth-client"

await authClient.signIn.social({
  provider: "google", // 또는 "github"
  callbackURL: "/dashboard",
})
```

## 로그아웃

```ts
// 클라이언트 컴포넌트
import { authClient } from "@/shared/lib/auth-client"
await authClient.signOut()

// 서버 사이드
import { auth } from "@/auth"
import { headers } from "next/headers"
await auth.api.signOut({ headers: await headers() })
```

## API Route Handler 보호

```ts
// src/app/api/<resource>/route.ts
import { auth } from "@/auth"
import { headers } from "next/headers"

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // ...
}
```

## 환경 변수

```bash
DATABASE_URL=          # Supabase PostgreSQL 연결 문자열
BETTER_AUTH_SECRET=    # openssl rand -base64 32
BETTER_AUTH_URL=       # http://localhost:3000
AUTH_GOOGLE_ID=        # Google OAuth
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=        # GitHub OAuth
AUTH_GITHUB_SECRET=
```
