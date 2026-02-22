# Phase 2: 채널 연결 (Channel Connect) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Slack OAuth 2.0과 카카오 OAuth를 통해 사용자가 채널을 연결·관리할 수 있도록 구현한다. 연결된 토큰을 암호화하여 Supabase에 저장하고, `/channels` 페이지에서 연결 상태 확인·해제가 가능하도록 한다.

**Architecture:** Phase 1에서 구축한 NextAuth.js 인증 기반 위에, 채널 연결을 위한 별도 OAuth 플로우를 API Route로 구현한다. 채널 OAuth는 NextAuth 프로바이더가 아닌 독립 API Route로 처리한다 (사용자 로그인이 아닌 외부 서비스 토큰 획득 목적).

**Tech Stack:** Next.js 16, React 19, Supabase, NextAuth.js (Auth.js v5), Tailwind CSS v4, shadcn/ui, Vitest + @testing-library/react

**참조 문서:**
- PRD: `docs/specs/P02-channel-connect-PRD.md`
- 아키텍처: `docs/architecture.md`
- 인증: `docs/auth.md`
- DB: `docs/database.md`
- Phase 1 플랜: `docs/plans/2026-02-21-phase1-foundation.md`

---

## 아키텍처 결정 (ADR)

| 결정 사항 | 선택 | 대안 | 이유 |
|-----------|------|------|------|
| OAuth 구현 방식 | 독립 API Route (`/api/channels/slack/`, `/api/channels/kakao/`) | NextAuth 프로바이더 추가 | 채널 연결은 사용자 인증이 아닌 외부 서비스 토큰 획득. NextAuth에 섞으면 세션 관리와 혼재 |
| 토큰 암호화 | Node.js `crypto` AES-256-GCM | Supabase Vault | Supabase Vault는 유료 플랜 전용. 자체 암호화로 환경변수 기반 키 관리가 더 유연 |
| CSRF 방지 | `state` 파라미터 + HttpOnly Cookie | 세션 기반 | 쿠키 기반이 서버리스 환경에 적합. 짧은 만료 시간으로 보안 강화 |
| 채널 해제 | Server Action | API Route (DELETE) | Next.js 16 App Router의 서버 액션으로 폼 기반 처리가 자연스럽고 revalidation 연동이 편리 |
| Slack 토큰 방식 | Bot Token (`xoxb-`) | User Token (`xoxp-`) | Bot Token은 사용자 퇴직/비활성과 무관하게 동작. `chat:write` scope 충분 |
| 카카오 토큰 갱신 | refresh_token 저장 + 자동 갱신 | 매번 재인증 | 카카오 access_token 만료 6시간, refresh_token 2개월. UX를 위해 자동 갱신 필수 |

---

## FSD 레이어 매핑 (전체)

```
src/
├── app/
│   ├── api/channels/
│   │   ├── slack/
│   │   │   ├── route.ts              # GET: Slack OAuth redirect
│   │   │   └── callback/route.ts     # GET: Slack OAuth callback
│   │   └── kakao/
│   │       ├── route.ts              # GET: Kakao OAuth redirect
│   │       └── callback/route.ts     # GET: Kakao OAuth callback
│   └── (protected)/channels/
│       └── page.tsx                  # 채널 관리 페이지 (기존 placeholder 교체)
│
├── features/
│   ├── connect-channel/
│   │   ├── ui/
│   │   │   └── connect-channel-button.tsx   # OAuth 리다이렉트 버튼 ("use client")
│   │   └── index.ts
│   └── disconnect-channel/
│       ├── ui/
│       │   └── disconnect-channel-button.tsx # 연결 해제 버튼 ("use client")
│       ├── api/
│       │   └── disconnect-channel.ts        # 서버 액션: 채널 삭제
│       └── index.ts
│
├── entities/
│   └── channel/
│       ├── ui/
│       │   └── channel-card.tsx             # 채널 카드 (서버 컴포넌트)
│       ├── model/
│       │   └── types.ts                     # ChannelType, ChannelConnection 타입
│       └── index.ts
│
├── widgets/
│   └── channel-list/
│       ├── ui/
│       │   └── channel-list.tsx             # 채널 목록 위젯 (서버 컴포넌트)
│       └── index.ts
│
└── shared/
    └── lib/
        ├── crypto.ts                        # AES-256-GCM 암호화/복호화 유틸
        └── oauth-state.ts                   # OAuth state CSRF 방지 유틸
```

---

## Task 1: 의존성 및 환경 변수 추가

**Files:**
- Modify: `package.json`
- Modify: `.env.local.example`

**Step 1: shadcn/ui 추가 컴포넌트 설치**

```bash
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add alert-dialog
pnpm dlx shadcn@latest add sonner
```

