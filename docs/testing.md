---
title: 테스트
description: Vitest + @testing-library/react 설정, 테스트 파일 위치 규칙, 테스트 범위 정의
---

# 테스트 (Vitest)

## 설정

- 프레임워크: Vitest + @testing-library/react
- 설정 파일: `vitest.config.ts`
- 테스트 파일 위치: 소스 파일 옆에 `*.test.ts(x)` 또는 `*.spec.ts(x)`

## 범위

- **단위 테스트**: 유틸 함수, 커스텀 훅
- **통합 테스트**: 주요 컴포넌트 렌더링 및 인터랙션

## 명령어

```bash
pnpm test       # 단위 테스트 실행
pnpm test:ui    # UI 모드
pnpm coverage   # 커버리지 리포트
```
