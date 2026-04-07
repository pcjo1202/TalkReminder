## Protected Branches

| 브랜치 | 용도 | 직접 push |
|--------|------|----------|
| main | 상용 배포 | ❌ 금지 — PR 머지만 허용 |
| dev | 테스트 서버 배포 | ✅ 허용 |

- main force-push 절대 금지

## Branch

```
<type>/<branch-name>  (케밥 케이스)

feature-root/  — 에픽 (main에서 분기)
feature/       — 서브 태스크 (feature-root에서 분기) 또는 단독 작업 (main에서 분기)
feature/qa-    — QA 이슈 수정
hotfix/        — 핫픽스 (main에서 분기)
performance/   — 리팩토링, 성능 개선
```

- 에픽 없는 작은 작업은 `feature/*`를 main에서 직접 분기 → dev 검증 → main PR

## Commit Message

```
<type>(<scope>): <message>

init     — 최초 프로젝트 구축
feat     — 새 기능 추가, API 연동
fix      — 버그/이슈 수정
style    — 로직 외 코드 수정 (포맷팅, 세미콜론 등)
perf     — 성능 개선
refactor — 동작 변경 없는 코드 구조 개선
docs     — 문서 변경
chore    — 빌드 설정, 패키지 업데이트, CI 등
test     — 테스트 관련
sync     — dev 싱크 맞춤

scope: 케밥 케이스 | message: 한글, 구어체 (~합니다)
```

- 커밋은 최대한 잘게 쪼개어 단일 행위 단위로

### 타입 판단

| 상황 | 타입 |
|------|------|
| 포맷팅·네이밍만 수정 | `style` |
| 동작 동일, 구조 개선 | `refactor` |
| 수치 개선 목적 | `perf` |
| 설정, 패키지 변경 | `chore` |
| 문서만 수정 | `docs` |

### Body / Footer

- body: 선택. "무엇을 왜" 중심
- footer: `Closes #번호` / `Refs #번호`
- Breaking Change: `BREAKING CHANGE: 설명` 필수

## Merge Strategy

- 모든 머지는 일반 머지 (Create a merge commit)
- main에는 PR 없이 머지 금지

| 플로우 | 순서 |
|--------|------|
| 에픽 | main → `feature-root/*` → `feature/*` 서브 태스크 → feature-root 머지 → dev 검증 → main PR |
| 단독 | main → `feature/*` → dev 검증 → main PR |