> `badge`: 연결 상태 표시, `alert-dialog`: 해제 확인, `sonner`: 토스트 알림

**Step 2: 환경 변수 템플릿 업데이트**

`.env.local.example`에 추가:

```bash
# Channel Encryption
CHANNEL_ENCRYPTION_KEY=  # openssl rand -hex 32 (64자 hex = 256bit)

# Slack OAuth (채널 연결용)
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:3000/api/channels/slack/callback

# Kakao OAuth (채널 연결용)
KAKAO_REST_API_KEY=
KAKAO_CLIENT_SECRET=     # 카카오 앱 설정 > 보안 > Client Secret
KAKAO_REDIRECT_URI=http://localhost:3000/api/channels/kakao/callback
```

**Step 3: Toaster 프로바이더 추가**

Modify: `src/app/(protected)/layout.tsx`

```tsx
import { Toaster } from "@/shared/ui/sonner";

// 레이아웃 return 내부, </SidebarProvider> 바로 다음에 추가
<Toaster />
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: add shadcn/ui components (badge, alert-dialog, sonner) and channel env vars"
```

---

## Task 2: 암호화 유틸 (`shared/lib/crypto.ts`)

**Files:**
- Create: `src/shared/lib/crypto.ts`
- Create: `src/shared/lib/__tests__/crypto.test.ts`

**Step 1: AES-256-GCM 암호화/복호화 모듈**

Create: `src/shared/lib/crypto.ts`

```ts
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.CHANNEL_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("CHANNEL_ENCRYPTION_KEY must be a 64-char hex string (256-bit)");
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return [iv.toString("hex"), tag.toString("hex"), encrypted].join(":");
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const [ivHex, tagHex, encrypted] = ciphertext.split(":");

  if (!ivHex || !tagHex || !encrypted) {
    throw new Error("Invalid ciphertext format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

**Step 2: 암호화 테스트**

Create: `src/shared/lib/__tests__/crypto.test.ts`

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("crypto", () => {
  const TEST_KEY = "a".repeat(64);

  beforeEach(() => {
    vi.stubEnv("CHANNEL_ENCRYPTION_KEY", TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("encrypts and decrypts a string correctly", async () => {
    const { encrypt, decrypt } = await import("../crypto");
    const original = "xoxb-test-token-12345";
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted.split(":")).toHaveLength(3);
    expect(decrypt(encrypted)).toBe(original);
  });

  it("produces different ciphertexts for same input (random IV)", async () => {
    const { encrypt } = await import("../crypto");
    const a = encrypt("same-value");
    const b = encrypt("same-value");
    expect(a).not.toBe(b);
  });

  it("throws on invalid CHANNEL_ENCRYPTION_KEY", async () => {
    vi.stubEnv("CHANNEL_ENCRYPTION_KEY", "too-short");
    const { encrypt } = await import("../crypto");
    expect(() => encrypt("test")).toThrow("64-char hex string");
  });
});
```

**Step 3: 테스트 실행**

Run: `pnpm test src/shared/lib/__tests__/crypto.test.ts`
Expected: PASS (3 tests)

**Step 4: Commit**

```bash
git add src/shared/lib/crypto.ts src/shared/lib/__tests__/crypto.test.ts
git commit -m "feat: add AES-256-GCM encryption util for channel tokens"
```

---

## Task 3: 채널 엔티티 (`entities/channel`)

**Files:**
- Create: `src/entities/channel/model/types.ts`
- Create: `src/entities/channel/ui/channel-card.tsx`
- Create: `src/entities/channel/index.ts`

**Step 1: 채널 타입 정의**

Create: `src/entities/channel/model/types.ts`

```ts
export const CHANNEL_TYPES = ["slack", "kakao"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

export interface ChannelConnection {
  id: string;
  user_id: string;
  channel_type: ChannelType;
  created_at: string;
  metadata: ChannelMetadata | null;
}

export type ChannelMetadata = SlackMetadata | KakaoMetadata;

export interface SlackMetadata {
  team_id: string;
  team_name: string;
  bot_user_id: string;
}

export interface KakaoMetadata {
  kakao_user_id: number;
  nickname: string;
}

export interface ChannelConfig {
  type: ChannelType;
  name: string;
  description: string;
  icon: string;
  connectHref: string;
}

export const CHANNEL_CONFIGS: ChannelConfig[] = [
  {
    type: "slack",
    name: "Slack",
    description: "Slack 워크스페이스의 채널이나 DM으로 알람을 보냅니다.",
    icon: "slack",
    connectHref: "/api/channels/slack",
  },
  {
    type: "kakao",
    name: "카카오톡",
    description: "카카오톡으로 나에게 또는 친구에게 알람을 보냅니다.",
    icon: "kakao",
    connectHref: "/api/channels/kakao",
  },
];
```

