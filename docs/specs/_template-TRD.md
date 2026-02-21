---
title: TRD 템플릿
description: 기능 단위 기술 요구사항 문서 템플릿 — ADR, 데이터 모델, API 명세, FSD 레이어 매핑, 테스트 계획 포함
---

# [F00] 기능명 — TRD

> **작성일**: YYYY-MM-DD
> **상태**: 초안 | 검토중 | 확정
> **연관 PRD**: [F00-기능명-PRD.md](./F00-기능명-PRD.md)

---

## 1. 기술 개요

> PRD의 요구사항을 어떻게 구현할지 한 단락으로 요약.

(작성)

---

## 2. 아키텍처 결정 (ADR)

> 왜 이 방식을 선택했는가. 대안과 비교.

| 결정 사항 | 선택 | 이유 |
|-----------|------|------|
| 상태 관리 위치 | server action | 클라이언트 상태 최소화 원칙 |
| 유효성 검증 | 서버 사이드 | 보안 + 신뢰성 |

---

## 3. 데이터 모델

```sql
-- 테이블명: snake_case 복수형
create table reminders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- 컬럼 추가
  created_at  timestamptz not null default now()
);

-- RLS 정책
alter table reminders enable row level security;

create policy "users can manage own reminders"
  on reminders for all
  using (auth.uid() = user_id);
```

---

## 4. API 명세

### `POST /api/reminders`

**Request:**
```ts
interface CreateReminderRequest {
  // 필드 정의
}
```

**Response:**
```ts
// 200 OK
interface CreateReminderResponse {
  // 필드 정의
}

// 400 Bad Request
{ error: "메시지" }

// 401 Unauthorized
{ error: "Unauthorized" }
```

---

## 5. FSD 레이어 매핑

> 이 기능의 코드가 어느 레이어에 위치하는가.

```
features/create-reminder/
├── ui/
│   └── create-reminder-form.tsx   # 폼 컴포넌트 ("use client")
├── model/
│   └── use-create-reminder.ts     # 폼 상태 관리 훅
├── api/
│   └── create-reminder.ts         # 서버 액션 or fetch 함수
└── index.ts

entities/reminder/
├── ui/
│   └── reminder-card.tsx          # 표시 전용 컴포넌트 (서버 컴포넌트)
└── index.ts
```

---

## 6. 유효성 검증 규칙

| 필드 | 규칙 | 에러 메시지 |
|------|------|-------------|
| scheduled_at | 현재 시각보다 미래 | "과거 시간은 선택할 수 없습니다" |

---

## 7. 에러 처리

| 시나리오 | HTTP 상태 | 클라이언트 처리 |
|----------|-----------|----------------|
| 인증 없음 | 401 | 로그인 페이지 리다이렉트 |
| 유효성 오류 | 400 | 인라인 에러 메시지 표시 |
| 서버 오류 | 500 | 토스트 에러 알림 |

---

## 8. 테스트 계획

```
features/create-reminder/
└── ui/
    └── create-reminder-form.test.tsx
        - [ ] 필수 필드 비어있으면 제출 버튼 비활성화
        - [ ] 과거 날짜 입력 시 에러 메시지 표시
        - [ ] 성공 제출 시 목록 페이지로 이동
```

---

## 9. 미결 기술 사항

| 이슈 | 임시 결정 | 재검토 기한 |
|------|----------|------------|
| ~ | - | - |
