# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**PTLPSM** - Nuxt 3 기반 출하관리 시스템 (프론트엔드)
- 공공조달 물류/출하 관리
- 관리자 대시보드 + 모바일 납품확인

## Key Commands

```bash
npm run dev        # 개발 서버 (localhost:3000)
npm run generate   # 정적 사이트 빌드 (SSG)
npm run lint       # 코드 린트
npm run preview    # 프로덕션 빌드 미리보기
```

## Architecture

- **Mode**: SSG (정적 사이트), SSR 비활성화
- **State**: Pinia
- **Style**: Tailwind CSS v4
- **API**: 
  - 개발: `http://localhost:9031/api`
  - 운영: `http://leadpower.platree.com:9031/api`

## Directory Structure

```
pages/
├── index.vue              # 공개 랜딩 페이지
├── admin/                 # 관리자 페이지
│   ├── basic-info/        # 기초정보 (사용자, 코드, 회사, 품목)
│   ├── order/             # 발주관리
│   ├── sales/             # 수주관리
│   ├── shipping/          # 출하관리
│   ├── transport/         # 운송관리
│   └── delivery/          # 납품확인
└── m/delivery/[token].vue # 모바일 납품확인

services/                  # API 서비스 레이어
components/                # Vue 컴포넌트
├── ui/                    # 공통 UI
└── admin/                 # 관리자 전용
composables/               # Vue Composables
types/                     # TypeScript 타입
utils/                     # 유틸리티 함수
assets/css/                # 공통 CSS
```

## CSS 규칙 (중요!)

**상세 가이드**: [`docs/CSS_GUIDELINES.md`](docs/CSS_GUIDELINES.md)

### 핵심 원칙
- ❌ 공통 CSS에 있는 스타일 중복 작성 금지
- ✅ 공통 CSS import 후 필요한 스타일만 추가

### 공통 CSS 파일
| 파일 | 용도 |
|------|------|
| `admin-common.css` | 기본 폼, 테이블 |
| `admin-forms.css` | info-group 패턴 |
| `admin-buttons.css` | 버튼 스타일 |
| `admin-tables.css` | 테이블 레이아웃 |
| `admin-search.css` | 검색 UI |

### 사용 예시
```vue
<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
/* 컴포넌트 전용 스타일만 작성 */
</style>
```

## API 환경 전환

브라우저 콘솔에서:
```javascript
apiEnvironment.forceProduction()   // 운영 API
apiEnvironment.forceDevelopment()  // 개발 API
```

## Important Notes

- **Memory**: 정적 빌드 시 4GB 할당 (`--max-old-space-size=4096`)
- **HMR**: 비활성화됨 (`hmr: false`)
- **Language**: 한국어 (`lang: 'ko'`)

## 페이징 규칙 (중요!)

### API 페이징 (0-indexed)
- Spring Boot API는 **0부터 시작**하는 페이지 번호 사용
- 첫 번째 페이지: `page=0`

### UI 페이징 (1-indexed)
- 사용자에게 표시되는 페이지 번호는 **1부터 시작**
- 첫 번째 페이지: `currentPage = 1`

### 변환 규칙
```typescript
// UI → API 호출 시
const response = await service.getList({
  page: currentPage.value - 1,  // UI 1 → API 0
  size: 10
})

// API 응답 → UI 표시 시
pagination.value = {
  page: response.number + 1,  // API 0 → UI 1
  totalPages: response.totalPages
}
```

### 예시 코드
```typescript
// ✅ 올바른 예시
const loadData = async () => {
  const response = await service.getList({
    page: currentPage.value - 1,  // 변환 필요!
    size: 10
  })
}

// ❌ 잘못된 예시 (API에 1을 전달하면 두 번째 페이지 조회)
const loadData = async () => {
  const response = await service.getList({
    page: currentPage.value,  // 변환 누락!
    size: 10
  })
}
```

## 상세 문서

| 문서 | 내용 |
|------|------|
| [`docs/CSS_GUIDELINES.md`](docs/CSS_GUIDELINES.md) | CSS 사용 규칙 |
| [`docs/REFACTORING_STRATEGY.md`](docs/REFACTORING_STRATEGY.md) | 리팩토링 전략 |
| [`docs/DELIVERY_SYSTEM.md`](docs/DELIVERY_SYSTEM.md) | 납품확인 시스템 |
| [`docs/API_ENDPOINTS_GUIDE.md`](docs/API_ENDPOINTS_GUIDE.md) | API 엔드포인트 |
| [`docs/API_REQUEST_FORMAT.md`](docs/API_REQUEST_FORMAT.md) | 납품요구 등록/수정 API 포맷 |

---

**버전**: 1.1.0 (2025-01-27 간소화)
