<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-05 | Updated: 2026-05-05 -->

# ptlpsm (프론트엔드)

## Purpose
Nuxt 3 기반 SSG 프론트엔드. 관리자 웹 대시보드와 모바일 납품확인 화면을 동일 코드베이스에서 빌드하며, 환경별로 `generate:dev`/`generate:prod` 산출물을 leadpower / shipmg 서버에 배포한다.

## Key Files
| File | Description |
|------|-------------|
| `package.json` | 의존성·스크립트 정의 (Nuxt 3.15, Vue 3.3, Pinia 2, Tailwind v4, axios, exceljs, xlsx, chart.js, ckeditor5) |
| `nuxt.config.ts` | Nuxt 설정 (SSG, 모듈, env) |
| `tailwind.config.js` | Tailwind v4 설정 |
| `tsconfig.json` | TypeScript 설정 |
| `app.vue` / `error.vue` | 루트 진입/에러 페이지 |
| `CLAUDE.md` | 프론트 가이드 (CSS 규칙, 페이징 규칙 등) |
| `.env.development` / `.env.production` | 환경별 API URL |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `pages/` | 라우트 (admin, m/delivery, mobile, profile) - `pages/AGENTS.md` |
| `components/` | Vue 컴포넌트 (admin/, ui/, fund/, shipment/, purchase-order/, delivery-done/) - `components/AGENTS.md` |
| `composables/` | 재사용 컴포저블 (useApi, useDataTable, useForm, useFundCalculations 등) - `composables/AGENTS.md` |
| `services/` | REST API 클라이언트 (도메인별 *.service.ts) - `services/AGENTS.md` |
| `stores/` | Pinia 스토어 (auth, baseline, commission, fund, mobileOrderRequest, permission) - `stores/AGENTS.md` |
| `types/` | TypeScript 타입 정의 (도메인별) - `types/AGENTS.md` |
| `utils/` | 순수 유틸 (format, validate, storage, image-compress, logger 등) - `utils/AGENTS.md` |
| `layouts/` | 레이아웃 (default, admin, mobile) |
| `middleware/` | 라우트 미들웨어 (auth, permission) |
| `plugins/` | Nuxt 플러그인 |
| `assets/` | 정적 자원 (css/, images/) |
| `public/` | 정적 서빙 자원 |
| `templates/` | 문서 템플릿 |
| `sql/` | 프론트가 참조하는 SQL 메모 |
| `scripts/` | 빌드/배포 보조 스크립트 |
| `docs/` | CSS, 리팩토링, 납품 시스템, API 가이드 |
| `.refactoring/` | 진행 중 리팩토링 노트 |

## For AI Agents

### Working In This Directory
- 들여쓰기 2칸, 작은따옴표, camelCase(변수)/PascalCase(컴포넌트)/kebab-case(페이지 파일).
- API 호출은 `services/*.service.ts` 통일, 직접 fetch 분산 금지.
- 인증 헤더는 `getAuthHeaders()` 사용.
- 모달은 `<Teleport to="body">` 패턴.
- 공통 CSS는 `assets/css/admin-*.css`를 import만, 같은 스타일 중복 작성 금지.
- 페이징: UI(1-indexed) → API(0-indexed) 변환 필수 (`page: currentPage.value - 1`).
- 두 가지 페이지네이션 응답 타입 공존:
  - `services/api/client.ts` 의 `PageResponse<T>` — Spring Data 표준 (`number`, `size`, `totalElements`, `totalPages`). **신규 코드 권장**.
  - `types/common.ts` 의 `PaginationResponse<T>` — `{ content, page: PageInfo }` 객체 패턴. 일부 레거시 도메인 한정.

### Testing Requirements
- 단위 테스트 미구현. UI 변경 시 `npm run dev` 후 브라우저 수동 검증 필수.
- 정적 빌드 검증: `npm run generate:dev` 통과 여부 확인.
- 메모리 4GB 할당 (`--max-old-space-size=4096`).

### Common Patterns
- Pinia 스토어: setup 스타일 (`defineStore('xxx', () => { ... })`).
- 서비스: `xxxService.getList(params)` 형태의 객체 + async 메서드.
- 상수+타입: `as const` + `typeof X[keyof typeof X]` 패턴 + 라벨 맵.

## Dependencies

### Internal
- 백엔드 API: `ptlpsmback`의 `/api/**` 호출 (HTTP).
- 빌드 산출물은 `/app/leadpower` 또는 `/app/shipmg` 정적 서빙.

### External
- 핵심: nuxt, vue, pinia, axios, @vueuse/core, vue-router
- UI/스타일: tailwindcss v4, lucide-vue-next, swiper, aos, @vuepic/vue-datepicker
- 데이터/문서: chart.js, exceljs, xlsx, docx, @ckeditor/ckeditor5-build-classic
- 이미지: @nuxt/image, sharp(빌드 시)

<!-- MANUAL: -->
