# Phase 1: 기반 (Foundation) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** DB 스키마, NextAuth.js 소셜 로그인, 공통 레이아웃을 완성해 이후 Phase가 독립적으로 개발될 수 있는 토대를 구축한다.

**Architecture:** Next.js 16 App Router + Supabase (PostgreSQL) + NextAuth.js v5 기반. FSD 아키텍처를 따라 `shared/`에 Supabase 클라이언트와 공통 유틸을, `features/`에 인증 관련 클라이언트 인터랙션을, `app/`에 라우팅과 레이아웃을 배치한다.

**Tech Stack:** Next.js 16, React 19, Supabase, NextAuth.js (Auth.js v5), Tailwind CSS v4, shadcn/ui, Vitest + @testing-library/react

**참조 문서:**
- PRD: `docs/specs/P01-foundation-PRD.md`
- 아키텍처: `docs/architecture.md`
- 인증: `docs/auth.md`
- DB: `docs/database.md`
- 스타일: `docs/styling.md`

---

## Task 1: 의존성 설치

**Files:**
- Modify: `package.json`

**Step 1: Supabase, NextAuth, 테스트 패키지 설치**

```bash
pnpm add @supabase/supabase-js @supabase/ssr next-auth@beta @auth/supabase-adapter
```

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

**Step 2: Vitest 설정 파일 생성**

Create: `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create: `vitest.setup.ts`

```ts
import "@testing-library/jest-dom/vitest";
```

**Step 3: package.json scripts 업데이트**

`package.json`의 `scripts`에 추가:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "coverage": "vitest run --coverage"
}
```

**Step 4: 테스트 환경 검증**

Create: `src/shared/lib/__tests__/setup.test.ts`

```ts
import { describe, it, expect } from "vitest";

describe("vitest setup", () => {
  it("should run tests", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `pnpm test`
Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: add Supabase, NextAuth, Vitest dependencies and config"
```

---

## Task 2: shared 기반 구조 생성

**Files:**
- Move: `src/lib/utils.ts` → `src/shared/lib/utils.ts`
- Create: `src/shared/lib/supabase/client.ts`
- Create: `src/shared/lib/supabase/server.ts`
- Create: `src/shared/lib/supabase/admin.ts`
- Create: `src/shared/types/supabase.ts`

**Step 1: utils.ts 이동 및 경로 업데이트**

기존 `src/lib/utils.ts`를 `src/shared/lib/utils.ts`로 이동한다.
이 파일을 import하는 곳이 있으면 경로를 `@/shared/lib/utils`로 변경한다.

```bash
mkdir -p src/shared/lib src/shared/types src/shared/hooks src/shared/ui
mv src/lib/utils.ts src/shared/lib/utils.ts
rmdir src/lib
```

shadcn/ui가 사용하는 `components.json`에서 `aliases` 경로도 확인. 이미 `src/shared/ui`로 되어 있어야 한다.

**Step 2: Supabase 타입 파일 (수동 초안)**

Create: `src/shared/types/supabase.ts`

> Supabase 프로젝트가 아직 없으므로 수동으로 타입을 정의한다. 추후 `supabase gen types`로 교체.

```ts
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          image: string | null;
          timezone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email: string;
          image?: string | null;
          timezone?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string;
          image?: string | null;
          timezone?: string;
          created_at?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          cron_expression: string;
          timezone: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          cron_expression: string;
          timezone?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          cron_expression?: string;
          timezone?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      channel_connections: {
        Row: {
          id: string;
          user_id: string;
          channel_type: "slack" | "kakao";
          access_token: string;
          refresh_token: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel_type: "slack" | "kakao";
          access_token: string;
          refresh_token?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel_type?: "slack" | "kakao";
          access_token?: string;
          refresh_token?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          body: string;
          variables: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          body: string;
          variables?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          body?: string;
          variables?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      reminder_logs: {
        Row: {
          id: string;
          reminder_id: string;
          channel_type: "slack" | "kakao";
          status: "success" | "failure";
          sent_at: string;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          reminder_id: string;
          channel_type: "slack" | "kakao";
          status: "success" | "failure";
          sent_at?: string;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          reminder_id?: string;
          channel_type?: "slack" | "kakao";
          status?: "success" | "failure";
          sent_at?: string;
          error_message?: string | null;
        };
      };
    };
  };
}
```

