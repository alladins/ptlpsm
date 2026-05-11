<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-05 | Updated: 2026-05-05 -->

# components

## Purpose
Vue 3 컴포넌트 라이브러리. 공통 UI (Card, Pagination, PageHeader 등)와 도메인별 기능 컴포넌트로 분류. 관리자 웹과 모바일 납품확인 페이지에서 재사용되는 모든 UI 요소를 포함한다.

## Key Files
| File | Description |
|------|-------------|
| `Card.vue` | 기본 카드 컴포넌트 (섹션 래퍼) |
| `PageHeader.vue` | 페이지 헤더 (제목, 작업 버튼) |
| `Pagination.vue` | 페이지 네이션 (1-indexed UI) |
| `ProcessStep.vue` | 프로세스 진행 상태 표시 |
| `SecureImage.vue` | 인증된 이미지 로딩 (Authorization 헤더) |
| `SidebarMenu.vue` | 관리자 사이드바 메뉴 |
| `ApiEnvironmentSwitcher.vue` | API 환경 수동 전환 (개발/운영) |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `admin/` | 관리자 전용 컴포넌트 (11개: basic-info, common, company, delivery, delivery-done, forms, inventory, message-templates, oem-cost, order, transport) |
| `ui/` | 공통 UI (Card, PageHeader, Pagination 등 5개) |
| `fund/` | 자금 관리 모달·폼 |
| `purchase-order/` | 발주서 컴포넌트 |
| `shipment/` | 출하 관리 컴포넌트 |
| `delivery-done/` | 납품완료계 컴포넌트 |

## For AI Agents

### Working In This Directory
- 파일명: PascalCase (예: `OrderForm.vue`)
- 스타일: `<style scoped>` 사용, 공통 CSS import 후 필요한 스타일만 추가
- 공통 CSS 중복 작성 금지 (`assets/css/admin-*.css` 참고)
- Props·Emits는 `<script setup lang="ts">` 타입 문법 사용
- 모달: `Teleport to="body"` 패턴 필수
- 폼 유효성: `useForm()` composable 사용

### Common Patterns
- Props 정의: `withDefaults(defineProps<Props>(), { ... })`
- Emit: `defineEmits<{ update: [value: string], close: [] }>()`
- API 호출: 컴포넌트 내 직접 호출 금지, 부모 페이지에서 데이터 주입
- 로딩/에러 상태: 부모에서 관리, Props로 전달

### Domain Organization (admin/)
| Subdomain | Files | Purpose |
|-----------|-------|---------|
| `basic-info/` | 6+ | 사용자, 회사, 품목, 코드, 조직, 은행계좌 |
| `order/` | 5+ | 발주 목록, 상세, 폼, 모달 |
| `delivery/` | 5+ | 납품확인 목록, 상태, 모달 |
| `shipment/` | 4+ | 출하 목록, 상세, 운송 정보 |
| `transport/` | 3+ | 운송사, 운송 추적 |
| `inventory/` | 2+ | 재고 현황 |
| `fund/` | 3+ | 선금, 기성금, 최종금 |
| `forms/` | 공통 폼 컴포넌트 |

## Dependencies

### Internal
- `composables/useDataTable`, `usePermission`, `useApiError`, `admin/useFormBase`, `admin/useFormValidation`
- `services/*.service.ts`
- `stores/auth`, `permission`, `fund` 등
- `types/*` (도메인 인터페이스)
- `utils/format`, `validate`
- `assets/css/admin-*.css`

### External
- vue (3.3+), @vueuse/core
- lucide-vue-next (아이콘)
- @vuepic/vue-datepicker
- swiper (캐러셀)

<!-- MANUAL: -->
