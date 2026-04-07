---
paths:
  - "src/**/*.tsx"
---

## 시맨틱 HTML

- 페이지 레벨 랜드마크 필수: `<header>`, `<main>`, `<footer>` / 보조 콘텐츠: `<aside>` / 내비게이션: `<nav>`
- 폼 요소는 시맨틱 태그 사용: `<form>`, `<fieldset>`, `<legend>`, `<label>`
- `<div>` 남용 금지 — 의미에 맞는 HTML 요소 우선

## 이미지

- 모든 `<Image>`에 `alt` 필수
- 장식용 이미지: `alt=""` + `aria-hidden="true"`

## 인터랙티브 요소

- 클릭 가능한 비-button 요소 금지 — `<button>` 또는 `<a>` 사용
- 모달/다이얼로그: `aria-modal="true"`, 포커스 트랩, ESC 닫기 구현
- 토글 UI: `aria-expanded` 상태 관리
- 알림/토스트: `aria-live="polite"` 적용

## ARIA 사용 원칙

- 네이티브 HTML 요소로 해결 가능하면 ARIA 사용 금지 (`<div role="button">` X -> `<button>` O)
- `aria-*` 속성을 추가했으면 해당 동작도 반드시 구현

## 키보드 접근성

- 모든 인터랙티브 요소는 키보드로 접근/조작 가능해야 함
- 포커스 순서 = 시각적 순서. CSS `order`, `row-reverse` 등으로 시각적 순서만 변경 금지
- 포커스 표시(outline) 제거 금지 — 커스텀 스타일은 허용

## 스크린 리더

- 시각적으로만 숨김: `sr-only` 클래스 / 완전 숨김: `aria-hidden="true"` 또는 `hidden`
- `aria-hidden="true"`를 포커스 가능한 요소에 사용 금지
- 아이콘 전용 버튼: `aria-label` 필수
- 동일 텍스트 링크 반복 시 `aria-label`로 맥락 구분