**Step 2: ChannelCard (서버 컴포넌트 — 표시 전용)**

Create: `src/entities/channel/ui/channel-card.tsx`

> `entities`이므로 `onClick`, `useState` 등 인터랙션 코드 금지. 순수 표시 전용.
> 연결/해제 버튼은 `features/`에서 slot으로 주입받는다.

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import type { ChannelConfig, ChannelConnection, SlackMetadata, KakaoMetadata } from "../model/types";

interface ChannelCardProps {
  config: ChannelConfig;
  connection: ChannelConnection | null;
  actions: React.ReactNode;
}

export function ChannelCard({ config, connection, actions }: ChannelCardProps) {
  const isConnected = connection !== null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <ChannelIcon type={config.icon} />
          <div>
            <CardTitle className="text-lg">{config.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? "연결됨" : "미연결"}
        </Badge>
      </CardHeader>
      <CardContent>
        {isConnected && connection.metadata && (
          <div className="mb-4 text-sm text-muted-foreground">
            <ConnectionDetail connection={connection} />
          </div>
        )}
        <div className="flex justify-end">{actions}</div>
      </CardContent>
    </Card>
  );
}

function ConnectionDetail({ connection }: { connection: ChannelConnection }) {
  if (connection.channel_type === "slack" && connection.metadata) {
    const meta = connection.metadata as SlackMetadata;
    return <span>워크스페이스: {meta.team_name}</span>;
  }
  if (connection.channel_type === "kakao" && connection.metadata) {
    const meta = connection.metadata as KakaoMetadata;
    return <span>계정: {meta.nickname}</span>;
  }
  return null;
}

function ChannelIcon({ type }: { type: string }) {
  if (type === "slack") {
    return (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
        <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
        <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D"/>
        <path d="M15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z" fill="#ECB22E"/>
      </svg>
    );
  }

  if (type === "kakao") {
    return (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
        <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.72 1.794 5.11 4.504 6.46-.199.744-1.28 4.789-1.32 5.084 0 0-.026.218.115.301.14.083.306.019.306.019.404-.056 4.684-3.069 5.424-3.594.315.044.637.067.965.067 5.523 0 10-3.463 10-7.737C22 6.463 17.523 3 12 3z" fill="#FFE812"/>
      </svg>
    );
  }

  return <div className="h-8 w-8 rounded bg-muted" />;
}
```

**Step 3: 퍼블릭 API**

Create: `src/entities/channel/index.ts`

```ts
export { ChannelCard } from "./ui/channel-card";
export {
  CHANNEL_TYPES,
  CHANNEL_CONFIGS,
  type ChannelType,
  type ChannelConnection,
  type ChannelConfig,
  type ChannelMetadata,
  type SlackMetadata,
  type KakaoMetadata,
} from "./model/types";
```

**Step 4: Commit**

```bash
git add src/entities/channel/
git commit -m "feat: add channel entity with card component and type definitions"
```

---

## Task 4: Slack OAuth API Routes

**Files:**
- Create: `src/app/api/channels/slack/route.ts`
- Create: `src/app/api/channels/slack/callback/route.ts`

**Step 1: OAuth state 쿠키 유틸**

> Slack과 Kakao OAuth 모두에서 사용하는 공통 state 검증 로직.

Create: `src/shared/lib/oauth-state.ts`

```ts
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

const STATE_COOKIE_PREFIX = "oauth_state_";
const STATE_EXPIRY_SECONDS = 600; // 10분

export function generateState(): string {
  return randomBytes(32).toString("hex");
}

