# Git Workflow Skill Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/git` 슬래시 커맨드로 이슈 생성+브랜치, 자동 분리 커밋, PR 생성을 수행하는 Claude Code 스킬을 만든다.

**Architecture:** 단일 SKILL.md 파일에 3개 서브 커맨드(`issue`, `commit`, `pr`)를 정의. 각 커맨드는 `git-workflow.md` 규칙을 참조하며, `gh` CLI로 GitHub 연동한다.

**Tech Stack:** Claude Code Skill (SKILL.md), gh CLI, git

**Spec:** `docs/superpowers/specs/2026-04-08-git-workflow-skill-design.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `.claude/skills/git-workflow/SKILL.md` | 스킬 정의 (frontmatter + 3개 커맨드 로직) |
| Modify | `.claude/settings.json` | hook regex 수정 (git push 허용 패턴 변경) |

---

### Task 1: Hook 수정 — git push 패턴 변경

**Files:**
- Modify: `.claude/settings.json` (PreToolUse Bash hook의 `grep -qE` 패턴)

- [ ] **Step 1: 현재 hook 패턴 확인**

`.claude/settings.json`의 PreToolUse Bash hook에서 `grep -qE` 패턴을 확인한다:
```
rm\s+-rf|--force|--hard|git\s+push|DROP\s+TABLE|\bnpm\s|\byarn\s
```

> **참고**: `--force`는 독립 clause로 이미 존재하므로 `git push --force`는 별도 처리 없이 차단된다. 따라서 `git\s+push` 부분은 main push만 차단하도록 축소하면 된다.

- [ ] **Step 2: hook 패턴을 수정한다**

`grep -qE` 전체 패턴을 아래로 변경:

```
변경 전: rm\\s+-rf|--force|--hard|git\\s+push|DROP\\s+TABLE|\\bnpm\\s|\\byarn\\s
변경 후: rm\\s+-rf|--force|--hard|git\\s+push\\s+.*main\\b|DROP\\s+TABLE|\\bnpm\\s|\\byarn\\s
```

`git\s+push` → `git\s+push\s+.*main\b`로 변경. 이렇게 하면:
- `git push -u origin feature/42-...` → 허용
- `git push origin dev` → 허용
- `git push --force` → 차단 (독립 `--force` clause)
- `git push origin main` → 차단 (`main\b` 매칭)

- [ ] **Step 3: 변경 확인**

`settings.json`을 읽어서 패턴이 올바르게 변경되었는지 확인한다.

- [ ] **Step 4: 커밋**

```bash
git add .claude/settings.json
git commit -m "chore(settings): git push hook 패턴을 force/main만 차단하도록 변경합니다"
```

---

### Task 2: SKILL.md 생성 — frontmatter + 커맨드 라우팅

**Files:**
- Create: `.claude/skills/git-workflow/SKILL.md`

- [ ] **Step 1: 스킬 파일 생성**

`.claude/skills/git-workflow/SKILL.md`를 생성한다. frontmatter와 커맨드 라우팅 섹션을 작성한다:

```markdown
---
name: git
description: >
  git 작업을 자동화한다. 이슈 생성+브랜치, 자동 분리 커밋, PR 생성을 수행한다.
  - "/git issue" — 이슈와 브랜치를 함께 생성
  - "/git commit" — 변경사항을 분석하여 단일 행위 단위로 자동 분리 커밋
  - "/git pr" — PR 자동 생성
  git 관련 작업 요청 시 이 스킬을 사용하라.
---

# Git Workflow Skill

이 스킬은 `.claude/rules/git-workflow.md` 규칙을 준수하여 git 작업을 자동화한다.

## 사전 조건

- `gh` CLI가 설치되어 있고 인증된 상태여야 한다 (`gh auth status`로 확인)
- git 저장소 내에서 실행해야 한다

## 커맨드 라우팅

