---
name: dev
description: >
  구현 플랜을 읽고 자동으로 전체 개발 사이클을 실행하는 오케스트레이션 스킬이다.
  이슈 생성 → 브랜치 생성 → 태스크별 구현+커밋 → 검증 → PR 생성까지 한 번에 진행한다.
  "/dev", "플랜 실행해줘", "구현 시작해줘", "개발 진행해줘" 같은 요청에 반드시 트리거할 것.
  플랜 파일이 있거나 대화에서 플랜이 논의된 상태에서 구현을 시작하려는 모든 상황에 사용한다.
---

# Dev Orchestration Skill

구현 플랜을 읽고, git 워크플로우와 결합하여 전체 개발 사이클을 자동 실행한다.
사용자는 최소한의 개입만 하면 된다 — 문제가 발생했을 때만 멈춘다.

## 사전 조건

- `gh` CLI 인증 상태 확인: `gh auth status`
- git 저장소 내에서 실행
- `.claude/rules/git-workflow.md` 규칙을 따른다

## 플랜 감지

args 또는 대화 컨텍스트에서 플랜을 찾는다:

1. **args로 파일 경로 전달** → 해당 파일 사용
   - 예: `/dev docs/superpowers/plans/2026-04-08-feature.md`
2. **대화에서 플랜 파일이 언급/생성됨** → 해당 파일 사용
3. **둘 다 없음** → `docs/superpowers/plans/` 디렉토리를 탐색하여 목록 제시, 사용자에게 선택 요청

플랜 파일을 찾으면 읽고, `### Task N:` 헤더와 `- [ ]` 체크박스 스텝을 파싱하여 태스크 목록을 구성한다.

## 실행 플로우

```
1. 플랜 감지 및 파싱
2. 이슈 생성 + 브랜치 생성
3. 태스크 순차 실행 루프
4. 검증
5. PR 생성
```

### Phase 1: 이슈 생성 + 브랜치 생성

플랜의 **Goal** 섹션에서 이슈 제목과 설명을 추출한다.

```bash
gh issue create --title "<플랜 Goal 기반 제목>" --body "<플랜 요약>"
```

생성된 이슈 번호로 브랜치를 만든다:
- 브랜치명: `feature/<이슈번호>-<ascii-케밥케이스>`
- 분기 기준: 현재 `feature-root/*`에 있으면 해당 에픽에서, 아니면 main에서 분기

```bash
git checkout -b feature/<이슈번호>-<브랜치명>
```

### Phase 2: 태스크 순차 실행 루프

플랜에서 파싱한 태스크를 순서대로 실행한다. 각 태스크마다:

```
for each Task in plan:
  1. 태스크의 스텝들을 순서대로 구현한다
     - 코드 작성, 파일 생성/수정
     - 테스트 작성 및 실행 (스텝에 테스트가 포함된 경우)
  2. 태스크 완료 후 커밋한다
     - 해당 태스크에서 변경된 파일만 git add
     - git-workflow.md 커밋 컨벤션에 맞춘 메시지 생성
       - type(scope): 한글 메시지 (~합니다)
       - Co-Authored-By 트레일러 포함
     - git commit 실행
  3. 다음 태스크로 진행
```

#### 커밋 메시지 규칙

`.claude/rules/git-workflow.md`를 참조한다:

```
<type>(<scope>): <한글 메시지>
```

| 타입 | 상황 |
|------|------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 구조 개선 |
| `test` | 테스트 |
| `chore` | 설정, 패키지 |
| `docs` | 문서 |
| `style` | 포맷팅 |
| `perf` | 성능 개선 |

scope는 FSD 레이어 또는 기능명 기반 케밥 케이스로 추론한다.

#### 에러 처리

- 코드 구현 중 에러 → 디버깅 시도. 3회 실패 시 사용자에게 보고하고 대기
- 테스트 실패 → 수정 시도. 수정 후에도 실패하면 사용자에게 보고
- git commit 실패 → 에러 표시, 현재까지 완료된 상태 안내

### Phase 3: 검증

모든 태스크 완료 후:

```bash
pnpm lint
pnpm build
pnpm test
```

lint/build/test 실패 시 자동 수정을 시도한다. 수정 후에도 실패하면 사용자에게 보고.
검증 통과 시 수정 사항이 있으면 추가 커밋한다.

### Phase 4: PR 생성

타겟 브랜치를 자동 판단한다:

| 현재 브랜치 | 타겟 |
|------------|------|
| `feature/*` (에픽 서브 태스크) | 부모 `feature-root/*` |
| `feature/*` (단독) | `dev` (없으면 `main`) |
| `hotfix/*` | `main` |
| `performance/*` | `dev` |

```bash
git push -u origin <현재브랜치>
gh pr create --base <타겟> --title "<제목>" --body "<본문>"
```

PR 본문 형식:
```markdown
## Summary
- 변경사항 요약 (플랜 Goal 기반)

## Test plan
- [ ] lint 통과
- [ ] build 통과
- [ ] test 통과

Closes #<이슈번호>
```

PR URL을 출력하고 완료한다.

## 진행 상황 보고

각 Phase 전환 시, 그리고 태스크 완료 시 간단한 상태를 출력한다:

```
[Phase 1] 이슈 #42 생성, feature/42-kakaotalk-alarm 브랜치 생성 완료
[Phase 2] Task 1/6: Hook 수정 완료 → 커밋 완료
[Phase 2] Task 2/6: SKILL.md 생성 완료 → 커밋 완료
...
[Phase 3] lint ✓ build ✓ test ✓
[Phase 4] PR #43 생성 완료 → https://github.com/...
```

## 중요 원칙

- **자동 진행**: 문제 없으면 사용자 확인 없이 계속 진행한다. 멈추는 것은 에러가 발생했을 때뿐이다.
- **태스크 = 커밋**: 각 태스크는 하나의 커밋 단위다. 잘게 쪼개진 커밋이 이력을 깔끔하게 만든다.
- **플랜 충실도**: 플랜에 적힌 스텝을 그대로 따른다. 임의로 스텝을 건너뛰거나 순서를 바꾸지 않는다.
- **git-workflow.md 준수**: 브랜치 네이밍, 커밋 컨벤션, 머지 전략 모두 규칙을 따른다.
