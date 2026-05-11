<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-05 | Updated: 2026-05-05 -->

# pages

## Purpose
Nuxt 3 파일 기반 라우팅. 관리자 웹 대시보드(`/admin`), 모바일 납품확인(`/m/delivery`), 공개 페이지(`/`) 등 모든 페이지 진입점을 정의한다. SSG 빌드 대상.

## Key Files
| File | Description |
|------|-------------|
| `index.vue` | 공개 랜딩 페이지 (로그인 전) |
| `login.vue` | 로그인 페이지 |
| `profile/index.vue` | 사용자 프로필 페이지 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `admin/` | 관리자 웹 대시보드 (6개 카테고리) |
| `m/` | 모바일 페이지 |
| `mobile/` | 모바일 호환성 페이지 |
| `profile/` | 사용자 프로필 관리 |

## For AI Agents

### Working In This Directory
- 파일명: kebab-case (예: `order-list.vue`, `[id].vue`)
- 동적 라우트: `[id].vue` (폴더명도 [id]) 사용
- 모든 `/admin` 하위 페이지는 `auth` 미들웨어 필수 (`defineRouteRules`)
- 페이지 타이틀: `definePageMeta({ title: '발주관리' })`
- API 데이터 로딩: `onMounted()` 또는 비동기 `<script setup>`
- 에러 처리: try-catch + useApiError() composable

### Routing Structure
| Path | File | Purpose | Auth |
|------|------|---------|------|
| `/` | `index.vue` | 공개 랜딩 | X |
| `/login` | `login.vue` | 로그인 | X |
| `/admin/**` | `admin/**` | 관리자 대시보드 | O (auth 미들웨어) |
| `/m/delivery/[token]` | `m/delivery/[token].vue` | 모바일 납품확인 | X (토큰 기반) |
| `/profile` | `profile/index.vue` | 사용자 프로필 | O |

### Admin Pages (Pages in /admin)
| Category | Path | Purpose |
|----------|------|---------|
| **기초정보** | `/admin/basic-info/***` | 사용자, 회사, 품목, 코드, 조직, 은행계좌 |
| **발주/수주** | `/admin/order/***` | 발주 관리, 수주 목록 |
| **출하** | `/admin/shipping/***` | 출하 관리, 운송 정보 |
| **납품** | `/admin/delivery/***` | 납품확인, 완료 |
| **자금** | `/admin/fund/***` | 선금, 기성금, 최종금 |
| **통계** | `/admin/statistics/***` | 매출, 지역별, 월별 |

### Common Patterns
- 페이지 로드 데이터: `const { data } = await service.getDetail(id)`
- 폼 제출: `const success = await service.update(data)` + `useRouter().push()`
- 리스트 페이징: `page.value - 1` (API 호출 시 0-indexed)
- 모달 열기: `isModalOpen.value = true` (부모에서 상태 관리)

## Dependencies

### Internal
- `components/admin/**` (UI)
- `services/**` (API)
- `stores/auth`, `permission`
- `composables/useDataTable`, `useForm`, `useApi`
- `types/**` (도메인 타입)

### External
- vue, vue-router, nuxt
- pinia (상태)
- @vueuse/core (유틸)

<!-- MANUAL: -->
