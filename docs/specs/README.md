---
title: Specs 사용 가이드
description: 기능 단위 PRD/TRD 문서 관리 규칙, 파일 명명 규칙, 기능 ID 테이블
---

# specs/

기능 단위 제품/기술 명세 디렉터리.

## 파일 규칙

```
specs/
├── F01-reminder-create-PRD.md   # 기능 ID + 이름 + 문서 종류
├── F01-reminder-create-TRD.md
├── F02-channel-select-PRD.md
└── ...
```

- **PRD** (Product Requirements): 사용자 관점의 기능 정의 — WHAT
- **TRD** (Technical Requirements): 구현 명세 — HOW
- 기능 하나당 PRD + TRD 한 쌍. 하나의 파일에 합치지 않는다.

## 기능 ID 관리

| ID | 기능명 | PRD | TRD | 상태 |
|----|--------|:---:|:---:|------|
| F01 | 리마인더 생성 | - | - | 미착수 |
| F02 | 채널 선택 | - | - | 미착수 |
| F03 | 알림 전송 | - | - | 미착수 |

## Claude 사용 방법

```
"specs/F01-reminder-create-PRD.md 읽고 구현 계획 짜줘"
"specs/F01-reminder-create-TRD.md 기준으로 Supabase 스키마 작성해줘"
```

전체 specs를 한 번에 읽히지 말 것. 작업 기능 파일만 로드.
