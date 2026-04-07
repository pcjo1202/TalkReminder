---
paths:
  - "src/**/*.tsx"
  - "next.config.ts"
---

## next/image 컴포넌트

- 모든 래스터 이미지는 `next/image`의 `<Image>` 사용 필수 — `<img>` 직접 사용 금지
- `width` + `height` 명시 또는 `fill` prop 사용 (CLS 방지)
- `priority` prop: LCP 이미지에만 적용

## 외부 이미지

- 외부 도메인 이미지는 `next.config.ts`의 `images.remotePatterns`에 등록 필수
- `images.domains`는 deprecated — 반드시 `remotePatterns` 사용

## SVG / 아이콘

- 아이콘: `lucide-react` 우선 사용
- 장식용 SVG: `aria-hidden="true"` 필수
