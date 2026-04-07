---
name: make-component
description: >
  FSD 아키텍처에 맞게 공통/재사용 컴포넌트를 생성한다. 다음 상황에서 반드시 이 스킬을 사용하라:
  - "컴포넌트 만들어줘", "공통 컴포넌트 추가해줘", "shared/ui에 넣어줘" 등
  - UI 컴포넌트를 새로 만들거나 추가해달라는 요청
  - shared/ui, entities, widgets, features 중 어디에 둘지 판단이 필요한 경우
  - shadcn/ui 패턴의 버튼, 카드, 뱃지, 인풋 등 범용 UI 요소 생성
  - 도메인 모델 표시 컴포넌트(ReminderCard, ChannelBadge 등) 생성
  파일 생성, index.ts 업데이트, 테스트 파일까지 모두 처리한다.
---

# 공통 컴포넌트 생성 스킬

이 프로젝트는 **FSD(Feature-Sliced Design)** 아키텍처를 사용한다. 컴포넌트를 만들기 전에 반드시 올바른 레이어를 결정해야 한다 — 위치가 잘못되면 의존성 규칙을 위반하게 된다.

## 1단계: 레이어 결정

아래 순서대로 판단한다.

```
질문 1: 도메인(비즈니스 개념)과 무관한 순수 UI인가?
  → YES → shared/ui/

질문 2: 특정 도메인 모델을 "표시"만 하는가? (클릭/상태 없음)
  → YES → entities/{도메인}/ui/

질문 3: 여러 도메인을 합쳐서 보여주는 독립 블록인가?
  → YES → widgets/{이름}/ui/

질문 4: 클릭, 폼 제출, 상태 변경 등 인터랙션이 포함되는가?
  → YES → features/{액션}/ui/
```

### 레이어별 규칙 요약

| 레이어 | 위치 | "use client" | onClick/useState | 도메인 로직 |
|--------|------|:---:|:---:|:---:|
| `shared/ui` | `src/shared/ui/` | 필요 시만 | ❌ | ❌ |
| `entities` | `src/entities/{도메인}/ui/` | **금지** | **금지** | ❌ |
| `widgets` | `src/widgets/{이름}/ui/` | 지양 | ❌ | ❌ |
| `features` | `src/features/{액션}/ui/` | **허용** | ✅ | ✅ |

**핵심**: `entities`는 절대로 인터랙션 코드를 가지면 안 된다. onClick, useState, useEffect 모두 금지.

---

## 2단계: 파일 생성

### shared/ui 컴포넌트 패턴

shadcn/ui 스타일을 따른다. 단순한 컴포넌트는 `React.ComponentProps` 확장으로, 변형(variant)이 필요하면 `cva`를 사용한다.

**단순 컴포넌트 (variant 없음):**
```tsx
// src/shared/ui/status-badge.tsx
import * as React from "react"
import { cn } from "@/shared/lib/utils"

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  // 추가 props만 정의
}

function StatusBadge({ className, children, ...props }: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { StatusBadge }
```

**variant가 있는 컴포넌트 (cva 사용):**
```tsx
// src/shared/ui/alert.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive",
        success: "border-green-500/50 text-green-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Alert, alertVariants }
```

### entities 컴포넌트 패턴

서버 컴포넌트 전용. props는 interface로, `cn()` 사용. "use client" 절대 금지.

```tsx
// src/entities/reminder/ui/reminder-card.tsx
import { cn } from "@/shared/lib/utils"
import { Card, CardContent } from "@/shared/ui/card"

interface ReminderCardProps {
  title: string
  scheduledAt: string
  channel: string
  className?: string
}

function ReminderCard({ title, scheduledAt, channel, className }: ReminderCardProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="text-muted-foreground text-xs mt-1">{scheduledAt}</p>
        <span className="text-xs text-primary">{channel}</span>
      </CardContent>
    </Card>
  )
}

export { ReminderCard }
```

### features 컴포넌트 패턴

"use client" 선언. 인터랙션 로직 포함 가능.

```tsx
// src/features/create-reminder/ui/create-reminder-button.tsx
"use client"

import { useState } from "react"
import { Button } from "@/shared/ui/button"

interface CreateReminderButtonProps {
  onSuccess?: () => void
}

function CreateReminderButton({ onSuccess }: CreateReminderButtonProps) {
  const [isPending, setIsPending] = useState(false)

  async function handleClick() {
    setIsPending(true)
    // 액션 처리
    setIsPending(false)
    onSuccess?.()
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? "처리 중..." : "리마인더 만들기"}
    </Button>
  )
}

export { CreateReminderButton }
```

---

## 3단계: index.ts 업데이트

컴포넌트가 속한 슬라이스의 `index.ts`에 public API를 추가한다. **외부에서 직접 파일을 import하는 것은 금지**되므로, 반드시 `index.ts`를 통해서만 접근할 수 있게 한다.

```ts
// src/entities/reminder/index.ts
export { ReminderCard } from "./ui/reminder-card"
// 기존 export는 유지하고 새 줄 추가
```

`shared/ui/`는 각 파일이 독립적으로 사용되므로 별도 `index.ts`가 없어도 된다 — 파일 경로로 직접 import(`@/shared/ui/button`).

---

## 4단계: 테스트 파일 생성

컴포넌트 위치의 `__tests__/` 또는 같은 디렉토리에 `.test.tsx` 파일을 만든다.

```tsx
// src/entities/reminder/ui/__tests__/reminder-card.test.tsx
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ReminderCard } from "../reminder-card"

describe("ReminderCard", () => {
  it("제목을 렌더링한다", () => {
    render(
      <ReminderCard
        title="회의 알림"
        scheduledAt="2026-03-12 09:00"
        channel="KakaoTalk"
      />
    )
    expect(screen.getByText("회의 알림")).toBeInTheDocument()
  })

  it("className prop을 적용한다", () => {
    const { container } = render(
      <ReminderCard
        title="테스트"
        scheduledAt="2026-03-12"
        channel="SMS"
        className="custom-class"
      />
    )
    expect(container.firstChild).toHaveClass("custom-class")
  })
})
```

---

## 체크리스트

컴포넌트 생성 후 확인:

- [ ] 올바른 레이어에 배치됐는가?
- [ ] 파일명이 `kebab-case.tsx`인가?
- [ ] props가 `interface`로 정의됐는가?
- [ ] 조건부 className에 `cn()`을 사용했는가?
- [ ] `entities`에 "use client", onClick, useState가 없는가?
- [ ] `index.ts`에 export를 추가했는가? (shared/ui 제외)
- [ ] 테스트 파일을 생성했는가?

---

## 안티패턴

```tsx
// ❌ entities에 인터랙션
"use client"
export function ReminderCard() {
  const [open, setOpen] = useState(false)       // 금지
  return <div onClick={() => setOpen(true)} />  // 금지
}

// ❌ any 사용
interface Props {
  data: any  // 금지 — 구체적인 타입 정의할 것
}

// ❌ className에 cn() 미사용
<div className={`base-class ${className}`} />  // 금지
<div className={cn("base-class", className)} />  // ✅

// ❌ index.ts 우회
import { ReminderCard } from "@/entities/reminder/ui/reminder-card"  // 금지
import { ReminderCard } from "@/entities/reminder"  // ✅
```