export async function saveState(state: string, channel: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(`${STATE_COOKIE_PREFIX}${channel}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_EXPIRY_SECONDS,
    path: "/",
  });
}

export async function validateState(state: string | null, channel: string): Promise<boolean> {
  if (!state) return false;
  const cookieStore = await cookies();
  const cookieName = `${STATE_COOKIE_PREFIX}${channel}`;
  const saved = cookieStore.get(cookieName)?.value;
  cookieStore.delete(cookieName);
  return saved === state;
}
```

**Step 2: Slack OAuth redirect (GET `/api/channels/slack`)**

Create: `src/app/api/channels/slack/route.ts`

```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateState, saveState } from "@/shared/lib/oauth-state";

const SLACK_AUTHORIZE_URL = "https://slack.com/oauth/v2/authorize";

const SLACK_BOT_SCOPES = [
  "chat:write",
  "channels:read",
  "users:read",
].join(",");

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", process.env.AUTH_URL));
  }

  const state = generateState();
  await saveState(state, "slack");

  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    scope: SLACK_BOT_SCOPES,
    redirect_uri: process.env.SLACK_REDIRECT_URI!,
    state,
  });

  return NextResponse.redirect(`${SLACK_AUTHORIZE_URL}?${params.toString()}`);
}
```

**Step 3: Slack OAuth callback (GET `/api/channels/slack/callback`)**

Create: `src/app/api/channels/slack/callback/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateState } from "@/shared/lib/oauth-state";
import { encrypt } from "@/shared/lib/crypto";
import { createAdminClient } from "@/shared/lib/supabase/admin";

const SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", process.env.AUTH_URL));
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const channelsUrl = new URL("/channels", process.env.AUTH_URL);

  if (error) {
    channelsUrl.searchParams.set("error", "slack_denied");
    return NextResponse.redirect(channelsUrl);
  }

  if (!code) {
    channelsUrl.searchParams.set("error", "slack_no_code");
    return NextResponse.redirect(channelsUrl);
  }

  const isValidState = await validateState(state, "slack");
  if (!isValidState) {
    channelsUrl.searchParams.set("error", "slack_invalid_state");
    return NextResponse.redirect(channelsUrl);
  }

  try {
    const tokenResponse = await fetch(SLACK_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        redirect_uri: process.env.SLACK_REDIRECT_URI!,
      }),
    });

    const data = await tokenResponse.json();

    if (!data.ok) {
      channelsUrl.searchParams.set("error", "slack_token_failed");
      return NextResponse.redirect(channelsUrl);
    }

    const supabase = createAdminClient();

    const { error: dbError } = await supabase
      .from("channel_connections")
      .upsert(
        {
          user_id: session.user.id,
          channel_type: "slack",
          access_token: encrypt(data.access_token),
          refresh_token: null,
          metadata: {
            team_id: data.team?.id,
            team_name: data.team?.name,
            bot_user_id: data.bot_user_id,
          },
        },
        { onConflict: "user_id,channel_type" }
      );

    if (dbError) {
      channelsUrl.searchParams.set("error", "slack_save_failed");
      return NextResponse.redirect(channelsUrl);
    }

    channelsUrl.searchParams.set("success", "slack");
    return NextResponse.redirect(channelsUrl);
  } catch {
    channelsUrl.searchParams.set("error", "slack_unexpected");
    return NextResponse.redirect(channelsUrl);
  }
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Slack OAuth API routes (redirect + callback with token encryption)"
```

---

## Task 5: 카카오 OAuth API Routes

**Files:**
- Create: `src/app/api/channels/kakao/route.ts`
- Create: `src/app/api/channels/kakao/callback/route.ts`

**Step 1: 카카오 OAuth redirect (GET `/api/channels/kakao`)**

Create: `src/app/api/channels/kakao/route.ts`

```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateState, saveState } from "@/shared/lib/oauth-state";

const KAKAO_AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", process.env.AUTH_URL));
  }

  const state = generateState();
  await saveState(state, "kakao");

  const params = new URLSearchParams({
    client_id: process.env.KAKAO_REST_API_KEY!,
    redirect_uri: process.env.KAKAO_REDIRECT_URI!,
    response_type: "code",
    scope: "talk_message,friends",
    state,
  });

  return NextResponse.redirect(`${KAKAO_AUTHORIZE_URL}?${params.toString()}`);
}
```

**Step 2: 카카오 OAuth callback (GET `/api/channels/kakao/callback`)**

Create: `src/app/api/channels/kakao/callback/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateState } from "@/shared/lib/oauth-state";
import { encrypt } from "@/shared/lib/crypto";
import { createAdminClient } from "@/shared/lib/supabase/admin";

const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const KAKAO_USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", process.env.AUTH_URL));
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const channelsUrl = new URL("/channels", process.env.AUTH_URL);

  if (error) {
    channelsUrl.searchParams.set("error", "kakao_denied");
    return NextResponse.redirect(channelsUrl);
  }

  if (!code) {
    channelsUrl.searchParams.set("error", "kakao_no_code");
    return NextResponse.redirect(channelsUrl);
  }

  const isValidState = await validateState(state, "kakao");
  if (!isValidState) {
    channelsUrl.searchParams.set("error", "kakao_invalid_state");
    return NextResponse.redirect(channelsUrl);
  }

  try {
    const tokenResponse = await fetch(KAKAO_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_REST_API_KEY!,
        redirect_uri: process.env.KAKAO_REDIRECT_URI!,
        code,
        ...(process.env.KAKAO_CLIENT_SECRET && {
          client_secret: process.env.KAKAO_CLIENT_SECRET,
        }),
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      channelsUrl.searchParams.set("error", "kakao_token_failed");
      return NextResponse.redirect(channelsUrl);
    }

    const userResponse = await fetch(KAKAO_USER_INFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userResponse.json();

    const supabase = createAdminClient();

    const { error: dbError } = await supabase
      .from("channel_connections")
      .upsert(
        {
          user_id: session.user.id,
          channel_type: "kakao",
          access_token: encrypt(tokenData.access_token),
          refresh_token: tokenData.refresh_token
            ? encrypt(tokenData.refresh_token)
            : null,
          metadata: {
            kakao_user_id: userData.id,
            nickname:
              userData.kakao_account?.profile?.nickname ??
              userData.properties?.nickname ??
              "카카오 사용자",
          },
        },
        { onConflict: "user_id,channel_type" }
      );

    if (dbError) {
      channelsUrl.searchParams.set("error", "kakao_save_failed");
      return NextResponse.redirect(channelsUrl);
    }

    channelsUrl.searchParams.set("success", "kakao");
    return NextResponse.redirect(channelsUrl);
  } catch {
    channelsUrl.searchParams.set("error", "kakao_unexpected");
    return NextResponse.redirect(channelsUrl);
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/channels/kakao/
git commit -m "feat: add Kakao OAuth API routes (redirect + callback with token encryption)"
```

---

## Task 6: 채널 연결/해제 Feature

**Files:**
- Create: `src/features/connect-channel/ui/connect-channel-button.tsx`
- Create: `src/features/connect-channel/index.ts`
- Create: `src/features/disconnect-channel/api/disconnect-channel.ts`
- Create: `src/features/disconnect-channel/ui/disconnect-channel-button.tsx`
- Create: `src/features/disconnect-channel/index.ts`

**Step 1: ConnectChannelButton (features — 클라이언트)**

Create: `src/features/connect-channel/ui/connect-channel-button.tsx`

```tsx
"use client";

import { Button } from "@/shared/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";

interface ConnectChannelButtonProps {
  href: string;
  channelName: string;
}

export function ConnectChannelButton({
  href,
  channelName,
}: ConnectChannelButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);
    window.location.href = href;
  };

  return (
    <Button onClick={handleConnect} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Plus className="mr-2 h-4 w-4" />
      )}
      {channelName} 연결
    </Button>
  );
}
```

Create: `src/features/connect-channel/index.ts`

```ts
export { ConnectChannelButton } from "./ui/connect-channel-button";
```

**Step 2: DisconnectChannel 서버 액션**

Create: `src/features/disconnect-channel/api/disconnect-channel.ts`

```ts
"use server";

import { auth } from "@/auth";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { ChannelType } from "@/entities/channel";

export async function disconnectChannel(channelType: ChannelType) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("channel_connections")
    .delete()
    .eq("user_id", session.user.id)
    .eq("channel_type", channelType);

  if (error) {
    return { error: "삭제에 실패했습니다." };
  }

  revalidatePath("/channels");
  return { success: true };
}
```

**Step 3: DisconnectChannelButton (features — 클라이언트)**

Create: `src/features/disconnect-channel/ui/disconnect-channel-button.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Loader2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { disconnectChannel } from "../api/disconnect-channel";
import type { ChannelType } from "@/entities/channel";

interface DisconnectChannelButtonProps {
  channelType: ChannelType;
  channelName: string;
}

export function DisconnectChannelButton({
  channelType,
  channelName,
}: DisconnectChannelButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDisconnect = async () => {
    setLoading(true);
    const result = await disconnectChannel(channelType);
    setLoading(false);

    if (result.error) {
      toast.error(`${channelName} 연결 해제에 실패했습니다.`);
    } else {
      toast.success(`${channelName} 연결이 해제되었습니다.`);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Unlink className="mr-2 h-4 w-4" />
          )}
          연결 해제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{channelName} 연결을 해제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            연결을 해제하면 이 채널로 발송 중인 알람이 중단됩니다.
            언제든 다시 연결할 수 있습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={handleDisconnect}>
            연결 해제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

Create: `src/features/disconnect-channel/index.ts`

```ts
export { DisconnectChannelButton } from "./ui/disconnect-channel-button";
export { disconnectChannel } from "./api/disconnect-channel";
```

**Step 4: Commit**

```bash
git add src/features/connect-channel/ src/features/disconnect-channel/
git commit -m "feat: add connect/disconnect channel features with server action"
```

---

## Task 7: 채널 목록 위젯 (`widgets/channel-list`)

**Files:**
- Create: `src/widgets/channel-list/ui/channel-list.tsx`
- Create: `src/widgets/channel-list/index.ts`

**Step 1: ChannelList 위젯 (서버 컴포넌트)**

> `widgets`는 `entities`와 `features`를 조합하는 레이어.
> Supabase에서 데이터를 가져와 `ChannelCard`에 전달하고, 연결 상태에 따라 적절한 `features` 버튼을 주입한다.

Create: `src/widgets/channel-list/ui/channel-list.tsx`

```tsx
import { auth } from "@/auth";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import {
  ChannelCard,
  CHANNEL_CONFIGS,
  type ChannelConnection,
} from "@/entities/channel";
import { ConnectChannelButton } from "@/features/connect-channel";
import { DisconnectChannelButton } from "@/features/disconnect-channel";

export async function ChannelList() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const supabase = createAdminClient();
  const { data: connections } = await supabase
    .from("channel_connections")
    .select("id, user_id, channel_type, metadata, created_at")
    .eq("user_id", session.user.id);

  const connectionMap = new Map(
    (connections ?? []).map((c) => [c.channel_type, c as ChannelConnection])
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {CHANNEL_CONFIGS.map((config) => {
        const connection = connectionMap.get(config.type) ?? null;
        return (
          <ChannelCard
            key={config.type}
            config={config}
            connection={connection}
            actions={
              connection ? (
                <DisconnectChannelButton
                  channelType={config.type}
                  channelName={config.name}
                />
              ) : (
                <ConnectChannelButton
                  href={config.connectHref}
                  channelName={config.name}
                />
              )
            }
          />
        );
      })}
    </div>
  );
}
```

Create: `src/widgets/channel-list/index.ts`

```ts
export { ChannelList } from "./ui/channel-list";
```

**Step 2: Commit**

```bash
git add src/widgets/channel-list/
git commit -m "feat: add channel list widget composing entity cards with feature actions"
```

---

## Task 8: `/channels` 페이지 구현

**Files:**
- Modify: `src/app/(protected)/channels/page.tsx`

**Step 1: 기존 placeholder 페이지 교체**

> OAuth 콜백 후 `?success=slack`이나 `?error=slack_denied` 등의 쿼리 파라미터가 올 수 있다.
> 서버 컴포넌트에서 이를 읽어 클라이언트에 전달하고, 클라이언트에서 토스트로 표시한다.

Modify: `src/app/(protected)/channels/page.tsx`

```tsx
import { Suspense } from "react";
import { ChannelList } from "@/widgets/channel-list";
import { ChannelPageToast } from "./channel-page-toast";

interface ChannelsPageProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function ChannelsPage({ searchParams }: ChannelsPageProps) {
  const { success, error } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">채널 관리</h1>
        <p className="text-muted-foreground mt-1">
          알람을 발송할 채널을 연결하세요.
        </p>
      </div>

      <Suspense fallback={<ChannelListSkeleton />}>
        <ChannelList />
      </Suspense>

      <ChannelPageToast success={success} error={error} />
    </div>
  );
}

function ChannelListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-lg border bg-muted"
        />
      ))}
    </div>
  );
}
```

**Step 2: 토스트 알림 컴포넌트 (클라이언트)**

Create: `src/app/(protected)/channels/channel-page-toast.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const ERROR_MESSAGES: Record<string, string> = {
  slack_denied: "Slack 연결이 취소되었습니다.",
  slack_no_code: "Slack 인가 코드를 받지 못했습니다.",
  slack_invalid_state: "잘못된 요청입니다. 다시 시도해주세요.",
  slack_token_failed: "Slack 토큰 발급에 실패했습니다.",
  slack_save_failed: "Slack 연결 정보 저장에 실패했습니다.",
  slack_unexpected: "Slack 연결 중 오류가 발생했습니다.",
  kakao_denied: "카카오 연결이 취소되었습니다.",
  kakao_no_code: "카카오 인가 코드를 받지 못했습니다.",
  kakao_invalid_state: "잘못된 요청입니다. 다시 시도해주세요.",
  kakao_token_failed: "카카오 토큰 발급에 실패했습니다.",
  kakao_save_failed: "카카오 연결 정보 저장에 실패했습니다.",
  kakao_unexpected: "카카오 연결 중 오류가 발생했습니다.",
};

const SUCCESS_MESSAGES: Record<string, string> = {
  slack: "Slack이 성공적으로 연결되었습니다!",
  kakao: "카카오톡이 성공적으로 연결되었습니다!",
};