**Step 3: Supabase 클라이언트 파일 생성**

Create: `src/shared/lib/supabase/client.ts`

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/shared/types/supabase";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

Create: `src/shared/lib/supabase/server.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/shared/types/supabase";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출 시 무시
          }
        },
      },
    }
  );
}
```

Create: `src/shared/lib/supabase/admin.ts`

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types/supabase";

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}
```

**Step 4: 환경 변수 템플릿 생성**

Create: `.env.local.example`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-publishable-key
SUPABASE_SECRET_KEY=sb_secret_your-secret-key

# NextAuth
AUTH_SECRET=  # openssl rand -base64 32
AUTH_URL=http://localhost:3000

# Google OAuth
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# GitHub OAuth
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add shared layer structure with Supabase clients and types"
```

---

## Task 3: Supabase DB 스키마 (SQL 마이그레이션)

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: 마이그레이션 디렉토리 생성**

```bash
mkdir -p supabase/migrations
```

**Step 2: 초기 스키마 SQL 작성**

Create: `supabase/migrations/001_initial_schema.sql`

```sql
-- ============================================
-- Talk Reminder: 초기 스키마
-- ============================================

-- UUID 확장
create extension if not exists "uuid-ossp";

-- ============================================
-- NextAuth.js 필수 테이블
-- (Auth.js Supabase adapter가 요구하는 구조)
-- ============================================

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text,
  email text unique not null,
  "emailVerified" timestamptz,
  image text,
  timezone text not null default 'Asia/Seoul',
  created_at timestamptz not null default now()
);

create table if not exists accounts (
  id uuid primary key default uuid_generate_v4(),
  "userId" uuid not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  unique(provider, "providerAccountId")
);

create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  "sessionToken" text unique not null,
  "userId" uuid not null references users(id) on delete cascade,
  expires timestamptz not null
);

create table if not exists verification_tokens (
  identifier text not null,
  token text unique not null,
  expires timestamptz not null,
  primary key (identifier, token)
);

-- ============================================
-- 도메인 테이블
-- ============================================

create table if not exists reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  message_body text,
  template_id uuid,
  cron_expression text not null,
  timezone text not null default 'Asia/Seoul',
  is_active boolean not null default true,
  next_send_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists channel_connections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  channel_type text not null check (channel_type in ('slack', 'kakao')),
  access_token text not null,
  refresh_token text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, channel_type)
);

create table if not exists templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  body text not null,
  variables text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- reminders.template_id FK (templates 테이블 생성 후)
alter table reminders
  add constraint fk_reminders_template
  foreign key (template_id) references templates(id) on delete set null;

create table if not exists reminder_logs (
  id uuid primary key default uuid_generate_v4(),
  reminder_id uuid not null references reminders(id) on delete cascade,
  channel_type text not null check (channel_type in ('slack', 'kakao')),
  status text not null check (status in ('success', 'failure')),
  sent_at timestamptz not null default now(),
  error_message text
);

-- ============================================
-- RLS 정책
-- ============================================

alter table users enable row level security;
alter table reminders enable row level security;
alter table channel_connections enable row level security;
alter table templates enable row level security;
alter table reminder_logs enable row level security;

-- users: 본인 데이터만 조회/수정
create policy "Users can view own data" on users
  for select using (auth.uid() = id);
create policy "Users can update own data" on users
  for update using (auth.uid() = id);

-- reminders: 본인 데이터만 CRUD
create policy "Users can manage own reminders" on reminders
  for all using (auth.uid() = user_id);

-- channel_connections: 본인 데이터만 CRUD
create policy "Users can manage own connections" on channel_connections
  for all using (auth.uid() = user_id);

-- templates: 본인 데이터만 CRUD
create policy "Users can manage own templates" on templates
  for all using (auth.uid() = user_id);

-- reminder_logs: 본인 알람 로그만 조회
create policy "Users can view own logs" on reminder_logs
  for select using (
    reminder_id in (select id from reminders where user_id = auth.uid())
  );

-- ============================================
-- 인덱스
-- ============================================

create index idx_reminders_user_id on reminders(user_id);
create index idx_reminders_next_send_at on reminders(next_send_at) where is_active = true;
create index idx_channel_connections_user_id on channel_connections(user_id);
create index idx_templates_user_id on templates(user_id);
create index idx_reminder_logs_reminder_id on reminder_logs(reminder_id);
create index idx_reminder_logs_sent_at on reminder_logs(sent_at);
```

