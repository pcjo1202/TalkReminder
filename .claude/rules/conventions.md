---
paths:
  - "src/**"
---

## 네이밍

- 변수, 함수: camelCase / 상수: UPPER_CASE / 타입, 인터페이스, class: PascalCase
- 파일명: `kebab-case.tsx` (컴포넌트), `kebab-case.ts` (모듈), `use-<name>.ts` (훅)
- 폴더명: `kebab-case` (FSD 슬라이스 포함)
- 변수/함수명은 길더라도 구체적으로 (`isOpen` X → `isErrorModalOpen` O)

### Boolean 변수

- `is` / `has` / `should` / `can` prefix 필수
  - 상태: `is` / 소유·존재: `has` / 조건부 동작: `should` / 능력·권한: `can`
- prefix 없는 Boolean 금지 (`loading` X → `isLoading` O)

## 타입

- React props: `interface <컴포넌트명>Props` 패턴 사용 (예: `interface ReminderCardProps`)
- `any` 사용 금지. 함수 인자와 반환값에 타입 명시
- `as` 타입 단언 지양 (특수한 경우 제외)
- 객체 형태 정의: `interface` / 유니언·교차·유틸리티 조합: `type`
- enum 대신 `as const` 객체 + `typeof` 유니언 사용
- 유틸리티 타입 적극 활용: `Pick`, `Omit`, `Partial`, `Required`, `Record`

## 코드 스타일

- 일반 함수: 화살표 함수로 작성. 인자 3개 이상 금지 — 2개 초과 시 객체로 전달
- React 컴포넌트: `function` 선언 사용 (React Compiler displayName 추론 + Next.js RSC 호환)
- async/await 사용. `.then()` 체이닝 금지
- early return으로 중첩 최소화
- 삼항 연산자 1단계만 허용. 중첩 삼항 금지
- `??` (nullish coalescing), `?.` (optional chaining) 선호
- 배열/객체 직접 mutation 금지 — spread, `map`, `filter`, `toSorted` 등 새 참조 반환 메서드 사용

### 매직 넘버 / 문자열

- 의미 불명확한 리터럴 값 직접 사용 금지 — 상수로 추출

## 모듈

- 두 번 이상 사용되는 함수는 별도 모듈 파일로 분리
- 모듈 파일명: `kebab-case.ts` (예: `format-date.ts`), named export
- 슬라이스 외부 접근은 반드시 `index.ts`를 통해서만
- 특정 슬라이스 전용 모듈은 해당 슬라이스 내부에 배치, 2개 이상 슬라이스에서 사용 시 `shared/lib/`로 이동
