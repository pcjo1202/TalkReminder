# TalkReminder 하네스 아키텍처 설계

- 날짜: 2026-03-30
- 상태: 승인 대기

## 개요

TalkReminder 프로젝트의 Claude Code 하네스를 체계적으로 구성하는 설계.
토큰 효율, 일관성, 확장성, 팀 전파 가능성을 동시에 달성한다.

## 핵심 원칙

1. **컨텍스트 윈도우가 가장 중요한 자원이다** — CLAUDE.md에 넣는 모든 줄이 매 세션마다 토큰을 소비한다. 불필요한 내용은 중요한 지시를 묻히게 만든다.
2. **문서는 Advisory, Hook은 Deterministic** — 강제해야 하는 것은 hook으로, 안내해야 하는 것은 CLAUDE.md로.
3. **Progressive Disclosure** — 모든 지식을 CLAUDE.md에 넣지 않고, skills/rules/하위 CLAUDE.md로 분리해서 필요할 때만 로드.
4. **성공은 침묵, 실패만 노출** — 빌드/테스트 성공 시 출력을 삼키고, 에러만 표면화.

## 하네스 계층 구조

7개의 구성 요소가 각각 명확한 역할을 가진다:

| 계층 | 로드 시점 | 토큰 비용 | 역할 |
|------|-----------|-----------|------|
| CLAUDE.md (루트) | 매 세션 시작 | 항상 소비 | 빌드 명령어, 핵심 규칙 요약, @참조 |
| 하위 CLAUDE.md | 해당 디��토리 작업 시 | 조건부 | 레이어/��라이스별 규칙과 도메인 컨텍스트 |
| rules/ | 경로 패턴 매칭 시 | 조건부 | 여러 디렉토리에 걸치는 크로스커팅 규칙 |
| skills/ | Claude가 관련성 판단 시 | 온디맨드 | 도메인 지식 (Supabase, auth, Tailwind) |
| agents/ | 명시적 호출 시 | 격리됨 | 별도 컨텍스트에서 전문 작업 |
| commands/ | 사용자 슬래시 커맨드 | 호출 시 | 반복 워크플로 자동화 |
| hooks (settings.json) | 이벤트 발생 시 | 0 (셸 실행) | 100% 강제 규칙 |

## 폴더 구조

```
TalkReminder/
├── CLAUDE.md                         # ~30줄. 명령어, 스택, 핵심 규칙 요약
├── CLAUDE.local.md                   # 개인 오버라이드 (gitignored)
├── .mcp.json                         # Supabase MCP
│
├── .claude/
│   ├── settings.json                 # 권한 + hooks (committed)
│   ├── settings.local.json           # 개인 권한 (gitignored)
│   │
│   ├── rules/                        # 크로스커팅 규칙 (committed)
│   │   ├── fsd-dependencies.md       #   src/** → 의존성 방향
│   │   └── testing.md                #   *.test.* → 테스트 컨벤션
│   │
│   ├── skills/                       # 온디맨드 도메인 지식 (committed)
│   │   ├── supabase-patterns/
│   │   │   └── SKILL.md
│   │   ├── auth-patterns/
│   │   │   └── SKILL.md
│   │   ├── fsd-new-slice/
│   │   │   └── SKILL.md
│   │   └── tailwind-v4/
│   │       └── SKILL.md
│   │
│   ├── agents/                       # 전문 서브에이전트 (committed)
│   │   └── fsd-reviewer.md
│   │
│   └── commands/                     # 커스텀 슬래시 커맨드 (committed)
│       ├── new-feature.md            #   /project:new-feature
│       └── db-migration.md           #   /project:db-migration
│
├── src/
│   ├── app/
│   │   └── CLAUDE.md                 # 라우팅, 레이아웃, API 핸들러 규칙
│   ├── views/
│   │   └── CLAUDE.md                 # 페이지 단위 조합 (서버 컴포넌트)
│   ├── features/
│   │   ├── CLAUDE.md                 # 레이어 공통 규칙
│   │   ├── auth-actions/CLAUDE.md    # 슬라이스 도메인 컨텍스트
│   │   ├── social-login/CLAUDE.md
│   │   └── toggle-channel/CLAUDE.md
│   ├── entities/
│   │   ├── CLAUDE.md                 # 레이어 공통 규칙
│   │   └── reminder/CLAUDE.md        # 슬라이스 도메인 컨텍스트
│   ├── widgets/
│   │   ├── CLAUDE.md
│   │   └── app-sidebar/CLAUDE.md
│   └── shared/
│       └── CLAUDE.md                 # shared 레이어 규칙
│
├── docs/
│   ├── architecture.md               # FSD 상세 (기존)
│   ├── auth.md                       # better-auth (기존)
│   ├── database.md                   # Supabase (기존)
│   ├── styling.md                    # Tailwind v4 (기존)
│   ├── testing.md                    # Vitest (기존)
│   ├── workflow.md                   # 스킬 호출 순서 (기존)
│   ├── decisions/                    # ADR — 의사결정 기록
│   │   └── (NNN-<title>.md)
│   ├── specs/
│   └── plans/
│
└── .agents/                          # 외부 마켓플레이스 스킬 캐시 (gitignored, 자동 관리)
```