interface ChannelPageToastProps {
  success?: string;
  error?: string;
}

export function ChannelPageToast({ success, error }: ChannelPageToastProps) {
  useEffect(() => {
    if (success && SUCCESS_MESSAGES[success]) {
      toast.success(SUCCESS_MESSAGES[success]);
      window.history.replaceState(null, "", "/channels");
    }
    if (error && ERROR_MESSAGES[error]) {
      toast.error(ERROR_MESSAGES[error]);
      window.history.replaceState(null, "", "/channels");
    }
  }, [success, error]);

  return null;
}
```

**Step 3: Commit**

```bash
git add src/app/\(protected\)/channels/
git commit -m "feat: implement /channels page with channel list and toast notifications"
```

---

## Task 9: 테스트

**Files:**
- Create: `src/features/connect-channel/ui/__tests__/connect-channel-button.test.tsx`
- Create: `src/features/disconnect-channel/ui/__tests__/disconnect-channel-button.test.tsx`
- Create: `src/entities/channel/ui/__tests__/channel-card.test.tsx`

**Step 1: ConnectChannelButton 테스트**

Create: `src/features/connect-channel/ui/__tests__/connect-channel-button.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConnectChannelButton } from "../connect-channel-button";

describe("ConnectChannelButton", () => {
  it("renders the connect button with channel name", () => {
    render(
      <ConnectChannelButton
        href="/api/channels/slack"
        channelName="Slack"
      />
    );
    expect(
      screen.getByRole("button", { name: /Slack 연결/i })
    ).toBeInTheDocument();
  });

  it("button is not disabled by default", () => {
    render(
      <ConnectChannelButton
        href="/api/channels/slack"
        channelName="Slack"
      />
    );
    expect(
      screen.getByRole("button", { name: /Slack 연결/i })
    ).not.toBeDisabled();
  });
});
```

**Step 2: DisconnectChannelButton 테스트**

Create: `src/features/disconnect-channel/ui/__tests__/disconnect-channel-button.test.tsx`

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DisconnectChannelButton } from "../disconnect-channel-button";

vi.mock("../../api/disconnect-channel", () => ({
  disconnectChannel: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("DisconnectChannelButton", () => {
  it("renders the disconnect button", () => {
    render(
      <DisconnectChannelButton channelType="slack" channelName="Slack" />
    );
    expect(
      screen.getByRole("button", { name: /연결 해제/i })
    ).toBeInTheDocument();
  });

  it("shows confirmation dialog when clicked", async () => {
    const user = userEvent.setup();
    render(
      <DisconnectChannelButton channelType="slack" channelName="Slack" />
    );
    await user.click(screen.getByRole("button", { name: /연결 해제/i }));
    expect(
      screen.getByText(/Slack 연결을 해제할까요?/i)
    ).toBeInTheDocument();
  });
});
```

