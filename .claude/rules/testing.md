---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "src/**/*.spec.ts"
  - "src/**/*.spec.tsx"
  - "vitest.config.ts"
---

## 테스트 파일 위치

- 소스 파일 옆에 `*.test.ts(x)` 또는 `*.spec.ts(x)`로 배치

## 테스트 범위

- 단위 테스트: 유틸 함수, 커스텀 훅
- 통합 테스트: 주요 컴포넌트 렌더링 및 인터랙션

## 명령어

- `pnpm test` — 단위 테스트 실행
- `pnpm test:watch` — watch 모드
- `pnpm coverage` — 커버리지 리포트
