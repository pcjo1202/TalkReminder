---
title: 인증
description: NextAuth.js(Auth.js v5) 파일 위치, 세션 접근 패턴, Route Handler 보호 방법
---

# 인증 (NextAuth.js / Auth.js v5)

## 파일 위치

- 설정: `src/auth.ts`
- Route Handler: `src/app/api/auth/[...nextauth]/route.ts`
- 미들웨어 보호: `src/middleware.ts`

## 세션 접근

```ts
// 서버 컴포넌트
import { auth } from "@/auth"
const session = await auth()

// 클라이언트 컴포넌트
import { useSession } from "next-auth/react"
const { data: session } = useSession()
```

## API Route Handler 보호

```ts
// src/app/api/<resource>/route.ts
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // ...
}
```
