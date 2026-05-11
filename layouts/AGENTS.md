<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-05 | Updated: 2026-05-05 -->

# layouts

## Purpose
Nuxt 3 레이아웃 템플릿. 페이지가 감싸지는 공통 구조(사이드바, 헤더, 푸터). `<slot />`으로 페이지 내용 주입. 각 페이지는 `definePageMeta({ layout: 'admin' })`으로 레이아웃 선택.

## Key Files
| File | Description |
|------|-------------|
| `default.vue` | 기본 레이아웃 (공개 페이지용, 최소 UI) |
| `admin.vue` | 관리자 웹 레이아웃 (사이드바, 헤더, 대리로그인 배너) |
| `AdminLayout.vue` | 제외됨 (admin.vue 사용) |

## For AI Agents

### Working In This Directory
- 파일명: PascalCase (예: `AdminLayout.vue`)
- 기본 슬롯 사용: `<slot />`
- 이름 슬롯: 특정 영역(헤더, 푸터) 선택적 주입
- 반응형 상태: Teleport로 모바일 메뉴 처리
- CSS: `scoped` 사용, 공통 CSS import
- 자식 컴포넌트: SidebarMenu, AppHeader 등 포함

### Layout Pattern
```vue
<template>
  <div class="layout">
    <!-- 공통 영역 -->
    <header>
      <slot name="header" />
    </header>
    
    <!-- 페이지 내용 -->
    <main>
      <slot />
    </main>
    
    <!-- 공통 푸터 -->
    <footer>
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup>
// 레이아웃 전용 상태 관리
const isMobileMenuOpen = ref(false)
</script>

<style scoped>
/* 레이아웃 전용 스타일만 작성 */
</style>
```

### 페이지에서 레이아웃 선택
```vue
<script setup>
definePageMeta({
  layout: 'admin'  // default | admin
})
</script>
```

### 레이아웃 책임
| Layout | 포함 요소 | 대상 페이지 |
|--------|---------|----------|
| `default` | 헤더(최소), 푸터 | /, /login, /profile |
| `admin` | 사이드바, 헤더, 대리로그인 배너, 푸터 | /admin/** |

### Responsive 처리
- 모바일 메뉴: `isMobileMenuOpen` ref + Teleport
- 사이드바 축소: 데스크톱에서 토글 가능
- breakpoint: Tailwind v4 기본 값 (sm, md, lg)
- 상태 Props: 부모 → 자식 (SidebarMenu, AppHeader)

## Dependencies

### Internal
- `components/SidebarMenu.vue`
- `components/PageHeader.vue` (또는 커스텀 헤더)
- `components/ImpersonationBanner.vue` (admin.vue만)
- `stores/auth` (사용자 정보, 로그아웃)
- `composables/usePermission` (메뉴 권한)

### External
- vue, nuxt

<!-- MANUAL: -->
