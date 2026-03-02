---
title: 아키텍처
description: FSD(Feature-Sliced Design) 레이어 구조, 레이어별 역할과 규칙, 환경 변수 정책
---

# 아키텍처 (FSD — Feature-Sliced Design)

> [Feature-Sliced Design](https://feature-sliced.design/)은 프론트엔드 애플리케이션을 구조화하기 위한 아키텍처 방법론으로, 변화하는 비즈니스 요구사항 속에서 프로젝트의 안정성과 확장성을 보장하기 위한 규칙과 관습을 제공한다.

## FSD 핵심 개념

FSD는 코드를 **레이어(Layers) → 슬라이스(Slices) → 세그먼트(Segments)** 3단계 계층으로 조직한다.

```
src/
├── app/                          ← 레이어 (슬라이스 없음)
├── views/                        ← 레이어
│   └── dashboard/                ← 슬라이스
│       ├── ui/                   ← 세그먼트
│       └── model/                ← 세그먼트
├── widgets/                      ← 레이어
│   └── reminder-list/            ← 슬라이스
├── features/                     ← 레이어
│   └── create-reminder/          ← 슬라이스
├── entities/                     ← 레이어
│   └── reminder/                 ← 슬라이스
└── shared/                       ← 레이어 (슬라이스 없음)
    ├── ui/                       ← 세그먼트
    └── lib/                      ← 세그먼트
```

**레이어** — 코드의 책임 범위를 결정하는 표준화된 계층. 상위 레이어는 하위 레이어만 import 가능.

**슬라이스** — 비즈니스 도메인별로 코드를 분할하는 단위. 이름은 자유롭게 지정하며, 비즈니스 언어를 사용한다. **같은 레이어의 슬라이스끼리는 서로 import할 수 없다** — 이것이 높은 응집도와 낮은 결합도를 보장하는 핵심 규칙이다. `app`과 `shared` 레이어에는 슬라이스가 없다.

**세그먼트** — 슬라이스 내부에서 기술적 목적에 따라 코드를 분류하는 단위 (`ui`, `model`, `api`, `lib`, `config`).

---

## 레이어별 역할 및 규칙

의존성 방향: `app → views → widgets → features → entities → shared` (상위 → 하위만 허용)

| 레이어 | FSD 역할 | 프로젝트 적용 | 서버 컴포넌트 | `"use client"` |
|--------|----------|-------------|:---:|:---:|
| `app` | 앱 실행에 필요한 모든 것 — 라우팅, 진입점, 전역 스타일, 프로바이더 | Next.js 라우팅, 레이아웃, API 핸들러 | 기본 | 필요 시 |
| `views` | 전체 페이지 또는 중첩 라우팅의 큰 부분 | 페이지 전체 구조 조합 | 기본 | 지양 |
| `widgets` | 독립적으로 동작하는 대규모 기능·UI 청크 | 독립 복합 블록 | 기본 | 지양 |
| `features` | 재사용 가능한 제품 기능의 구현체 | 인터랙션 기능 (폼, 버튼 액션 등) | — | **허용** |
| `entities` | 프로젝트가 다루는 비즈니스 엔티티 | 도메인 모델 UI (카드, 목록 표시 등) | **전용** | **금지** |
| `shared` | 프로젝트 특성과 분리된 재사용 가능한 기능 | 범용 유틸, UI 프리미티브 | — | 필요 시 |

---

## 세그먼트 (슬라이스 내부 구조)

세그먼트는 슬라이스 내부에서 **기술적 목적**에 따라 코드를 분류한다.

| 세그먼트 | FSD 정의 | 프로젝트 적용 |
|----------|----------|-------------|
| `ui` | UI 컴포넌트, 포맷터, 스타일 | 컴포넌트 (`create-reminder-form.tsx`) |
| `model` | 스키마, 인터페이스, 스토어, 비즈니스 로직 | 상태, 훅, 비즈니스 로직 |
| `api` | 백엔드 인터랙션, 데이터 타입, 매퍼 | 서버 액션 또는 fetch 함수 |
| `lib` | 슬라이스 내부에서 사용하는 라이브러리 코드 | 슬라이스 전용 유틸 |
| `config` | 설정값, 피처 플래그 | (필요 시 사용) |

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

슬라이스는 **비즈니스 도메인**별로 코드를 분할한다. 이름은 기술 용어가 아닌 **제품 언어**를 사용하며, 필요한 만큼 자유롭게 만들 수 있다.

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

FSD의 두 가지 핵심 import 규칙:

1. **레이어 규칙** — 상위 레이어의 모듈은 하위 레이어만 import 가능 (예: `features` → `entities` ✅, `entities` → `features` ❌)
2. **슬라이스 격리 규칙** — 같은 레이어의 슬라이스끼리는 서로 import할 수 없다

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
