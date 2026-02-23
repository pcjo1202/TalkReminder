---
title: 아키텍처
description: FSD(Feature-Sliced Design) 레이어 구조, 레이어별 역할과 규칙, 환경 변수 정책
---

# 아키텍처 (FSD — Feature-Sliced Design)

## 레이어별 역할 및 규칙

| 레이어 | 역할 | 서버 컴포넌트 | `"use client"` |
|--------|------|:---:|:---:|
| `app` | Next.js 라우팅, 레이아웃, API 핸들러 | 기본 | 필요 시 |
| `views` | 페이지 전체 구조 조합 | 기본 | 지양 |
| `widgets` | 독립 복합 블록 | 기본 | 지양 |
| `features` | 인터랙션 기능 (폼, 버튼 액션 등) | — | **허용** |
| `entities` | 도메인 모델 UI (카드, 목록 표시 등) | **전용** | **금지** |
| `shared` | 범용 유틸, UI 프리미티브 | — | 필요 시 |

## 슬라이스 내부 구조

```
features/create-reminder/
├── ui/           # 컴포넌트 (create-reminder-form.tsx)
├── model/        # 상태, 훅, 비즈니스 로직
├── api/          # 서버 액션 또는 fetch 함수
└── index.ts      # Public API — 외부에 노출할 것만 export
```

> **Public API 원칙**: 슬라이스 외부에서는 반드시 `index.ts`를 통해서만 접근. 내부 파일 직접 import 금지.

---

## 슬라이스 분리 기준

### features — 사용자 액션 단위로 분리

하나의 독립된 사용자 행동 = 하나의 슬라이스.

```
✅ features/create-reminder/   # "리마인더를 만든다"
✅ features/delete-reminder/   # "리마인더를 삭제한다"
✅ features/toggle-channel/    # "채널을 켜고 끈다"

❌ features/reminder/          # 너무 넓음 — 여러 액션이 섞임
❌ features/reminder-form/     # UI 단위로 분리하지 않음
```

### entities — 도메인 모델 단위로 분리

비즈니스 개념(명사) 하나 = 하나의 슬라이스.

```
✅ entities/reminder/   # 리마인더 카드, 목록 아이템 등 표시 컴포넌트
✅ entities/user/       # 사용자 프로필, 아바타 등
✅ entities/channel/    # 채널 배지, 상태 표시 등

❌ entities/ui/         # 도메인 개념이 없는 단순 UI → shared/ui/로
```

### widgets — 페이지 내 독립 블록 단위로 분리

특정 페이지 영역에서 독립적으로 동작하는 복합 블록 = 하나의 슬라이스.

```
✅ widgets/reminder-list/      # 리마인더 목록 전체 블록
✅ widgets/dashboard-header/   # 대시보드 상단 영역
```

### 새 슬라이스를 만들지 않아도 될 때

| 상황 | 처리 방법 |
|------|----------|
| 기존 슬라이스 내 단순 분기 컴포넌트 | 기존 슬라이스 `ui/`에 파일 추가 |
| 특정 슬라이스에서만 쓰는 유틸 | 해당 슬라이스 `model/` 내부에 |
| 재사용 가능한 순수 UI | `shared/ui/`로 |

---

## 슬라이스 간 참조 규칙

같은 레이어의 슬라이스끼리는 서로 import하지 않는다.

```
❌ features/delete-reminder 에서 features/create-reminder import
❌ entities/reminder 에서 entities/user import
```

**해결 방법:**

| 상황 | 방법 |
|------|------|
| Feature A와 B가 같은 로직을 공유 | `shared/lib/`으로 추출 |
| Feature A와 B를 조합해야 함 | 상위 레이어인 `widgets/`에서 조합 |
| Entity A가 Entity B를 표시해야 함 | `widgets/`에서 두 entity를 함께 렌더링 |

---

## shared 이동 기준

슬라이스 내부에 둘지 shared로 올릴지 판단 기준:

```
2개 이상의 슬라이스에서 사용  →  shared/로 이동
1개 슬라이스에서만 사용       →  슬라이스 내부에 유지
```

| shared 세그먼트 | 무엇을 두는가 |
|----------------|-------------|
| `shared/ui/` | shadcn/ui 컴포넌트, 순수 표시 UI |
| `shared/lib/` | Supabase 클라이언트, 유틸 함수, 포맷터 |
| `shared/hooks/` | 도메인 무관 범용 훅 (`use-debounce`, `use-media-query`) |
| `shared/types/` | 여러 레이어에서 공유하는 TypeScript 타입 |

> **주의**: `shared`에 비즈니스 로직 금지. 순수 유틸과 기반 코드만.

---

## 안티패턴

```ts
// ❌ entities에 인터랙션 코드
// entities/reminder/ui/reminder-card.tsx
export function ReminderCard() {
  const [open, setOpen] = useState(false)  // 금지
  return <div onClick={() => setOpen(true)}>...</div>  // 금지
}

// ❌ 같은 레이어 슬라이스 간 직접 참조
// features/delete-reminder/ui/delete-button.tsx
import { CreateReminderForm } from '@/features/create-reminder'  // 금지

// ❌ index.ts 우회
import { something } from '@/features/create-reminder/ui/form'  // 금지
import { something } from '@/features/create-reminder'  // ✅ index.ts 경유

// ❌ shared에 도메인 로직
// shared/lib/reminder-validator.ts  — 리마인더 도메인 로직은 features/로
```

---

## 환경 변수 규칙

`NEXT_PUBLIC_` 접두사가 없는 변수는 서버에서만 사용. 클라이언트 코드 참조 금지.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=         # 서버 전용

# Database
DATABASE_URL=                # Supabase PostgreSQL 연결 문자열

# Better Auth
BETTER_AUTH_SECRET=          # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
```
