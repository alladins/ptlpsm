# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PTLPSM** - Nuxt 3 기반 출하관리 시스템 (프론트엔드)
- 공공조달 물류/출하 관리
- 관리자 대시보드 + 모바일 납품확인

## Key Commands

```bash
npm run dev           # 개발 서버 (localhost:3000)
npm run generate      # 정적 사이트 빌드 (SSG)
npm run generate:dev  # 개발 환경용 빌드 (leadpower.platree.com)
npm run generate:prod # 운영 환경용 빌드 (shipmg.lphydrofoam.com)
npm run lint          # 코드 린트
npm run preview       # 프로덕션 빌드 미리보기
```

## Architecture

- **Mode**: SSG (정적 사이트), SSR 비활성화
- **State**: Pinia
- **Style**: Tailwind CSS v4

## 환경 구성

| 구분 | 개발 (DEV) | 운영 (PROD) |
|------|------------|-------------|
| **도메인** | leadpower.platree.com | shipmg.lphydrofoam.com |
| **API 포트** | 9031 | 9032 |
| **서버 경로** | /app/leadpower | /app/shipmg |
| **용도** | 개발/테스트 | 운영 |

### API URL
- 로컬: `http://localhost:9031/api`
- 개발: `http://leadpower.platree.com:9031/api`
- 운영: `http://shipmg.lphydrofoam.com:9032/api`

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
apiEnvironment.printStatus()       // 현재 환경 정보 출력
apiEnvironment.forceProduction()   // 운영 API (shipmg:9032)
apiEnvironment.forceDevelopment()  // 개발 API (leadpower:9031)
```

> **참고**: 도메인 기반 자동 감지가 우선 적용됩니다. localhost에서만 수동 전환이 가능합니다.

## Git 브랜치 전략

```
main (운영) ←── develop (개발)
                   ↑
              feature/* (기능 개발)
```

### 브랜치 역할
| 브랜치 | 용도 | 배포 대상 |
|--------|------|-----------|
| `main` | 운영 코드 | shipmg.lphydrofoam.com |
| `develop` | 개발/테스트 코드 | leadpower.platree.com |
| `feature/*` | 기능 개발 | - |

### 작업 흐름
1. **기능 개발**: `develop`에서 `feature/*` 브랜치 생성 → 작업 → `develop`에 머지
2. **개발 배포**: `develop` 브랜치 → `npm run generate:dev` → 개발 서버 배포
3. **운영 배포**: `develop`를 `main`에 머지 → `npm run generate:prod` → 운영 서버 배포

### 명령어
```bash
# 기능 개발 시작
git checkout develop
git pull origin develop
git checkout -b feature/기능명

# 개발 완료 후 develop에 머지
git checkout develop
git merge feature/기능명
git push origin develop

# 운영 배포 시 main에 머지
git checkout main
git merge develop
git push origin main
```

## 언어 규칙

- **응답/주석/커밋**: 한국어
- **변수/함수명**: 영어 (camelCase)
- **컴포넌트/타입명**: 영어 (PascalCase)

## 코드 패턴

### API 호출 시 인증 헤더
```typescript
import { getAuthHeaders } from '@/services/api'
const response = await fetch(url, { headers: getAuthHeaders() })
```

### 모달 컴포넌트
```vue
<Teleport to="body">
  <div v-if="isOpen" class="modal-overlay">...</div>
</Teleport>
```

## Important Notes

- **Memory**: 정적 빌드 시 4GB 할당 (`--max-old-space-size=4096`)
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

## 하네스: 문서/사용자매뉴얼 자동생성

**목표:** PTLPSM 소스코드(프론트/백엔드/DB)에서 사용자 매뉴얼·엔티티 관계도·상태 흐름도·API 문서·비즈니스 규칙 문서를 질문 없이 자동 생성·검증한다.

**트리거:** 매뉴얼/문서 생성·갱신·재생성, 엔티티/상태흐름/API 문서화, "코드베이스 분석해서 문서화" 요청 시 `manual-harness-orchestrator` 스킬을 사용하라. 단순 도메인 질문(상태흐름 한 줄 확인 등)은 직접 응답 가능.

**구성:** 에이전트/스킬은 `.claude/agents/`, `.claude/skills/`, 권위 지식베이스는 `.claude/knowledge-base/*.yaml`에서 관리(오케스트레이터가 전체 조율). 상세 목록은 해당 디렉토리 및 오케스트레이터 스킬 참조.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-01-02 | 초기 구성 (분석→합성→생성→검증 파이프라인) | 전체 | - |
| 2026-06-15 | 규약 정비(동기화): 스킬 폴더화+frontmatter(name/description), 전 에이전트 opus 통일, 오케스트레이터 스킬 신설, 구형 스킬 경로 참조 수정, CLAUDE.md 포인터 등록 | skills/*, agents/*, CLAUDE.md | 현재 하네스 규약 준수 |
| 2026-06-15 | 사용자 매뉴얼 전 9개 장 상세 보강(코드 근거 단계별 조작·필드/오류 사전·예시·스크린샷 자리표시), 상세 작성 표준을 manual-generator 스킬에 명문화 | docs/출하관리시스템_사용자매뉴얼.md, skills/manual-generator | "매뉴얼을 더 상세하게" 요청 반영 |

---

**버전**: 1.1.0 (2025-01-27 간소화)
