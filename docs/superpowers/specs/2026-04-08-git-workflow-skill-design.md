# Git Workflow Skill Design

## Overview

Claude Code 스킬로 git 작업을 자동화한다. `/git` 슬래시 커맨드로 이슈 생성, 커밋, PR 생성을 수행하며, `gh` CLI와 `git-workflow.md` 규칙을 기반으로 동작한다.

## Skill

- **위치**: `.claude/skills/git-workflow/SKILL.md`
- **호출**: `/git issue`, `/git commit`, `/git pr`
- **인자 없이 호출 시**: 사용 가능한 커맨드 목록 안내
- **공통 참조**: `.claude/rules/git-workflow.md`

## Commands

### `/git issue` — 이슈 생성 + 브랜치 생성

1. 사용자에게 이슈 제목/설명 질문 (또는 대화 컨텍스트에서 추론)
2. 이슈 타입 판단 → 브랜치 접두사 결정
   - 새 기능 → `feature/`
   - 버그 수정 → `fix/` 또는 `hotfix/`
   - 성능 개선 → `performance/`
   - QA 이슈 → `feature/qa-`
3. `gh issue create --title "..." --body "..."` 실행
4. 생성된 이슈 번호로 브랜치명 자동 생성
   - 형식: `<prefix>/<이슈번호>-<케밥케이스-제목>`
   - 예: `feature/42-카카오톡-알림-연동`
5. 분기 기준 브랜치 결정
   - `feature-root/*`가 있으면 → 해당 에픽에서 분기
   - 없으면 → main에서 분기
6. `git checkout -b <브랜치명>` 실행
7. 결과 요약 출력 (이슈 URL + 브랜치명)

### `/git commit` — 변경사항 자동 분리 커밋

1. `git diff` (staged + unstaged) 분석
2. 변경사항을 단일 행위 단위로 그룹핑
   - 파일 경로 + 변경 내용 기반으로 논리적 단위 분리
   - 예: UI 컴포넌트 추가 / API 라우트 추가 / 테스트 추가 → 3개 커밋
3. 전체 커밋 계획을 한 번에 보여주고 사용자 확인
   - 수정이 필요한 커밋만 지적하면 반영
4. 각 그룹별로:
   a. 해당 파일들만 `git add`
   b. `git-workflow.md` 커밋 컨벤션에 맞춰 메시지 생성
      - `type(scope): 한글 메시지` (~합니다 구어체)
      - scope는 케밥 케이스
   c. `git commit` 실행
5. 전체 커밋 결과 요약 출력

### `/git pr` — PR 생성

1. 현재 브랜치 확인
2. 타겟 브랜치 자동 판단 + 사용자 확인
   - `feature/*`, `feature/qa-*` → dev
   - `hotfix/*` → main
   - `feature-root/*` → main
   - `performance/*` → dev
3. `git log`로 브랜치 커밋 히스토리 분석
4. PR 제목 + 본문 자동 생성
   - 제목: 70자 이내
   - 본문: `## Summary` (변경사항 요약) + `## Test plan`
5. 브랜치명에 이슈 번호가 있으면 footer에 `Closes #번호` 자동 추가
6. `git push -u origin <브랜치>` 실행
7. `gh pr create --base <타겟> --title "..." --body "..."` 실행
8. PR URL 출력

## Hook 수정

`settings.json`의 PreToolUse hook에서 `git push -u origin`만 허용하도록 패턴 변경.

```
현재: git\s+push
변경: git\s+push\s+(?!-u\s+origin)
```

- `git push -u origin feature/42-...` → 허용
- `git push --force` → 차단
- `git push origin main` → 차단

## 제약사항

- 모든 커맨드는 `git-workflow.md` 규칙을 준수한다
- `gh` CLI가 설치되어 있고 인증된 상태여야 한다
- main 브랜치에 직접 push하지 않는다
- 초안 수준으로 구현하며, 고도화는 이후 별도 진행한다