**Step 3: Supabase 대시보드에서 실행**

Supabase 프로젝트 생성 후 SQL Editor에서 위 SQL을 실행한다.
또는 Supabase CLI를 사용:

```bash
pnpm add -D supabase
pnpm supabase init
pnpm supabase db push
```

**Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add initial DB schema migration with RLS policies"
```

---

## Task 4: NextAuth.js 설정

**Files:**
- Create: `src/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/middleware.ts`

**Step 1: Auth 설정 파일 생성**

Create: `src/auth.ts`

```ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { SupabaseAdapter } from "@auth/supabase-adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SECRET_KEY!,
  }),
  providers: [Google, GitHub],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
```

**Step 2: Route Handler 생성**

Create: `src/app/api/auth/[...nextauth]/route.ts`

```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

**Step 3: Middleware 생성 (인증 보호)**

Create: `src/middleware.ts`

```ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicPaths = ["/", "/login"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith("/api/auth")
  );

  if (isPublic) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

**Step 4: 빌드 검증**

Run: `pnpm build`
Expected: 에러 없이 빌드 성공 (환경변수 없으면 빌드 시 무시됨을 확인)

> 참고: `.env.local`이 없으면 런타임에서 에러가 발생하지만 빌드 자체는 통과해야 한다.

**Step 5: Commit**

```bash
git add src/auth.ts src/app/api/auth/ src/middleware.ts
git commit -m "feat: add NextAuth.js v5 config with Google/GitHub providers"
```

---

## Task 5: shadcn/ui 컴포넌트 추가

**Files:**
- Create: shadcn/ui 컴포넌트들 (Button, Avatar, DropdownMenu, Sidebar 등)

**Step 1: 필요한 shadcn/ui 컴포넌트 설치**

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add avatar
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add sidebar
pnpm dlx shadcn@latest add separator
pnpm dlx shadcn@latest add tooltip
pnpm dlx shadcn@latest add card
```

> 컴포넌트는 `src/shared/ui/`에 자동 생성된다 (`components.json` 설정에 따라).

**Step 2: 설치 확인**

```bash
ls src/shared/ui/
```

Expected: `button.tsx`, `avatar.tsx`, `dropdown-menu.tsx`, `sidebar.tsx` 등이 생성됨

**Step 3: Commit**

```bash
git add src/shared/ui/ components.json
git commit -m "feat: add shadcn/ui components (button, avatar, dropdown-menu, sidebar)"
```

---

## Task 6: 공통 레이아웃 (사이드바 네비게이션)

**Files:**
- Create: `src/widgets/app-sidebar/ui/app-sidebar.tsx`
- Create: `src/widgets/app-sidebar/index.ts`
- Create: `src/features/auth-actions/ui/user-menu.tsx`
- Create: `src/features/auth-actions/index.ts`
- Modify: `src/app/layout.tsx`
- Create: `src/app/(protected)/layout.tsx`

**Step 1: UserMenu 컴포넌트 (features — 클라이언트)**

Create: `src/features/auth-actions/ui/user-menu.tsx`

```tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface UserMenuProps {
  name: string | null;
  email: string;
  image: string | null;
}

export function UserMenu({ name, email, image }: UserMenuProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : email[0].toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-2 hover:bg-accent">
        <Avatar className="h-8 w-8">
          <AvatarImage src={image ?? undefined} alt={name ?? email} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium truncate max-w-[120px]">
          {name ?? email}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Create: `src/features/auth-actions/index.ts`

```ts
export { UserMenu } from "./ui/user-menu";
```

**Step 2: AppSidebar 위젯 (서버 컴포넌트)**

Create: `src/widgets/app-sidebar/ui/app-sidebar.tsx`

```tsx
import Link from "next/link";
import {
  LayoutDashboard,
  Bell,
  Plug,
  FileText,
  ScrollText,
} from "lucide-react";
import { auth } from "@/auth";
import { UserMenu } from "@/features/auth-actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";

