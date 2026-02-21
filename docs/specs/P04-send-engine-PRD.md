---
title: Phase 4 — 발송 엔진 PRD
description: 발송 API, Slack/카카오 발송 로직, 로그, n8n 연동
---

# [P04] 발송 엔진 — PRD

> **작성일**: 2026-02-21
> **상태**: 초안
> **연관 설계**: [서비스 전체 설계](../plans/2026-02-21-service-design.md)
> **선행 Phase**: [P03 알람 핵심](./P03-reminder-core-PRD.md)

---

## 1. 배경 및 목적

설정된 알람이 스케줄에 맞춰 자동으로 발송되어야 한다.
n8n이 cron 트리거로 Talk Reminder API를 호출하면,
API가 Supabase에서 발송 대상 알람을 조회하고 Slack/카카오로 실제 메시지를 전송한다.
발송 결과는 `reminder_logs` 테이블에 기록되고 `/logs` 페이지에서 확인할 수 있다.

---

## 2. 아키텍처

```
n8n cron 트리거 (1분 간격)
  → POST /api/reminders/send
      헤더: Authorization: Bearer {SEND_SECRET}
      바디: { "triggeredAt": "2026-02-21T09:00:00Z" }

  → Next.js API Route
      1. Secret key 검증
      2. Supabase에서 현재 시각 기준 발송 대상 알람 조회
         (is_active = true AND next_send_at <= now)
      3. 각 알람에 대해 채널별 발송
      4. reminder_logs에 결과 기록
      5. next_send_at 업데이트
```

---

## 3. 사용자 스토리

```
As a 사용자,
I want to 설정한 스케줄에 맞춰 알람이 자동으로 발송되도록,
So that 직접 메시지를 보내지 않아도 된다.
```

```
As a 사용자,
I want to 발송 이력을 확인할 수 있도록,
So that 알람이 제대로 발송됐는지, 실패한 게 있는지 파악할 수 있다.
```

---

## 4. 기능 범위

**포함 (In Scope):**

발송 API:
- [ ] `POST /api/reminders/send` — n8n에서 호출하는 발송 트리거 엔드포인트
- [ ] Bearer token 방식 secret key 인증
- [ ] 발송 대상 알람 조회 로직 (next_send_at 기준)
- [ ] `next_send_at` 계산 및 업데이트 (cron 파싱)

발송 로직:
- [ ] Slack 메시지 발송 (Slack Web API `chat.postMessage`)
- [ ] 카카오 나에게 보내기 (`/v2/api/talk/memo/default/send`)
- [ ] 카카오 친구에게 보내기 (`/v1/api/talk/friends/message/default/send`)
- [ ] 템플릿 변수 치환 (`{{name}}` → 실제 값)
- [ ] 카카오 토큰 만료 시 refresh token으로 갱신

로그:
- [ ] 발송 성공/실패 `reminder_logs` 기록
- [ ] `/logs` 페이지 — 발송 이력 목록 (채널, 상태, 시각 필터)

n8n 설정:
- [ ] n8n 워크플로 설계 (Cron 노드 → HTTP Request 노드)
- [ ] 환경변수 관리 (`SEND_SECRET`, API URL)

**제외 (Out of Scope):**
- 발송 실패 시 자동 재시도 — v2
- 이메일 발송 — v2
- 발송 통계/분석 대시보드 — v2

---

## 5. 수용 기준 (Acceptance Criteria)

- [ ] AC-01: 올바른 secret key로 `POST /api/reminders/send` 호출 시 200을 반환한다
- [ ] AC-02: 잘못된 secret key로 호출 시 401을 반환한다
- [ ] AC-03: `next_send_at`이 현재 시각 이전인 활성 알람이 발송 대상에 포함된다
- [ ] AC-04: Slack 발송 성공 시 `reminder_logs`에 `status: 'success'`가 기록된다
- [ ] AC-05: Slack 발송 실패 시 `reminder_logs`에 `status: 'failure'`와 에러 메시지가 기록된다
- [ ] AC-06: 카카오 나에게 보내기가 정상 동작한다
- [ ] AC-07: 카카오 친구에게 보내기가 최대 5명까지 동작한다
- [ ] AC-08: 카카오 액세스 토큰 만료 시 refresh token으로 자동 갱신된다
- [ ] AC-09: 발송 후 `next_send_at`이 다음 cron 시각으로 업데이트된다
- [ ] AC-10: `/logs` 페이지에서 알람별, 채널별, 상태별 필터가 동작한다
- [ ] AC-11: n8n에서 1분 간격으로 API가 호출된다

---

## 6. UI/UX 요구사항

**`/logs` 페이지:**
- 발송 이력 테이블 (알람명, 채널, 상태 배지, 발송 시각)
- 상태 필터: 전체 / 성공 / 실패
- 채널 필터: 전체 / Slack / 카카오
- 실패 행 클릭 시 에러 메시지 상세 표시 (툴팁 or 모달)
- **빈 상태**: "발송 이력이 없습니다."
- **로딩 상태**: 테이블 스켈레톤

---

## 7. 보안 고려사항

- `SEND_SECRET`은 환경변수로 관리, 절대 클라이언트에 노출 금지
- API Route는 서버 사이드에서만 실행
- 카카오/Slack 토큰은 서버에서만 접근

---

## 8. 미결 사항 (Open Questions)

| 질문 | 담당 | 기한 |
|------|------|------|
| n8n 서버 URL 및 접근 방식 확인 (로컬 vs 외부 접근 가능 여부) | - | Phase 4 시작 전 |
| next_send_at 계산 라이브러리 선택 (croner, node-cron, cron-parser) | - | Phase 4 시작 전 |
| 카카오 친구에게 보내기 — 수신자가 앱 미동의 시 fallback 처리 방법 | - | Phase 4 시작 전 |