## 루트 CLAUDE.md 내용

~30줄로 제한. 매 세션 로드되므로 토큰 효율이 핵심.

```markdown
# TalkReminder

통합 알람 관리 서비스 (KakaoTalk, SMS, Slack)

## 명령어
pnpm dev / build / start / lint / test / coverage

> 패키지 매니저는 pnpm. npm/yarn 사용 금지.

## 기술 스택
Next.js 16 (App Router, RSC, React Compiler) + Tailwind v4 + shadcn/ui + Supabase + better-auth + Vitest

## 아키텍처 (FSD)
의존성 방향: app → views → widgets → features → entities → shared
슬라이스 외부 접근은 반드시 index.ts를 통해서만
→ 상세: @docs/architecture.md

## 코드 규약
파일명: kebab-case.tsx (컴포넌트), kebab-case.ts (모듈), use-<name>.ts (훅)
props: interface. any 금지. className 조건부: cn() 필수.

## 상세 문서
- @docs/workflow.md — 스킬 호출 순서
- @docs/architecture.md — FSD 상세
- @docs/database.md — Supabase
- @docs/auth.md — better-auth
- @docs/styling.md — Tailwind v4
- @docs/testing.md — Vitest
```

### 현재 CLAUDE.md → 제안 CLAUDE.md 마이그레이션 맵

현재 루트 CLAUDE.md에서 제거되는 내용과 이동 대상:

| 현재 내용 | 이동 대상 | 이유 |
|-----------|-----------|------|
| FSD 핵심 원칙 (entities 금지, features 허용 등) | `src/entities/CLAUDE.md`, `src/features/CLAUDE.md` | 레이어별 CLAUDE.md에서 해당 경로 작업 시 자동 로드 |
| "use client" 경계 규칙 | `.claude/rules/fsd-dependencies.md` | 여러 레이어에 걸치는 규칙 |
| shadcn/ui 우선 활용, cn() 사용 | `src/shared/CLAUDE.md` | shared 레이어 작업 시 자동 로드 |
| Supabase 상세 | `.claude/skills/supabase-patterns/SKILL.md` | 온디맨드 지식 |
| better-auth 상세 | `.claude/skills/auth-patterns/SKILL.md` | 온디맨드 지식 |
| Tailwind v4 상세 | `.claude/skills/tailwind-v4/SKILL.md` | 온디맨드 지식 |
| Vitest 언급 | 루트에 유지 (기술 스택 한 줄에 포함) | 테스트 러너는 전역 정보 |
| reactCompiler: true | 루트에 유지 (기술 스택 한 줄에 포함) | React Compiler로 표현 |
| 파일명 상세 (훅 네이밍) | 루트에 유지 (코드 규약에 추가) | 전역 네이밍 규칙 |

## 하위 CLAUDE.md 설계

### 분리 원칙

- **레이어 CLAUDE.md** (`src/<layer>/CLAUDE.md`): 해당 레이어의 공통 제약
- **슬라이스 CLAUDE.md** (`src/<layer>/<slice>/CLAUDE.md`): 도메인 비즈니스 컨텍스트
- **주의사항 섹션**: 어쩔 수 없는 우회, 기술 부채는 `## 주의사항`으로 기술

### 레이어 CLAUDE.md 예시

#### src/entities/CLAUDE.md