const navItems = [
  { title: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { title: "알람", href: "/reminders/new", icon: Bell },
  { title: "채널", href: "/channels", icon: Plug },
  { title: "템플릿", href: "/templates", icon: FileText },
  { title: "로그", href: "/logs", icon: ScrollText },
];

export async function AppSidebar() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="text-lg font-bold">
          Talk Reminder
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <UserMenu
          name={session.user.name ?? null}
          email={session.user.email!}
          image={session.user.image ?? null}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
```

Create: `src/widgets/app-sidebar/index.ts`

```ts
export { AppSidebar } from "./ui/app-sidebar";
```

**Step 3: 보호된 라우트 레이아웃**

Create: `src/app/(protected)/layout.tsx`

```tsx
import { SessionProvider } from "next-auth/react";
import { SidebarProvider, SidebarInset } from "@/shared/ui/sidebar";
import { AppSidebar } from "@/widgets/app-sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
```

**Step 4: 대시보드 placeholder 페이지**

Create: `src/app/(protected)/dashboard/page.tsx`

```tsx
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-bold">대시보드</h1>
      <p className="text-muted-foreground mt-2">
        환영합니다, {session?.user?.name ?? "사용자"}님!
      </p>
    </div>
  );
}
```

**Step 5: 나머지 placeholder 페이지들**

Create: `src/app/(protected)/channels/page.tsx`

```tsx
export default function ChannelsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">채널 관리</h1>
      <p className="text-muted-foreground mt-2">Phase 2에서 구현 예정</p>
    </div>
  );
}
```

Create: `src/app/(protected)/reminders/new/page.tsx`

```tsx
export default function NewReminderPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">알람 생성</h1>
      <p className="text-muted-foreground mt-2">Phase 3에서 구현 예정</p>
    </div>
  );
}
```

Create: `src/app/(protected)/templates/page.tsx`

```tsx
export default function TemplatesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">템플릿</h1>
      <p className="text-muted-foreground mt-2">Phase 3에서 구현 예정</p>
    </div>
  );
}
```

Create: `src/app/(protected)/logs/page.tsx`

```tsx
export default function LogsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">발송 로그</h1>
      <p className="text-muted-foreground mt-2">Phase 4에서 구현 예정</p>
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add app sidebar layout with navigation and placeholder pages"
```

---

## Task 7: 랜딩 페이지

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: 루트 레이아웃 메타데이터 업데이트**

Modify: `src/app/layout.tsx`

`metadata`를 다음으로 변경:

```ts
export const metadata: Metadata = {
  title: "Talk Reminder",
  description:
    "Slack과 카카오톡으로 유연한 반복 알람을 보내는 통합 알람 관리 서비스",
};
```

`<html lang="en">`을 `<html lang="ko">`로 변경.

**Step 2: 랜딩 페이지 작성**

Modify: `src/app/page.tsx`

```tsx
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Bell, MessageSquare, Clock, ArrowRight } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "채널 통합",
    description: "Slack, 카카오톡을 한 곳에서 관리하세요.",
  },
  {
    icon: Clock,
    title: "유연한 스케줄",
    description: "매주 월·수·금 오전 9시, 매월 마지막 금요일 등 세밀한 반복 설정.",
  },
  {
    icon: Bell,
    title: "메시지 템플릿",
    description: "변수를 활용한 재사용 가능한 메시지 템플릿.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-12 px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Talk Reminder
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Slack과 카카오톡으로 유연한 반복 알람을 보내는 통합 알람 관리 서비스
        </p>
        <Button asChild size="lg" className="mt-4">
          <Link href="/login">
            시작하기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid max-w-2xl gap-6 sm:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col items-center gap-2 text-center"
          >
            <feature.icon className="h-8 w-8 text-primary" />
            <h2 className="font-semibold">{feature.title}</h2>
            <p className="text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: 테스트 — 랜딩 페이지 렌더링**

Create: `src/app/__tests__/page.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "../page";

describe("HomePage", () => {
  it("renders the service name", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "Talk Reminder" })
    ).toBeInTheDocument();
  });

  it("renders the CTA button linking to /login", () => {
    render(<HomePage />);
    const cta = screen.getByRole("link", { name: /시작하기/i });
    expect(cta).toHaveAttribute("href", "/login");
  });

  it("renders 3 feature cards", () => {
    render(<HomePage />);
    expect(screen.getByText("채널 통합")).toBeInTheDocument();
    expect(screen.getByText("유연한 스케줄")).toBeInTheDocument();
    expect(screen.getByText("메시지 템플릿")).toBeInTheDocument();
  });
});
```

**Step 4: 테스트 실행**

Run: `pnpm test src/app/__tests__/page.test.tsx`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx src/app/__tests__/
git commit -m "feat: add landing page with service intro and CTA"
```

---

## Task 8: 로그인 페이지

**Files:**
- Create: `src/features/social-login/ui/social-login-buttons.tsx`
- Create: `src/features/social-login/index.ts`
- Create: `src/app/(public)/login/page.tsx`

**Step 1: SocialLoginButtons (features — 클라이언트)**

Create: `src/features/social-login/ui/social-login-buttons.tsx`

```tsx
"use client";

import { Button } from "@/shared/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface SocialLoginButtonProps {
  callbackUrl?: string;
}