args를 확인하여 분기한다:
- `issue` → `/git issue` 섹션 실행
- `commit` → `/git commit` 섹션 실행
- `pr` → `/git pr` 섹션 실행
- 인자 없음 → 사용 가능한 커맨드 목록 안내
```

- [ ] **Step 2: 커밋**

```bash
git add .claude/skills/git-workflow/SKILL.md
git commit -m "feat(git-workflow): 스킬 파일 생성 및 커맨드 라우팅 정의합니다"
```

---

### Task 3: `/git issue` 커맨드 작성

**Files:**
- Modify: `.claude/skills/git-workflow/SKILL.md`

- [ ] **Step 1: `/git issue` 섹션 추가**

SKILL.md에 아래 내용을 추가한다:

````markdown
## `/git issue` — 이슈 생성 + 브랜치 생성

### 플로우

1. **이슈 정보 수집**: 사용자에게 이슈 제목과 설명을 질문한다. 현재 대화 컨텍스트에서 추론할 수 있으면 추론하고, 사용자에게 확인받는다.

2. **이슈 타입 → 브랜치 접두사 결정** (git-workflow.md 기준):

| 이슈 타입 | 브랜치 접두사 | 비고 |
|-----------|-------------|------|
| 새 기능 | `feature/` | |
| 버그 수정 (비긴급) | `feature/` | 커밋 타입은 `fix` |
| 버그 수정 (긴급) | `hotfix/` | main에서 분기 |
| 성능 개선 | `performance/` | main에서 분기 |
| QA 이슈 | `feature/qa-` | |

3. **이슈 생성**:
```bash
gh issue create --title "<제목>" --body "<설명>"
```
생성된 이슈 번호를 파싱한다.

4. **브랜치명 생성**:
   - 형식: `<prefix>/<이슈번호>-<ascii-케밥케이스-제목>`
   - 예: `feature/42-kakaotalk-alarm`
   - 제목은 영문 ASCII 케밥 케이스로 변환한다

5. **분기 기준 브랜치 결정**:
   - 현재 `feature-root/*`에 체크아웃 되어 있으면 → 해당 에픽에서 분기
   - 여러 `feature-root/*`가 있으면 → 사용자에게 선택 질문
   - 그 외 → main에서 분기

6. **브랜치 생성**:
```bash
git checkout -b <브랜치명>
```

7. **결과 출력**: 이슈 URL과 브랜치명을 요약 출력한다.

### 에러 처리

- `gh issue create` 실패 시: 에러 메시지 표시 후 중단. `gh auth status`로 인증 상태 확인을 안내한다.
- `git checkout -b` 실패 시 (브랜치 이미 존재): 에러 표시하고 다른 이름을 제안한다.
````

- [ ] **Step 2: 커밋**

```bash
git add .claude/skills/git-workflow/SKILL.md
git commit -m "feat(git-workflow): /git issue 커맨드를 추가합니다"
```

---

### Task 4: `/git commit` 커맨드 작성

**Files:**
- Modify: `.claude/skills/git-workflow/SKILL.md`

- [ ] **Step 1: `/git commit` 섹션 추가**

SKILL.md에 아래 내용을 추가한다:

````markdown
## `/git commit` — 변경사항 자동 분리 커밋

### 플로우

1. **변경사항 분석**:
```bash
git status
git diff
git diff --cached
```
staged와 unstaged 변경사항을 모두 분석한다.

2. **단일 행위 단위로 그룹핑**: 파일 경로와 변경 내용을 기반으로 논리적 단위로 분리한다.
   - 같은 기능에 속하는 파일들을 하나의 그룹으로 묶는다
   - 예: UI 컴포넌트 추가 / API 라우트 추가 / 테스트 추가 → 3개 커밋

3. **커밋 계획 제시**: 전체 커밋 계획을 한 번에 보여준다. 각 커밋에 대해:
   - 포함될 파일 목록
   - 커밋 메시지 (git-workflow.md 컨벤션)
   사용자가 수정을 요청하면 반영한다.

4. **순차 커밋 실행**: 사용자 확인 후, 각 그룹별로:
```bash
git add <파일1> <파일2> ...
git commit -m "<type>(<scope>): <한글 메시지>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### 커밋 메시지 규칙 (git-workflow.md)

```
<type>(<scope>): <message>

type: feat, fix, style, perf, refactor, docs, chore, test, sync
scope: 케밥 케이스
message: 한글, 구어체 (~합니다)
```

**타입 판단 기준:**

| 상황 | 타입 |
|------|------|
| 새 기능 추가 | `feat` |
| 버그/이슈 수정 | `fix` |
| 포맷팅, 네이밍만 수정 | `style` |
| 동작 동일, 구조 개선 | `refactor` |
| 수치 개선 목적 | `perf` |
| 설정, 패키지 변경 | `chore` |
| 문서만 수정 | `docs` |
| 테스트 관련 | `test` |
| 최초 프로젝트 구축 | `init` |
| dev 싱크 맞춤 | `sync` |

**scope 추론**: FSD 레이어 또는 기능명 기반
- `src/shared/ui/button.tsx` → `shared-ui`
- `src/features/create-reminder/...` → `create-reminder`
- `src/entities/reminder/...` → `reminder`
- `.claude/...` → `claude` 또는 구체적 설정명

5. **결과 요약**: 생성된 전체 커밋 목록을 출력한다.

### 에러 처리

- 변경사항이 없으면: "커밋할 변경사항이 없습니다" 안내 후 종료.
- `git commit` 실패 시: 에러 표시, 이전 커밋까지의 상태를 안내한다.
````

- [ ] **Step 2: 커밋**

```bash
git add .claude/skills/git-workflow/SKILL.md
git commit -m "feat(git-workflow): /git commit 커맨드를 추가합니다"
```

---

### Task 5: `/git pr` 커맨드 작성

**Files:**
- Modify: `.claude/skills/git-workflow/SKILL.md`

- [ ] **Step 1: `/git pr` 섹션 추가**

SKILL.md에 아래 내용을 추가한다:

````markdown
## `/git pr` — PR 생성

### 플로우

1. **현재 브랜치 확인**:
```bash
git branch --show-current
```
main이나 dev에서 실행하면 경고하고 중단한다.

2. **타겟 브랜치 자동 판단**: 브랜치 접두사와 분기점을 기반으로 판단한다.

| 현재 브랜치 | 조건 | 타겟 |
|------------|------|------|
| `feature/*` | `feature-root/*`에서 분기 | 부모 `feature-root/*` |
| `feature/*` | main에서 분기 (단독) | `dev` |
| `feature/qa-*` | — | `dev` |
| `hotfix/*` | — | `main` |
| `feature-root/*` | — | `main` |
| `performance/*` | — | `dev` |

**에픽 서브 태스크 판별**:
```bash
git log --oneline main..<현재브랜치>
```
분기점에 `feature-root/*` 커밋이 있으면 서브 태스크로 판단한다.

판단 결과를 사용자에게 보여주고 확인받는다.

3. **커밋 히스토리 분석**:
```bash
git log --oneline <타겟>..<현재브랜치>
git diff <타겟>...<현재브랜치>
```

4. **PR 제목 + 본문 자동 생성**:
   - 제목: 70자 이내, 변경사항을 요약
   - 본문 형식:
```markdown
## Summary
- 변경사항 요약 (1-3개 bullet)

## Test plan
- [ ] 테스트 항목

Closes #<이슈번호>  ← 브랜치명에서 이슈번호 추출 시
```

5. **Push + PR 생성**:
```bash
git push -u origin <현재브랜치>
gh pr create --base <타겟> --title "<제목>" --body "<본문>"
```

6. **결과 출력**: PR URL을 출력한다.

### 에러 처리

- `git push` 실패 시: 에러 표시. remote와 충돌이면 pull/rebase를 안내한다.
- `gh pr create` 실패 시: 에러 표시. 이미 PR이 존재하면 해당 PR URL을 안내한다.
````

- [ ] **Step 2: 커밋**

```bash
git add .claude/skills/git-workflow/SKILL.md
git commit -m "feat(git-workflow): /git pr 커맨드를 추가합니다"
```

---

### Task 6: 수동 검증

- [ ] **Step 1: gh CLI 인증 확인**

```bash
gh auth status
```

- [ ] **Step 2: `/git issue` 테스트**

새 터미널에서 `/git issue`를 호출하여 이슈 + 브랜치가 정상 생성되는지 확인한다.

- [ ] **Step 3: `/git commit` 테스트**

테스트 파일을 수정한 후 `/git commit`을 호출하여 자동 분리 커밋이 정상 동작하는지 확인한다.

- [ ] **Step 4: `/git pr` 테스트**

생성된 브랜치에서 `/git pr`을 호출하여 PR이 정상 생성되는지 확인한다.