```markdown
# entities 레이어

순수 표시(display-only) 전용 서버 컴포넌트 레이어.

## 금지사항
- "use client" 금지
- onClick, onChange 등 이벤트 핸들러 금지
- useState, useEffect, useCallback 등 클라이언트 훅 금지
- features/ 이상 레이어 import 금지

## 허용
- shared/ import만 가능
- props로 데이터를 받아 렌더링만 수행
```

#### src/features/CLAUDE.md

```markdown
# features 레이어

사용자 인���랙션 기능 담당. "use client" 허용되는 최상위 레이어.

## 규칙
- "use client" 경계는 이 레이어 내부에서만 시작
- entities/, shared/ import 가능. widgets/, views/, app/ import 금지
- Server Action은 api/ 또는 actions/ 세그먼트에 배치
- 슬라이스 간 직접 import 금지 (features/A → features/B ✗)
```

#### src/shared/CLAUDE.md

```markdown
# shared 레이어

모든 레이어에서 사용하는 공통 코드. 비즈니스 로직 금지.

## UI (src/shared/ui/)
- shadcn/ui 컴포넌트 우선 사용. 추가: npx shadcn@latest add <name>
- 조건부 className은 반드시 cn() 사용 (shared/lib/utils.ts)

## Supabase 클라이언트 (src/shared/lib/supabase/)
- client.ts: 브라우저용 (createBrowserClient)
- server.ts: SSR용 (createServerClient + cookies)
- admin.ts: service role (서버 전용, RLS 우회)
```

### 슬라이스 CLAUDE.md 예시

#### src/features/toggle-channel/CLAUDE.md

```markdown
# toggle-channel 슬라이스

채널(KakaoTalk, SMS, Slack)의 활성화/비활성화를 토글하는 기능.

## 도메인 컨텍스트
- Supabase 테이블: channels (user_id, channel_type, is_active)
- Server Action: toggle-channel-action.ts → Supabase update
- Optimistic UI: 스위치 토글 즉시 반영, 실패 시 롤백

## 테스트
- toggle-channel-switch.test.tsx: 토글 상태 변경 + 접근성 검증
```

## rules/ 설계

경로 스코프 frontmatter를 사용해 여러 디렉토리에 걸치는 규칙을 정의.

### .claude/rules/fsd-dependencies.md

```yaml
---
paths:
  - "src/**"
---
```

```markdown
# FSD 의존성 규칙

의존성 방향은 단방향: app → views → widgets → features → entities → shared
같은 레이어의 다른 슬라이스를 ���접 import하지 않는다.
슬라이스의 public API는 반드시 index.ts를 통해서만 노출한다.
```

### .claude/rules/testing.md

```yaml
---
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
---
```

```markdown
# 테스트 컨벤션

- 테스트 파일: 슬라이스 내부 __tests__/ 디렉토리에 배치
- 파일명: <component-name>.test.tsx
- 전체 스위트 대신 단일 테스트 파일 실행 우선: pnpm test <path>
- @testing-library/react 사용. 구현 디테일이 아닌 사용자 행동 테��트
```

## skills/ 설계

온디맨드로 로드되는 도메�� 지식. Claude가 작업 맥락에서 관련성을 판단해 자동 로드하거나, 사용자가 명시적으로 호출.

### .claude/skills/supabase-patterns/SKILL.md

```yaml
---
name: supabase-patterns
description: Supabase RLS, 클라이언트 사용법, 마이그레이션 패턴
---
```

```markdown
# Supabase 패턴

## 클라이언트 선택
- 브라우저: src/shared/lib/supabase/client.ts
- 서버 컴포넌트/Server Action: src/shared/lib/supabase/server.ts
- RLS 우회 (admin 작업): src/shared/lib/supabase/admin.ts

## 테이블 컨벤션
- snake_case 복수형 (reminders, alarm_schedules)
- RLS 기본 활성화
- 타입 생성: pnpm supabase gen types typescript --project-id <id>

## 마이그레이션
- supabase migration new <name>
- SQL 파일 직접 작성, ORM 미사용
```

### .claude/skills/auth-patterns/SKILL.md

```yaml
---
name: auth-patterns
description: better-auth 인증 설정, OAuth 플로우, 세션 관리 패턴
---
```