export function SocialLoginButtons({
  callbackUrl = "/dashboard",
}: SocialLoginButtonProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleLogin = (provider: string) => {
    setLoading(provider);
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="flex flex-col gap-3">
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
        GitHub로 계속하기
      </Button>
    </div>
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

Create: `src/features/social-login/index.ts`

```ts
export { SocialLoginButtons } from "./ui/social-login-buttons";
```

**Step 2: 로그인 페이지 (public 라우트)**

Create: `src/app/(public)/login/page.tsx`

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { SocialLoginButtons } from "@/features/social-login";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl, error } = await searchParams;

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Talk Reminder</CardTitle>
          <p className="text-sm text-muted-foreground">
            계정으로 로그인하세요
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 text-center text-sm text-destructive">
              로그인에 실패했습니다. 다시 시도해주세요.
            </p>
          )}
          <SocialLoginButtons callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: 테스트 — 로그인 페이지**

Create: `src/features/social-login/ui/__tests__/social-login-buttons.test.tsx`

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SocialLoginButtons } from "../social-login-buttons";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

describe("SocialLoginButtons", () => {
  it("renders Google and GitHub login buttons", () => {
    render(<SocialLoginButtons />);
    expect(
      screen.getByRole("button", { name: /Google로 계속하기/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /GitHub로 계속하기/i })
    ).toBeInTheDocument();
  });
});
```

**Step 4: 테스트 실행**

Run: `pnpm test src/features/social-login/`
Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add login page with Google/GitHub social login buttons"
```

---

## Task 9: 전체 통합 검증

**Step 1: 전체 테스트 실행**

Run: `pnpm test`
Expected: 모든 테스트 PASS

**Step 2: Lint 실행**

Run: `pnpm lint`
Expected: 에러 없음

**Step 3: 빌드 검증**

Run: `pnpm build`
Expected: 빌드 성공 (환경변수 없이도 빌드 자체는 통과)

> 환경변수가 설정되지 않으면 Supabase/NextAuth 관련 런타임 에러가 발생할 수 있으나
> 빌드 타임에는 타입 검증만 통과하면 된다.

**Step 4: 수동 검증 (환경변수 설정 후)**

`.env.local`에 실제 값을 넣고:

```bash
pnpm dev
```

1. `http://localhost:3000` → 랜딩 페이지 확인 (Talk Reminder 제목, 시작하기 버튼)
2. "시작하기" 클릭 → `/login` 이동 확인
3. Google 로그인 → `/dashboard`로 리다이렉트 확인
4. 사이드바 네비게이션 확인 (대시보드, 알람, 채널, 템플릿, 로그)
5. 사용자 아바타 + 로그아웃 동작 확인
6. 로그아웃 후 `/dashboard` 접근 → `/login` 리다이렉트 확인

**Step 5: 최종 Commit**

```bash
git add -A
git commit -m "chore: phase 1 foundation complete — auth, layout, DB schema"
```

---

## 체크리스트 (PRD AC 대응)

| AC | 설명 | Task |
|----|------|------|
| AC-01 | Google 로그인 → `/dashboard` | Task 4, 8 |
| AC-02 | GitHub 로그인 → `/dashboard` | Task 4, 8 |
| AC-03 | 사용자 정보 Supabase 저장 | Task 3, 4 |
| AC-04 | 미인증 → `/login` 리다이렉트 | Task 4 (middleware) |
| AC-05 | 로그아웃 후 보호 페이지 → `/login` | Task 6 (UserMenu) |
| AC-06 | 레이아웃에 사용자 이름/아바타 표시 | Task 6 (AppSidebar) |