**Step 3: ChannelCard 테스트**

Create: `src/entities/channel/ui/__tests__/channel-card.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChannelCard } from "../channel-card";
import { CHANNEL_CONFIGS } from "../../model/types";

describe("ChannelCard", () => {
  const slackConfig = CHANNEL_CONFIGS[0];

  it("shows '미연결' badge when not connected", () => {
    render(
      <ChannelCard
        config={slackConfig}
        connection={null}
        actions={<button>연결</button>}
      />
    );
    expect(screen.getByText("미연결")).toBeInTheDocument();
  });

  it("shows '연결됨' badge when connected", () => {
    render(
      <ChannelCard
        config={slackConfig}
        connection={{
          id: "1",
          user_id: "u1",
          channel_type: "slack",
          created_at: new Date().toISOString(),
          metadata: { team_id: "T1", team_name: "My Team", bot_user_id: "B1" },
        }}
        actions={<button>해제</button>}
      />
    );
    expect(screen.getByText("연결됨")).toBeInTheDocument();
    expect(screen.getByText(/My Team/)).toBeInTheDocument();
  });

  it("renders channel name and description", () => {
    render(
      <ChannelCard
        config={slackConfig}
        connection={null}
        actions={<button>연결</button>}
      />
    );
    expect(screen.getByText("Slack")).toBeInTheDocument();
    expect(screen.getByText(slackConfig.description)).toBeInTheDocument();
  });
});
```

**Step 4: @testing-library/user-event 설치**

```bash
pnpm add -D @testing-library/user-event
```

**Step 5: 전체 테스트 실행**

Run: `pnpm test`
Expected: 모든 테스트 PASS

**Step 6: Commit**

```bash
git add -A
git commit -m "test: add unit tests for channel card, connect, and disconnect features"
```

---

## Task 10: 전체 통합 검증

**Step 1: 전체 테스트 실행**

Run: `pnpm test`
Expected: 모든 테스트 PASS (Phase 1 + Phase 2 테스트 포함)

**Step 2: Lint 실행**

Run: `pnpm lint`
Expected: 에러 없음

**Step 3: 빌드 검증**

Run: `pnpm build`
Expected: 빌드 성공

**Step 4: 수동 검증 (환경변수 설정 후)**

`.env.local`에 Slack/카카오 OAuth 정보를 넣고:

```bash
pnpm dev
```

1. `/channels` 페이지 접속 → Slack, 카카오톡 카드 2개 표시
2. 미연결 상태: "미연결" 배지, "Slack 연결" / "카카오톡 연결" 버튼
3. **Slack 연결 테스트:**
   - "Slack 연결" 클릭 → Slack OAuth 페이지로 이동
   - 워크스페이스 선택 → 권한 승인
   - `/channels`로 복귀 → "Slack이 성공적으로 연결되었습니다!" 토스트
   - Slack 카드: "연결됨" 배지, 워크스페이스 이름 표시, "연결 해제" 버튼
