<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-05 | Updated: 2026-05-05 -->

# assets

## Purpose
정적 자원. CSS 공통 스타일 (Tailwind 기반), 이미지, 폰트, JavaScript. 빌드 시 자동으로 최적화되어 `dist/` 에 포함된다. CSS는 `<style>` 블록에서 `@import` 로 사용.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `css/` | 공통 CSS 파일 (admin-*.css, 변수, 믹스인) |
| `images/` | PNG, SVG, JPG 등 이미지 |
| `font/` | 웹폰트 (미리 로드) |
| `js/` | 번들링되지 않은 유틸 스크립트 |

## Key Files (css/)
| File | Description |
|------|-------------|
| `admin-common.css` | 기본 폼, 테이블, 스페이싱 (필수 import) |
| `admin-forms.css` | info-group, fieldset 패턴 |
| `admin-buttons.css` | 버튼 스타일 (primary, secondary, danger) |
| `admin-tables.css` | 테이블 레이아웃, 셀 간격 |
| `admin-search.css` | 검색 UI 폼 |
| `admin-modals.css` | 모달 스타일 |

## For AI Agents

### Working In This Directory
- CSS 작성: 절대 금지. 필요하면 기존 파일에 추가할 것
- 이미지: `/app/leadpower` 또는 `/app/shipmg` 경로로 서빙
- 폰트: `@font-face` 정의 시 `font/` 디렉토리 참조
- 스타일 병합: CSS-in-JS 사용 금지, Tailwind 클래스만 사용

### CSS 사용 규칙 (중요!)
```vue
<style scoped>
/* 공통 CSS import (필수) */
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

/* 컴포넌트 전용 스타일만 작성 */
.custom-section {
  padding: 1rem;
  background: var(--bg-secondary);  /* Tailwind 변수 사용 */
}
</style>
```

### 공통 CSS 구조
- **변수**: `--color-primary`, `--space-base` 등 (Tailwind v4 호환)
- **마진/패딩**: `.mt-1`, `.p-4` 등 Tailwind 클래스 (CSS 금지)
- **미디어쿼리**: `@apply md:flex` (Tailwind 지시자)

### 이미지 경로
| Context | Path | Example |
|---------|------|---------|
| 컴포넌트 | `~/assets/images/...` | `src="~/assets/images/logo.png"` |
| CSS | `@/assets/images/...` | `background: url('@/assets/images/bg.png')` |
| 서빙 경로 | `/assets/...` | `<img src="/assets/images/logo.png" />` |

### Tailwind v4 주요 변경
- 폰트: `font-*` (기존 `font-family` 사용 금지)
- 색상: `text-blue-500` (hex #0000FF 아님)
- 간격: `space-y-4` (margin 수동 계산 금지)
- 반응형: `md:` prefix (breakpoint 시작)

## Dependencies

### Internal
- 없음 (자원 목록만)

### External
- tailwindcss v4 (빌드 타임)
- nuxt (자동 최적화)

<!-- MANUAL: -->