```markdown
# better-auth 패턴

## 서버 인스턴스
- src/auth.ts: betterAuth() 설정 (DB 어댑터, 소셜 프로바이더)
- src/app/api/auth/[...all]/route.ts: API 라우트 핸들러

## 클라이언트
- src/shared/lib/auth-client.ts: createAuthClient() (브라우저)
- 서버에서 세션: auth.api.getSession({ headers })

## OAuth
- Google, GitHub 지원
- 환경변수: AUTH_GOOGLE_ID/SECRET, AUTH_GITHUB_ID/SECRET
```

### .claude/skills/fsd-new-slice/SKILL.md

```yaml
---
name: fsd-new-slice
description: FSD 아키텍처에서 새 슬라이스 생성 워크플로
disable-model-invocation: true
---
```

```markdown
# 새 FSD 슬라이스 생성

$ARGUMENTS 슬라이스를 생성한다.

1. 대상 ���이어 결정 (features/ entities/ widgets/)
2. 디렉토리 생성: src/<layer>/<slice-name>/
3. index.ts (public API 배럴) 생성
4. ui/ 세그먼트에 메인 컴포넌트 생성
5. CLAUDE.md 생성 (도메인 컨텍스트 기술)
6. __tests__/ 디렉토리에 기본 테스트 생성
7. 레이어 규칙 준수 확인
```

### .claude/skills/tailwind-v4/SKILL.md

```yaml
---
name: tailwind-v4
description: Tailwind CSS v4 토큰, oklch 색상, 다크모드, shadcn/ui 스타일링
---
```

```markdown
# Tailwind v4 패턴

## 설정
- CSS import 방식: @import "tailwindcss" (JS 설정 파일 없음)
- 디자인 토큰: src/app/globals.css에 oklch 기반 CSS 변수 정의

## 다크모드
- class 전략 (기본값)
- CSS 변수로 라이트/다크 토큰 분리

## shadcn/ui
- 스타일: new-york, 색상: neutral
- 컴��넌트 위치: src/shared/ui/
- 추가: npx shadcn@latest add <name>
```

## agents/ 설계

별도 컨텍스트에서 전문 작업을 수행하는 서브에이전트.

### .claude/agents/fsd-reviewer.md

```markdown
---
name: fsd-reviewer
description: FSD 아키텍�� 규칙 위반을 검증하는 코드 리뷰어
tools: Read, Grep, Glob
model: sonnet
---

FSD 아키텍처 규칙 준수를 검증한다.

## 검증 항목
1. 의존성 방향: 상위 레이어가 하위 레이어만 import하는지
2. 슬라이스 격리: 같은 레이어 내 슬라이스 간 직접 import 없는지
3. Public API: 슬라이스 외부에서 index.ts 통해서만 접근하는지
4. entities: "use client", 이벤트 핸들러, 클라이언트 훅 사용 없는지
5. features: "use client" 경계가 이 레이어 내부에서만 시작하는지

## 출력
위반 사항을 파일경로:줄번호 형식으로 보고. 위반 없으면 "FSD 규칙 준수 확인" 출력.
```

## commands/ 설계

반복 워크플로를 슬래시 커맨드로 자동화.

### .claude/commands/new-feature.md

```markdown
새 FSD feature 슬라이스를 생성하고 초기 구조를 세팅한다.

슬라이스 이름: $ARGUMENTS

1. /fsd-new-slice $ARGUMENTS 스킬 호출
2. 생성된 파일 목록 확인
3. 테스트가 통과하는지 확인: pnpm test
```

### .claude/commands/db-migration.md

```markdown
Supabase 데이터베이스 마이그레이션을 생성한다.

마이그레이션 설명: $ARGUMENTS

1. supabase migration new <kebab-case-name>
2. 생성된 SQL 파일에 마이그레이션 작성
3. supabase db push로 로컬 적용
4. 타입 재생성: pnpm supabase gen types typescript --project-id kzsfozxesctptsevwyvu > src/shared/types/supabase.ts
```

## hooks 설계

최소한으로 시작. 실제 사용하면서 필요한 것만 추가.

### .claude/settings.json hooks 섹션

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm lint --quiet --no-warn-ignored 2>&1 | tail -20 || true",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

초기에는 파일 수정 후 lint 자동 실행 1개만. 이후 필요에 따라 추가:
- format 자동 실행
- protected 파일 수정 차단
- 테스트 파일 변경 시 해당 테스트 실행

## 의사결정 기록 (ADR) 설계

