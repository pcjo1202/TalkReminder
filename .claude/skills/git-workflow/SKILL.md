---
name: git
description: >
  git 작업을 자동화한다. 이슈 생성+브랜치, 자동 분리 커밋, PR 생성을 수행한다.
  - "/git issue" — GitHub 이슈와 브랜치를 함께 생성
  - "/git commit" — 변경사항을 분석하여 단일 행위 단위로 자동 분리 커밋
  - "/git pr" — PR 자동 생성 (타겟 브랜치 자동 판단)
  git 관련 작업 요청, 커밋, 이슈 생성, PR 생성, 브랜치 생성 요청 시 이 스킬을 사용하라.
  "/git", "/commit", "/issue", "/pr" 같은 슬래시 커맨드에도 반드시 트리거할 것.
---

# Git Workflow Skill

이 스킬은 `.claude/rules/git-workflow.md` 규칙을 준수하여 git 작업을 자동화한다. 실행 전 반드시 해당 규칙 파일을 읽어 최신 컨벤션을 확인하라.

## 사전 조건

- `gh` CLI가 설치되어 있고 인증된 상태 (`gh auth status`로 확인)
- git 저장소 내에서 실행

## 커맨드 라우팅

args를 확인하여 분기한다:
- `issue` → `/git issue` 섹션
- `commit` → `/git commit` 섹션
- `pr` → `/git pr` 섹션
- 인자 없음 → 아래 안내 출력:

```
사용 가능한 커맨드:
  /git issue   — 이슈 생성 + 브랜치 생성
  /git commit  — 변경사항 자동 분리 커밋
  /git pr      — PR 생성
```

---

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
출력에서 이슈 번호를 파싱한다.

4. **브랜치명 생성**:
   - 형식: `<prefix>/<이슈번호>-<ascii-케밥케이스-제목>`
   - 예: `feature/42-kakaotalk-alarm`
   - 한글 제목은 영문 ASCII 케밥 케이스로 변환한다

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

- `gh issue create` 실패 → 에러 표시, `gh auth status` 확인 안내 후 중단
- `git checkout -b` 실패 (브랜치 이미 존재) → 에러 표시, 다른 이름 제안

---

## `/git commit` — 변경사항 자동 분리 커밋

### 플로우

1. **변경사항 분석**:
```bash
git status
git diff
git diff --cached
```
staged와 unstaged 변경사항을 모두 분석한다. 변경사항이 없으면 "커밋할 변경사항이 없습니다" 안내 후 종료.

2. **단일 행위 단위로 그룹핑**: 파일 경로와 변경 내용을 기반으로 논리적 단위로 분리한다.
   - 같은 기능에 속하는 파일들을 하나의 그룹으로 묶는다
   - 예: UI 컴포넌트 추가 / API 라우트 추가 / 테스트 추가 → 3개 커밋
   - 변경이 작아서 분리가 불필요하면 하나의 커밋으로 진행해도 된다

3. **커밋 계획 제시**: 전체 커밋 계획을 한 번에 표로 보여준다:

```
커밋 계획:
1. feat(create-reminder): 리마인더 생성 폼을 추가합니다
   - src/features/create-reminder/ui/create-reminder-form.tsx
   - src/features/create-reminder/index.ts
2. test(create-reminder): 리마인더 생성 폼 테스트를 추가합니다
   - src/features/create-reminder/ui/__tests__/create-reminder-form.test.tsx

수정할 부분이 있으면 말씀해주세요. 없으면 진행합니다.
```

사용자가 수정을 요청하면 반영한다. 확인을 받으면 실행한다.

4. **순차 커밋 실행**: 각 그룹별로:
```bash
git add <파일1> <파일2> ...
git commit -m "<type>(<scope>): <한글 메시지>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

5. **결과 요약**: 생성된 전체 커밋 목록을 출력한다.

### 커밋 메시지 규칙

```
<type>(<scope>): <message>
```

- **message**: 한글, 구어체 (~합니다)
- **scope**: 케밥 케이스

**타입 판단:**

| 상황 | 타입 |
|------|------|
| 새 기능 추가, API 연동 | `feat` |
| 버그/이슈 수정 | `fix` |
| 포맷팅, 네이밍만 수정 | `style` |
| 동작 동일, 구조 개선 | `refactor` |
| 수치 개선 목적 | `perf` |
| 설정, 패키지 변경 | `chore` |
| 문서만 수정 | `docs` |
| 테스트 관련 | `test` |
| 최초 프로젝트 구축 | `init` |
| dev 싱크 맞춤 | `sync` |

**scope 추론** (FSD 레이어 또는 기능명 기반):
- `src/shared/ui/button.tsx` → `shared-ui`
- `src/features/create-reminder/...` → `create-reminder`
- `src/entities/reminder/...` → `reminder`
- `src/app/...` → `app` 또는 라우트명
- `.claude/...` → 구체적 설정명 (예: `git-workflow`)
- 여러 레이어에 걸친 변경 → 가장 핵심적인 기능명

### 에러 처리

- `git commit` 실패 → 에러 표시, 이전 커밋까지 완료된 상태를 안내. 나머지는 수동으로 `git add` + `git commit` 하도록 안내.

---

## `/git pr` — PR 생성

### 플로우

1. **현재 브랜치 확인**:
```bash
git branch --show-current
```
`main`이나 `dev`에서 실행하면 경고하고 중단한다.

2. **타겟 브랜치 자동 판단**:

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
분기점에 `feature-root/*` 커밋이 있으면 서브 태스크로 판단한다. 또는 `git merge-base`로 현재 브랜치가 `feature-root/*`에서 분기했는지 확인한다.

판단 결과를 사용자에게 보여주고 확인받는다:
```
타겟 브랜치: dev (feature/* 단독 작업)
이대로 진행할까요?
```

3. **커밋 히스토리 분석**:
```bash
git log --oneline <타겟>..<현재브랜치>
git diff <타겟>...<현재브랜치>
```

4. **PR 제목 + 본문 자동 생성**:
   - 제목: 70자 이내, 변경사항 요약
   - 본문 형식:

```markdown
## Summary
- 변경사항 요약 bullet (1-3개)

## Test plan
- [ ] 테스트 항목

Closes #<이슈번호>
```

브랜치명에서 이슈 번호를 추출한다 (예: `feature/42-...` → `#42`). 이슈 번호가 없으면 `Closes` 라인을 생략한다.

5. **Push + PR 생성**:
```bash
git push -u origin <현재브랜치>
gh pr create --base <타겟> --title "<제목>" --body "<본문>"
```

6. **결과 출력**: PR URL을 출력한다.

### 에러 처리

- `git push` 실패 → 에러 표시. remote와 충돌이면 `git pull --rebase` 안내.
- `gh pr create` 실패 → 에러 표시. 이미 PR이 존재하면 `gh pr view --web`으로 기존 PR URL 안내.
