---
paths:
  - "src/**/*.tsx"
---

## Server vs Client Component 판단

| 질문 | Server (기본) | Client (`"use client"`) |
|------|:---:|:---:|
| `useState`, `useEffect`, `useRef` 사용? | | O |
| `onClick`, `onChange` 등 이벤트 핸들러? | | O |
| 브라우저 API (`window`, `localStorage`)? | | O |
| 데이터 fetch (Supabase 서버 클라이언트)? | O | |
| 단순 props 받아서 표시만? | O | |
| `async` 컴포넌트? | O | |

- 판단이 애매하면 Server Component로 시작 — 필요할 때 Client로 전환

## `"use client"` 경계 규칙

- **FSD 레이어별:**
  - `entities` — `"use client"` **금지** (순수 표시 전용)
  - `features` — `"use client"` **허용** (인터랙션의 시작점)
  - `widgets` — 지양. 내부 features에 위임
  - `shared/ui` — 필요 시 허용 (인터랙티브 UI 프리미티브)

- **경계는 최대한 아래로 밀어넣기:**

```
// ❌ widget 전체를 Client로
"use client"
export function ReminderList() { ... }

// ✅ widget은 Server, 인터랙션 부분만 features에서 Client
// widgets/reminder-list/ui/reminder-list.tsx (Server)
import { DeleteReminderButton } from "@/features/delete-reminder"
export function ReminderList({ reminders }) {
  return reminders.map(r => <div key={r.id}>{r.title} <DeleteReminderButton id={r.id} /></div>)
}
```

## 컴포넌트 선언

- `function` 선언 사용 (화살표 함수 X) — React Compiler displayName 추론
- `export` 직접 사용. `export default` 지양 (named export로 Public API 명확화)
- 한 파일에 한 컴포넌트 원칙. 작은 헬퍼 컴포넌트는 같은 파일에 허용하되 export 금지

## shadcn/ui 사용 규칙

- `src/shared/ui/`에 위치 (shadcn CLI가 자동 배치)
- 커스터마이징 시 원본 파일 직접 수정 — wrapper 컴포넌트 생성 금지
- 조건부 className은 반드시 `cn()` 유틸 사용
- 새 컴포넌트 추가: `pnpm dlx shadcn@latest add <컴포넌트명>`

## props 패턴

- props 타입: `interface <컴포넌트명>Props` (예: `interface ReminderCardProps`)
- children이 필요한 경우: `React.PropsWithChildren<Props>` 또는 `children: React.ReactNode`
- 이벤트 핸들러 props: `on` prefix (예: `onDelete`, `onToggle`)
- 서버 → 클라이언트 데이터 전달: serializable props만 (함수, Date 객체 등 금지)