4. **카카오 연결 테스트:**
   - "카카오톡 연결" 클릭 → 카카오 OAuth 페이지로 이동
   - `talk_message`, `friends` 권한 승인
   - `/channels`로 복귀 → "카카오톡이 성공적으로 연결되었습니다!" 토스트
   - 카카오톡 카드: "연결됨" 배지, 닉네임 표시, "연결 해제" 버튼
5. **연결 해제 테스트:**
   - "연결 해제" 클릭 → 확인 다이얼로그 표시
   - "연결 해제" 확인 → "연결이 해제되었습니다" 토스트
   - 카드가 "미연결" 상태로 변경
6. **에러 케이스:**
   - OAuth 페이지에서 "거부" → 에러 토스트 표시
   - Supabase DB에 데이터 저장 확인

**Step 5: PRD 업데이트 — AC-07, AC-08 연기 반영**

Modify: `docs/specs/P02-channel-connect-PRD.md`

"포함 (In Scope)"에서 다음 2개 항목을 "제외 (Out of Scope)"로 이동하고 메모를 추가한다:

```
**제외 (Out of Scope):**
- 이메일 채널 (v2)
- 다중 Slack 워크스페이스 연결 (MVP에서는 1개)
- 카카오 비즈니스 채널 (나에게/친구에게만)
- 연결된 Slack 채널 목록 조회 (Phase 3 알람 생성 시 실시간 조회로 구현)
- 연결된 카카오 친구 목록 조회 (Phase 3 알람 생성 시 실시간 조회로 구현)
```

AC-07, AC-08도 업데이트:

```
- [ ] AC-07: (Phase 3으로 이동) 연결된 Slack 워크스페이스의 채널 목록을 조회할 수 있다
- [ ] AC-08: (Phase 3으로 이동) 연결된 카카오 계정의 친구 목록(최대 100명)을 조회할 수 있다
```

**Step 6: 최종 Commit**

```bash
git add -A
git commit -m "chore: phase 2 channel connect complete — Slack/Kakao OAuth with encrypted tokens"
```

---

## 체크리스트 (PRD AC 대응)

| AC | 설명 | Task |
|----|------|------|
| AC-01 | "Slack 연결" 버튼 → Slack OAuth 페이지 이동 | Task 4, 6 |
| AC-02 | Slack OAuth 완료 → `channel_connections`에 암호화 토큰 저장 | Task 4 |
| AC-03 | "카카오 연결" 버튼 → 카카오 OAuth 페이지 이동 | Task 5, 6 |
| AC-04 | 카카오 OAuth 완료 → `channel_connections`에 암호화 토큰 저장 | Task 5 |
| AC-05 | 연결된 채널 "연결됨" 배지 + "연결 해제" 버튼 표시 | Task 3, 7 |
| AC-06 | "연결 해제" → DB 레코드 삭제 | Task 6 |
| AC-07 | Slack 채널 목록 조회 가능 | Phase 3으로 이동 (알람 생성 시 실시간 조회) |
| AC-08 | 카카오 친구 목록 조회 가능 | Phase 3으로 이동 (알람 생성 시 실시간 조회) |

> **AC-07, AC-08 연기 사유:** 채널/친구 목록은 Phase 2에서 미리 캐시하기보다, 알람 생성 시(Phase 3)에 실시간 조회하는 것이 데이터 신선도와 구현 복잡도 면에서 적합하다. PRD "포함" → "제외"로 이동하고, Phase 3 PRD에 반영한다 (Task 10 Step 5).

---

## 환경 변수 설정 가이드 (참고)

### Slack 앱 생성

1. https://api.slack.com/apps 에서 "Create New App" → "From Scratch"
2. App Name: `Talk Reminder`, Workspace 선택
3. **OAuth & Permissions:**
   - Bot Token Scopes: `chat:write`, `channels:read`, `users:read`
   - Redirect URLs: `http://localhost:3000/api/channels/slack/callback`
4. **Basic Information:**
   - Client ID → `SLACK_CLIENT_ID`
   - Client Secret → `SLACK_CLIENT_SECRET`

### 카카오 앱 설정

1. https://developers.kakao.com 에서 앱 생성
2. **앱 설정 > 플랫폼:** Web 플랫폼 추가 (`http://localhost:3000`)
3. **카카오 로그인:**
   - 활성화 설정: ON
   - Redirect URI: `http://localhost:3000/api/channels/kakao/callback`
4. **동의항목:**
   - `talk_message` (카카오톡 메시지 전송): 필수
   - `friends` (친구 목록): 선택
5. **앱 키:**
   - REST API 키 → `KAKAO_REST_API_KEY`
6. **보안:**
   - Client Secret 발급 → `KAKAO_CLIENT_SECRET`
