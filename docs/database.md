---
title: 데이터베이스
description: Supabase 클라이언트 위치, 테이블 명명 규칙, RLS 정책, 타입 생성 방법
---

# 데이터베이스 (Supabase)

## 클라이언트 위치

`src/shared/lib/supabase/`

- `client.ts` — 브라우저용 (싱글턴)
- `server.ts` — 서버 컴포넌트 / Route Handler용 (cookies 기반)
- `admin.ts` — `SERVICE_ROLE_KEY` 사용 (서버 전용)

## 규칙

- **테이블 명명**: snake_case 복수형 (예: `reminders`, `alarm_schedules`)
- **RLS**: 모든 테이블에 기본 활성화. 정책을 명시적으로 정의 후 사용.

## 타입 생성

```bash
pnpm supabase gen types typescript --project-id <id> > src/shared/types/supabase.ts
```
