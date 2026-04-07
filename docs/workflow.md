---
title: 개발 워크플로
description: 기능 개발 사이클과 각 단계에서 호출할 skill 가이드
---

# 개발 워크플로

## 기능 개발 사이클

```
기획 → 설계 → 구현 → 완료
```

---

## 1단계: 기획 (WHAT)

> 무엇을 만들지 정의한다.

```
/brainstorming
```

- 기능 목적, 사용자 흐름, 범위를 탐색
- 완료 후 → `docs/specs/F0X-기능명-PRD.md` 작성

---

## 2단계: 설계 (HOW)

> 어떻게 구현할지 기술 명세를 작성하고 플랜을 생성한다.

```
/writing-plans
```

- PRD를 읽고 TRD 작성 → 구현 플랜 생성
- 완료 후 → `docs/specs/F0X-기능명-TRD.md` 작성

---

## 3단계: 구현

> 플랜을 실행한다.

```
# 태스크가 독립적이고 병렬 실행 가능할 때
/subagent-driven-development

# UI 컴포넌트 작업 시
/frontend-design:frontend-design
```

---

## 4단계: 완료

> 완료라고 말하기 전에 반드시 이 순서로 실행한다.

```
1. /verification-before-completion   ← 테스트/빌드 통과 확인
2. /requesting-code-review           ← PRD 수용 기준 대조 검토
3. /finishing-a-development-branch   ← merge / PR 방식 결정
```

---

## 설치된 로컬 Skills

| 스킬   | 용도                  |
| ------ | --------------------- |
| (없음) | 로컬 스킬 미설치 상태 |

> 로컬 스킬 추가: `.claude/skills/<스킬명>/SKILL.md` 생성
> 같은 작업을 3회 이상 반복하면 커스텀 스킬로 만들 것

---

## 빠른 참조

```
기능 설계 시작          → /brainstorming
구현 플랜 필요          → /writing-plans
병렬 구현               → /subagent-driven-development
UI 작업                 → /frontend-design:frontend-design
완료 전 검증            → /verification-before-completion
리뷰 요청               → /requesting-code-review
브랜치 마무리           → /finishing-a-development-branch
```
