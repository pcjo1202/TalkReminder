---
title: Phase 2 — 채널 연결 PRD
description: Slack OAuth, 카카오 OAuth 연동 및 채널 관리 UI
---

# [P02] 채널 연결 — PRD

> **작성일**: 2026-02-21
> **상태**: 초안
> **연관 설계**: [서비스 전체 설계](../plans/2026-02-21-service-design.md)
> **선행 Phase**: [P01 기반](./P01-foundation-PRD.md)

---

## 1. 배경 및 목적

알람을 발송하려면 사용자가 채널을 먼저 연결해야 한다.
Slack OAuth와 카카오 OAuth를 통해 액세스 토큰을 발급받고 Supabase에 저장한다.
`/channels` 페이지에서 연결 상태를 확인하고 관리할 수 있어야 한다.

---

## 2. 사용자 스토리

```
As a 로그인한 사용자,
I want to Slack 워크스페이스를 연결할 수 있도록,
So that 알람 생성 시 Slack 채널/DM을 발송 대상으로 선택할 수 있다.
```

```
As a 로그인한 사용자,
I want to 카카오 계정을 연결할 수 있도록,
So that 나에게 또는 카카오 친구(최대 5명)에게 알람을 보낼 수 있다.
```

**Slack 연결 흐름 (Happy Path):**

1. `/channels` 페이지에서 "Slack 연결" 버튼을 누른다
2. Slack OAuth 페이지로 이동, 워크스페이스와 권한을 승인한다
3. 콜백 후 `/channels`로 복귀, Slack이 "연결됨" 상태로 표시된다

**카카오 연결 흐름 (Happy Path):**

1. `/channels` 페이지에서 "카카오 연결" 버튼을 누른다
2. 카카오 OAuth 페이지로 이동, `talk_message` 권한을 승인한다
3. 콜백 후 `/channels`로 복귀, 카카오가 "연결됨" 상태로 표시된다

---

## 3. 기능 범위

**포함 (In Scope):**
- [ ] Slack OAuth 2.0 연동 (Bot Token 발급)
  - 필요 scope: `chat:write`, `channels:read`, `users:read`
- [ ] 카카오 OAuth 연동
  - 필요 scope: `talk_message`, `friends` (친구에게 보내기용)
- [ ] `/channels` 페이지 — 채널 목록, 연결/해제 UI
- [ ] 연결된 Slack 워크스페이스의 채널 목록 조회 및 저장
- [ ] 연결된 카카오 계정의 친구 목록 조회 및 저장
- [ ] 채널 연결 해제 (토큰 삭제)
- [ ] `channel_connections` 테이블에 토큰 암호화 저장

**제외 (Out of Scope):**
- 이메일 채널 (v2)
- 다중 Slack 워크스페이스 연결 (MVP에서는 1개)
- 카카오 비즈니스 채널 (나에게/친구에게만)

---

## 4. 수용 기준 (Acceptance Criteria)

- [ ] AC-01: "Slack 연결" 버튼 클릭 시 Slack OAuth 페이지로 이동한다
- [ ] AC-02: Slack OAuth 완료 후 `channel_connections`에 토큰이 저장된다
- [ ] AC-03: "카카오 연결" 버튼 클릭 시 카카오 OAuth 페이지로 이동한다
- [ ] AC-04: 카카오 OAuth 완료 후 `channel_connections`에 토큰이 저장된다
- [ ] AC-05: 이미 연결된 채널은 "연결됨" 상태 배지와 "연결 해제" 버튼이 표시된다
- [ ] AC-06: "연결 해제" 클릭 시 `channel_connections`에서 해당 레코드가 삭제된다
- [ ] AC-07: 연결된 Slack 워크스페이스의 채널 목록을 조회할 수 있다
- [ ] AC-08: 연결된 카카오 계정의 친구 목록(최대 100명)을 조회할 수 있다

---

## 5. UI/UX 요구사항

**`/channels` 페이지:**
- 채널 카드 목록 (Slack, 카카오)
- 각 카드: 채널 아이콘, 채널명, 연결 상태 배지, 연결/해제 버튼
- **빈 상태**: "연결된 채널이 없습니다. 채널을 연결해 알람을 발송하세요."
- **로딩 상태**: OAuth 리다이렉트 중 스피너
- **에러 상태**: OAuth 실패 시 에러 토스트 ("Slack 연결에 실패했습니다")
- **연결 해제 확인**: "연결을 해제하면 이 채널로 발송 중인 알람이 중단됩니다" 확인 다이얼로그

---

## 6. 보안 고려사항

- OAuth 액세스 토큰은 Supabase에 암호화 저장 (Supabase Vault 또는 환경변수 기반 암호화)
- `state` 파라미터로 CSRF 방지
- 콜백 URL은 환경변수로 관리

---

## 7. 미결 사항 (Open Questions)

| 질문 | 담당 | 기한 |
|------|------|------|
| 카카오 `friends` scope 사용 권한 신청 절차 확인 필요 | - | Phase 2 시작 전 |
| Slack 토큰 갱신(refresh) 필요 여부 확인 | - | Phase 2 시작 전 |
| 카카오 친구 목록 저장 방식 — DB에 캐시할지, 매번 API 호출할지 | - | Phase 4 시작 전 |
