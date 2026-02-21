# Talk Reminder — 서비스 전체 설계

> 작성일: 2026-02-21

## 서비스 한 줄 정의

Slack과 카카오톡으로 유연한 반복 알람을 보내는 개인/팀 통합 알람 관리 서비스.
(이메일은 v2에서 추가)

---

## 타겟 사용자

- **개인 사용자** — 본인이 직접 쓸 알람 설정 (약 먹기, 회의 전 알림 등)
- **소규모 팀 운영자** — 팀원들에게 반복 업무 알림 발송

---

## 핵심 차별점

1. **채널 통합** — Slack, 카카오톡을 한 곳에서 관리
2. **스케줄링 유연성** — "매주 월·수·금 오전 9시", "매월 마지막 금요일" 같은 세부 반복 규칙
3. **메시지 템플릿** — 변수 삽입(`{{name}}`, `{{date}}`), 재사용 가능한 템플릿

---

## MVP 채널

| 채널 | 방식 | 제한 |
|------|------|------|
| **Slack** | Slack OAuth + Incoming Webhook | - |
| **카카오톡 나에게** | Kakao OAuth (`talk_message` scope) | - |
| **카카오톡 친구에게** | Kakao OAuth + 사용 권한 신청 | 1회 최대 5명, 일/월 쿼터 |

> v2 추가 예정: 이메일, 팀 워크스페이스

---

## 핵심 엔티티

| 엔티티 | 설명 |
|--------|------|
| **User** | NextAuth.js 인증 (Google/GitHub 소셜 로그인) |
| **Reminder** | 알람의 중심. 제목, 메시지, 스케줄(cron), 채널, 수신자 포함 |
| **Channel Connection** | 사용자가 연결한 Slack 워크스페이스, 카카오 OAuth 토큰 |
| **Template** | 변수 포함 재사용 메시지 (`{{name}}`, `{{date}}` 등) |
| **Reminder Log** | 발송 이력. 성공/실패, 채널, 발송 시각 기록 |

### 스케줄 표현 방식

- 내부: **cron 표현식** 저장 (`0 9 * * 1,3,5` = 매주 월수금 9시)
- UI: 사람이 읽기 쉬운 빌더로 입력 → cron 변환
- 타임존: 사용자별 저장 (`users` 테이블)

---

## 페이지 구성

```
/                        # 랜딩 페이지 (로그인 유도)
/login                   # 소셜 로그인 (Google/GitHub)
/dashboard               # 알람 목록 + 다음 발송 예정 타임라인
/reminders/new           # 알람 생성 (스케줄 빌더 + 채널 선택 + 템플릿)
/reminders/[id]          # 알람 상세/편집/삭제
/channels                # 채널 연결 관리 (Slack, 카카오 OAuth)
/templates               # 템플릿 목록 + 생성/편집
/logs                    # 발송 이력 (성공/실패, 채널별 필터)
```

---

## 발송 아키텍처

```
n8n cron 트리거
  → POST /api/reminders/send  (secret key 인증)
    → Supabase에서 발송 대상 알람 조회
    → Slack / 카카오 API 호출
    → logs 테이블에 결과 기록
```

- **n8n**: "언제 보낼지"만 담당 (cron 트리거 → API 호출)
- **Talk Reminder API**: "어떻게/무엇을 보낼지" + 로그 기록
- **토큰 관리**: Slack/카카오 OAuth 토큰은 Supabase 단일 관리

---

## 빌드 순서

### Phase 1 — 기반
1. DB 스키마 설계 (Supabase)
2. NextAuth.js 인증 (Google/GitHub 로그인)
3. 기본 레이아웃 + 라우팅

### Phase 2 — 채널 연결
4. Slack OAuth 연동 + 연결 관리 UI (`/channels`)
5. 카카오 OAuth 연동 (나에게/친구에게)

### Phase 3 — 알람 핵심
6. 템플릿 CRUD (`/templates`)
7. 알람 생성/편집 — 스케줄 빌더(cron) + 채널 선택 (`/reminders`)
8. 대시보드 — 알람 목록 + 다음 발송 타임라인 (`/dashboard`)

### Phase 4 — 발송 엔진
9. `POST /api/reminders/send` API 구현 (secret key 인증)
10. Slack 메시지 발송 로직
11. 카카오 메시지 발송 로직 (나에게/친구에게)
12. 발송 로그 기록 + 이력 UI (`/logs`)
13. n8n 워크플로 설정 (cron 트리거 → API 호출)

### Phase 5 — v2
14. 이메일 채널 추가
15. 팀 워크스페이스 / 멤버 초대