어쩔 수 없는 상황의 우회, 팀 협업 결정 등을 기록.

### 구조

```
docs/decisions/
  ├── README.md              # ADR 작성 가이드
  └── NNN-<kebab-title>.md   # 각 결정 기록 (001부터 시작, 3자리 zero-padded)
```

### ADR 번호 규칙

- 001부터 시작, 3자리 zero-padded (001, 002, ..., 099, 100)
- 번호는 생성 순서 기준. 삭제/폐기해도 번호를 재사용하지 않음
- 파일명 예시: `001-polling-over-realtime.md`, `002-custom-auth-middleware.md`

### ADR 템플릿

```markdown
# NNN: <제목>

- 상태: 활성 | 폐기 | 대체됨(→ NNN)
- 날짜: YYYY-MM-DD
- 영향받는 코드: src/features/xxx/, src/shared/xxx/

## 맥락
왜 이 결정이 필요했는가. 외부 제약, 버그, 팀 논의 등.

## 결정
무엇을 어떻게 하기로 했는가.

## 해제 조건
어떤 조건이 충족되면 이 우회를 제거할 수 있는가.
(없으면 "영구적 결정"으로 표기)
```

### 슬라이스 CLAUDE.md와의 연결

영향받는 슬라이스의 CLAUDE.md `## 주의사항` 섹션에 요약 + ADR 참조를 추가:

```markdown
## 주의사항
- realtime 대신 polling 사용 중 — Supabase 버그 우회.
  이 코드를 realtime으로 "개선"하지 말 것.
  → 상세: @docs/decisions/001-polling-over-realtime.md
```

## 로딩 우선순위와 관계

rules/와 하위 CLAUDE.md가 동시에 적용될 수 있다 (예: `src/entities/` 파일 작업 시 `fsd-dependencies.md` rule과 `src/entities/CLAUDE.md` 모두 로드). 이 둘은 **충돌이 아니라 보완** 관계:

- **rules/**: 레이어 간 관계 (의존성 방향, 슬라이스 격리)
- **하위 CLAUDE.md**: 레이어/슬라이스 내부 규칙 (허용/금지 사항, 도메인 컨텍스트)

만약 충돌이 발생하면 **더 구체적인 위치의 규칙이 우선**한다: 슬라이스 CLAUDE.md > 레이어 CLAUDE.md > rules/ > 루트 CLAUDE.md

## rules/ vs 하위 CLAUDE.md vs skills/ 구분 기준

| 질문 | 답변 | 위치 |
|------|------|------|
| 특정 경로에서 항상 따라야 하는 규칙인가? | 예 → 그 경로가 한 디렉토리 내인가? | 하위 CLAUDE.md |
| | 예 → 여러 디렉토리에 걸치는가? | rules/ |
| 특정 도메인 작업 시 참고할 지식인가? | 예 | skills/ |
| 100% 예외 없이 강제해야 하는가? | 예 | hooks |
| 반복적으로 실행하는 워크플로인가? | 예 | commands/ |
| 별도 컨텍스트에서 전문 검증이 필요한가? | 예 | agents/ |

## 구현 순서

1. 루트 CLAUDE.md 슬림화 (~30줄) — 마이그레이션 맵 참고
2. 레이어 CLAUDE.md 6개 생성 (app, views, features, entities, widgets, shared)
3. 기존 슬라이스 CLAUDE.md 생성 (4개 슬라이스)
4. rules/ 2개 생성 (fsd-dependencies, testing)
5. skills/ 4개 생성 (supabase, auth, fsd-new-slice, tailwind-v4)
6. agents/ 1개 생성 (fsd-reviewer)
7. commands/ 2개 생성 (new-feature, db-migration)
8. hooks 설정 (lint 1개)
9. docs/decisions/ 디렉토리 + README 생성

## 참고 자료

- [Effective harnesses for long-running agents — Anthropic](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Harness design for long-running apps — Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Best Practices for Claude Code — Anthropic Docs](https://code.claude.com/docs/en/best-practices)
- [Skill Issue: Harness Engineering — HumanLayer](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents)
- [Anatomy of the .claude/ Folder — Daily Dose of DS](https://blog.dailydoseofds.com/p/anatomy-of-the-claude-folder)
- [Claude Code Showcase — GitHub](https://github.com/ChrisWiles/claude-code-showcase)
