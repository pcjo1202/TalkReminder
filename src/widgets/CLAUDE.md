# widgets

독립적인 복합 UI 블록. 여러 entities와 features를 조합하는 레이어.

## 규칙

- **서버 컴포넌트 지향** — `"use client"` 지양
- 인터랙션이 필요한 부분은 features 컴포넌트에 위임
- 데이터 페칭(Supabase 서버 클라이언트)은 widget 내 async 서버 컴포넌트에서 수행
- 외부 공개는 `index.ts`를 통해서만 — `export *` 금지, 명시적 named re-export

## 구조

```
widgets/<위젯명>/
├── ui/        # 조합 컴포넌트 (서버 컴포넌트)
└── index.ts   # Public API
```

## 의존 가능 레이어

- `features`, `entities`, `shared` import 가능
