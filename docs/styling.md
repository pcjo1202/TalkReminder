---
title: 스타일링
description: Tailwind CSS v4 설정 방식, 디자인 토큰(oklch), 다크 모드, 폰트 변수, shadcn/ui 추가 방법
---

# 스타일링 (Tailwind CSS v4)

## 설정 방식

PostCSS 플러그인 없이 CSS에서 직접 import:

```css
@import "tailwindcss";
```

## 디자인 토큰

모든 토큰은 `src/app/globals.css`에 `oklch` 색상값으로 정의.

## 다크 모드

`.dark` 클래스 변형 사용:

```css
@custom-variant dark (&:is(.dark *));
```

## 폰트

`src/app/layout.tsx`에서 `next/font/google`으로 로드.

| 변수 | 폰트 |
|------|------|
| `--font-sans` | Pretendard / Geist |
| `--font-serif` | Noto Serif Gujarati |
| `--font-mono` | JetBrains Mono |

## shadcn/ui 컴포넌트 추가

```bash
pnpm dlx shadcn@latest add <컴포넌트명>
```

컴포넌트는 `src/shared/ui/`에 위치.
