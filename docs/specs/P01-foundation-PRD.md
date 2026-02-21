---
title: Phase 1 — 기반 PRD
description: DB 스키마, 인증, 기본 레이아웃
---

# [P01] 기반 — PRD

> **작성일**: 2026-02-21
> **상태**: 초안
> **연관 설계**: [서비스 전체 설계](../plans/2026-02-21-service-design.md)

---

## 1. 배경 및 목적

Talk Reminder의 모든 기능이 올라설 기반을 구축한다.
Supabase DB 스키마, NextAuth.js 소셜 로그인, 공통 레이아웃을 완성해
이후 Phase가 독립적으로 개발될 수 있는 토대를 만든다.

---

## 2. 사용자 스토리

```
As a 신규 사용자,
I want to Google 또는 GitHub 계정으로 로그인할 수 있도록,
So that 별도 회원가입 없이 서비스를 바로 사용할 수 있다.
```

**예시 사용 흐름 (Happy Path):**

1. 사용자가 랜딩 페이지(`/`)에서 "시작하기" 버튼을 누른다
2. `/login` 페이지로 이동, Google/GitHub 로그인 버튼이 표시된다
3. 소셜 로그인 완료 후 `/dashboard`로 리다이렉트된다
4. 이후 재방문 시 세션이 유지되어 바로 대시보드로 진입한다

---

## 3. 기능 범위

**포함 (In Scope):**
- [ ] Supabase DB 스키마 초기 설계 및 마이그레이션
  - `users`, `reminders`, `channel_connections`, `templates`, `reminder_logs` 테이블
- [ ] NextAuth.js v5 설정 (Google, GitHub provider)
- [ ] Supabase adapter 연결 (세션/유저 DB 저장)
- [ ] 랜딩 페이지 (`/`) — 서비스 소개 + 로그인 유도
- [ ] 로그인 페이지 (`/login`)
- [ ] 인증 후 공통 레이아웃 (사이드바 or 헤드바, 네비게이션)
- [ ] 로그아웃

**제외 (Out of Scope):**
- 이메일/비밀번호 로그인 (v2)
- 팀/워크스페이스 기능 (Phase 5)
- 채널 연결, 알람 CRUD (Phase 2~3)

---

## 4. 수용 기준 (Acceptance Criteria)

- [ ] AC-01: Google 계정으로 로그인 시 `/dashboard`로 이동한다
- [ ] AC-02: GitHub 계정으로 로그인 시 `/dashboard`로 이동한다
- [ ] AC-03: 로그인한 사용자 정보가 Supabase `users` 테이블에 저장된다
- [ ] AC-04: 인증되지 않은 사용자가 `/dashboard`에 접근하면 `/login`으로 리다이렉트된다
- [ ] AC-05: 로그아웃 후 보호된 페이지 접근 시 `/login`으로 이동한다
- [ ] AC-06: 공통 레이아웃에 현재 로그인한 사용자 이름/아바타가 표시된다

---

## 5. UI/UX 요구사항

- **랜딩 (`/`)**: 서비스명, 핵심 기능 소개, "시작하기(로그인)" CTA 버튼
- **로그인 (`/login`)**: Google 로그인 버튼, GitHub 로그인 버튼
- **공통 레이아웃**: 네비게이션 (대시보드, 알람, 채널, 템플릿, 로그), 사용자 아바타 + 로그아웃
- **로딩 상태**: 소셜 로그인 진행 중 버튼 비활성화 + 스피너 표시
- **에러 상태**: 로그인 실패 시 에러 메시지 표시

---

## 6. DB 스키마 (초안)

```sql
-- 사용자 (NextAuth Supabase adapter가 관리)
users (id, name, email, image, timezone, created_at)

-- 알람
reminders (id, user_id, title, cron_expression, timezone, is_active, created_at, updated_at)

-- 채널 연결
channel_connections (id, user_id, channel_type, access_token, metadata, created_at)
-- channel_type: 'slack' | 'kakao'

-- 템플릿
templates (id, user_id, name, body, variables, created_at, updated_at)
-- variables: string[] (예: ["name", "date"])

-- 발송 로그
reminder_logs (id, reminder_id, channel_type, status, sent_at, error_message)
-- status: 'success' | 'failure'
```

---

## 7. 미결 사항 (Open Questions)

| 질문 | 담당 | 기한 |
|------|------|------|
| 타임존 기본값을 Asia/Seoul로 고정할지, 사용자 선택으로 할지 | - | Phase 3 시작 전 |
| reminders와 templates의 관계 — reminder가 template_id를 참조할지, body를 복사할지 | - | Phase 3 시작 전 |
