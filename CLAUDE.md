# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PTLPSM** is a shipping/logistics management system (출하관리 시스템) built with Nuxt 3. The application manages shipments, orders, sales, items, companies, and organizational data. It includes a public-facing website and an admin dashboard for managing logistics operations.

## Key Commands

### Development
```bash
npm run dev              # Start development server on localhost:3000
```

### Build & Deploy
```bash
npm run build            # Production build
npm run generate         # Generate static site (SSG mode with 4GB memory allocation)
npm run preview          # Preview production build locally
npm start               # Start production server
```

### Code Quality
```bash
npm run lint            # Lint JavaScript and Vue files
```

## Architecture

### Rendering Strategy
- **SSR**: Disabled (`ssr: false`)
- **Mode**: Static Site Generation (SSG) with Nitro preset 'static'
- **Pre-rendering**: Configured to crawl and generate all routes listed in `nuxt.config.ts`

### Directory Structure

#### `/pages/`
- `/pages/index.vue` - Public landing page
- `/pages/admin/` - Admin dashboard and management pages
  - `index.vue` - Dashboard
  - `settings.vue` - System settings
  - `/basic-info/` - Core data management (users, codes, companies, items, organizations)
  - `/order/` - Order management
  - `/sales/` - Sales management
  - `/shipping/` - Shipping management
  - `/transport/` - Transport management
  - `/delivery/` - Delivery management
  - `/statistics/` - Analytics and reporting
  - `/system/` - System administration

#### `/services/`
API service layer using Fetch API. Each service handles specific domain operations:
- `api.ts` - Environment configuration and API base URL management
- `user.service.ts` - User CRUD operations
- `code.service.ts` - Code management (system codes, categories)
- `company.service.ts` - Company data management
- `item.service.ts` - Item/product management
- `order.service.ts` - Order processing
- `sales.service.ts` - Sales data and reporting
- `shipment.service.ts` - Shipment tracking
- `transport.service.ts` - Transport logistics
- `delivery.service.ts` - Delivery confirmation (mobile + admin tree structure)
- `contract.service.ts` - Contract management
- `demand-organization.service.ts` - Demand organization management
- `menu.service.ts` - Menu and navigation management
- `visit.service.ts` - Page visit tracking (currently localStorage-based)
- `consultation.service.ts` - Consultation requests

#### `/middleware/`
- `auth.ts` - Authentication middleware (currently disabled for development; production logic is commented out)
- `environment.global.ts` - Global environment setup
- `visit-tracker.global.ts` - Automatic visit tracking on route changes

#### `/components/`
- Global auto-imported components
- `AppHeader.vue`, `AppFooter.vue` - Layout components
- `ConsultationPopup.vue` - Consultation form modal
- `DemandOrganizationSelector.vue` - Organization picker component
- `/admin/` - Admin-specific components
  - `/delivery/` - Delivery confirmation tree components
    - `OrderTreeNode.vue` - Order level tree node (발주)
    - `ShipmentTreeNode.vue` - Shipment level tree node (출하)
    - `TransportDetailNode.vue` - Transport detail node (운송)
    - `DeliveryRateBar.vue` - Delivery progress bar
    - `DeliveryStatusCard.vue` - Delivery status card
    - `PhotoGallery.vue` - Photo gallery modal
    - `SignatureViewer.vue` - PDF download button component
- `/ui/` - Reusable UI components
  - `PageHeader.vue` - Page header with title and actions
  - `Pagination.vue` - Pagination component
  - `/mobile/` - Mobile-specific components
    - `SignatureCanvas.vue` - Touch signature drawing canvas

#### `/layouts/`
- `default.vue` - Public site layout
- `admin.vue` - Admin dashboard layout
- `AdminLayout.vue` - Additional admin layout variant

#### `/types/`
TypeScript type definitions:
- `menu.ts` - Menu, MenuPage, and authorization types
- `delivery.ts` - Delivery tree structure types (Order, Shipment, Transport, DeliveryConfirmation)

#### `/api/`
Server API routes (though this is primarily a client-side app):
- `visit.ts` - Visit tracking endpoint
- `/public-data/` - Public data endpoints

#### `/utils/`
Utility functions for common operations:
- `format.ts` - Date, currency, number, phone number formatting functions

#### `/pages/m/`
Mobile-specific pages:
- `delivery/[token].vue` - Mobile delivery confirmation page (signature, photos, GPS)

### API Integration

The app connects to a backend API. API base URLs are managed by `services/api.ts`:
- **Development**: `http://localhost:9031/api`
- **Production**: `http://leadpower.platree.com:9031/api`

The environment is determined by:
1. Checking `window.location.hostname` (non-localhost = production)
2. LocalStorage setting (`api_environment`)
3. Fallback to `NODE_ENV`

### State Management

Uses Pinia for state management (setup via `@pinia/nuxt` module).

### Styling

- **Framework**: Tailwind CSS v4
- **Custom config**: `tailwind.config.ts` with custom colors, spacing, and typography
- **Primary color**: Blue (`#2563eb`)
- **Font**: Pretendard, Malgun Gothic (Korean support)
- **Global CSS**: `assets/css/main.css`, `assets/css/global.css`

### Image Optimization

Configured via `@nuxt/image` with:
- WebP format preference
- Multiple screen size breakpoints (xs to xxl)
- IPX provider for image processing
- Quality set to 80

### Authentication (Production)

When enabled, the auth middleware (`middleware/auth.ts`) checks:
- Token expiration and refresh via `authStore`
- Admin role verification for `/admin/*` routes
- User activity tracking
- Automatic redirect to `/login` if unauthenticated

Accepted admin roles: `ADMIN`, `ROLE_ADMIN`, `ADMINISTRATOR`, `ROLE_ADMINISTRATOR`

### Route Pre-rendering

All main routes are explicitly listed in `nuxt.config.ts` for static generation, including:
- Public pages (system certifications, products, management info, about, inquiry)
- Terms and privacy pages
- Admin routes are excluded from pre-rendering

## Development Workflow

1. **Starting development**: Run `npm run dev` and work on `localhost:3000`
2. **API environment switching**: Use `apiEnvironment.forceProduction()` or `apiEnvironment.forceDevelopment()` in browser console to switch API targets
3. **Building for production**: Run `npm run generate` to create static site in `.output/public/`
4. **Testing production build**: Run `npm run preview` to test locally

## Important Notes

- **Memory allocation**: Static generation uses 4GB max-old-space-size due to large build
- **HMR**: Hot module replacement is disabled (`hmr: false` in Vite config)
- **CORS**: API routes have CORS headers configured in `nitro.routeRules`
- **Cache headers**: Static assets cached for 1 year; pages cached for 1 hour
- **Browser zoom prevention**: Custom scripts in `nuxt.config.ts` disable zoom via Ctrl+wheel and keyboard shortcuts
- **Korean language**: Default lang is 'ko', with Korean meta tags and font support

## Testing

No test framework is currently configured. Manual testing is required.

## Common Patterns

### Creating a new service
1. Add a new file in `/services/` (e.g., `myfeature.service.ts`)
2. Import `getApiBaseUrl` from `services/api.ts`
3. Use axios to make API calls to `${getApiBaseUrl()}/your-endpoint`

### Adding a new admin page
1. Create page in `/pages/admin/yourpage.vue`
2. Use `definePageMeta({ middleware: 'auth' })` if authentication is needed
3. Add route to `nuxt.config.ts` pre-render exclusions if it's dynamic

### Using menu system
- Menu structure and page definitions are managed via `types/menu.ts`
- `menu.service.ts` handles fetching and caching menu data
- Admin pages can check user permissions via `MenuAuth` types


## 🔧 Refactoring Strategy (리팩토링 전략)

### ⚠️ 핵심 원칙
1. **기능 동일성 보장** - 모든 기능은 리팩토링 전/후 100% 동일
2. **중복 제거 필수** - 리팩토링 시 발견된 중복 코드는 반드시 문서화 후 제거
3. **점진적 진행** - 한 번에 하나의 페이지만 리팩토링

---

### 📂 파일 배치 규칙

#### `components/ui/` - 프로젝트 전체 공통 UI
- **조건**: Admin/Public 모두 사용 가능한 순수 UI 컴포넌트
- **예시**: DataTable, SearchForm, PageHeader, Pagination

#### `components/admin/common/` - Admin 공통 컴포넌트
- **조건**: 여러 Admin 페이지에서 사용하는 공통 컴포넌트
- **예시**: ErrorPopup, ItemSelectPopup, OrderSelectPopup

#### `components/admin/[domain]/` - 도메인 특화 컴포넌트
- **조건**: 특정 도메인(item, order, sales 등)에서만 사용
- **예시**: item/, order/, sales/

#### `composables/` - Vue 기반 재사용 로직
- **조건**: ref, computed, watch 등 Vue API 사용하는 로직
- **예시**: useDataTable, useForm, useModal
- **위치**: 루트는 전체 공통, `admin/`은 Admin 전용

#### `utils/` - 순수 함수
- **조건**: Vue 독립적인 순수 JavaScript/TypeScript 함수
- **예시**: formatDate(), formatCurrency(), validate()

---

### 🔍 중복 코드 탐지 및 제거 프로세스

#### 리팩토링 시 반드시 수행:

**1단계: 중복 분석 (리팩토링 전)**

리팩토링 대상 페이지를 분석하여 다음 중복 패턴을 체크:
- □ 검색 폼 (날짜, 키워드, 정렬)
- □ 페이지네이션 (changePage, pageNumbers, changePageSize)
- □ 테이블 헤더 (총 개수, 페이지 크기 선택)
- □ 데이터 로딩/에러 상태
- □ formatDate, formatCurrency 함수
- □ 페이지 헤더 (title, description)
- □ 모달 구조 (등록/수정/삭제)
- □ CSS 클래스 (.btn-primary, .form-input 등)

**2단계: 중복 제거 문서 생성**

각 페이지 리팩토링 후 `REFACTORING.md` 파일에 다음 형식으로 기록:

```markdown
## [페이지명] 중복 제거 내역

### 제거된 중복 (Before → After)

1. **검색 폼 로직 (50줄)**
   - Before: 인라인 검색 폼 + 로직
   - After: `<SearchForm>` 컴포넌트 사용 (5줄)
   - 위치: `components/ui/SearchForm.vue`

2. **페이지네이션 로직 (80줄)**
   - Before: changePage, pageNumbers, changePageSize 함수
   - After: `useDataTable` composable 사용 (10줄)
   - 위치: `composables/useDataTable.ts`

### 총 제거된 코드
- **450줄 제거** (2,000줄 → 1,550줄)
- **중복률**: 22.5% 감소
```

**3단계: 실제 리팩토링**
- 중복 코드를 공통 컴포넌트/composable/utils로 이동
- 기존 페이지에서 중복 코드 제거
- import 문으로 대체

**4단계: 검증**
- □ 모든 기능 동작 확인
- □ UI 동일성 확인
- □ 콘솔 에러 없음
- □ API 호출 정상
- □ 중복 제거 문서 작성 완료

---

### 🚫 절대 금지 사항

**리팩토링 시:**
- ❌ 새 기능 추가
- ❌ 기존 기능 수정/개선
- ❌ UI/UX 변경
- ❌ API 호출 방식 변경
- ❌ 비즈니스 로직 변경

**중복 제거 시:**
- ❌ "나중에 정리" - 반드시 즉시 정리
- ❌ 일부만 제거 - 발견된 중복은 모두 제거
- ❌ 문서 없이 제거 - 반드시 문서화

---

### ✅ 허용 사항

- ✅ 컴포넌트 분리 (큰 파일 → 작은 파일들)
- ✅ 중복 코드를 공통으로 추출
- ✅ 타입 정의를 types/로 이동
- ✅ 유틸 함수를 utils/로 이동
- ✅ 인라인 스타일을 공통 CSS로 이동
- ✅ 변수명, 함수명 명확화 (의미 변경 없이)

---

### 📊 리팩토링 성공 기준

각 페이지 리팩토링 후:
1. **코드 라인 수**: 50~70% 감소
2. **중복 코드**: 0% (모두 제거)
3. **기능 동일성**: 100% 유지
4. **타입 안정성**: 100% 타입 커버리지
5. **중복 제거 문서**: 필수 작성

---

## 🎯 Refactoring Roadmap (리팩토링 로드맵)

### Phase 1: 공통 인프라 구축
1. `utils/format.ts` - formatDate, formatCurrency 등
2. `utils/validate.ts` - 검증 함수
3. `utils/constants.ts` - 상수 정의
4. `types/common.ts` - 공통 타입 (Pagination, Sort, Filter 등)

### Phase 2: 공통 Composables
1. `composables/useDataTable.ts` - 테이블 로직 (페이징, 정렬, 검색)
2. `composables/useForm.ts` - 폼 로직 (상태, 검증, 제출)
3. `composables/useModal.ts` - 모달 로직 (열기/닫기)

### Phase 3: 공통 UI 컴포넌트
1. `components/ui/PageHeader.vue` - 페이지 헤더
2. `components/ui/SearchForm.vue` - 검색 폼
3. `components/ui/DataTable.vue` - 데이터 테이블
4. `components/ui/Pagination.vue` - 페이지네이션

### Phase 4: 페이지별 리팩토링 (복잡도 순)
1. **basic-info/item.vue** (2,830줄 → ~200줄 예상)
2. **order/edit/[id].vue** (1,556줄 → ~200줄)
3. **sales/edit/[id].vue** (1,510줄 → ~200줄)
4. 기타 페이지들

---

## 📝 Refactoring Checklist Template

각 페이지 작업 시 사용할 체크리스트:

```markdown
# [페이지명] 리팩토링 체크리스트

## Before (분석)
- [ ] 전체 라인 수: ____줄
- [ ] 주요 기능 목록 작성
- [ ] 중복 패턴 식별
- [ ] 의존성 파악

## During (작업)
- [ ] 중복 제거 계획 수립
- [ ] 공통 컴포넌트 생성
- [ ] 기존 코드 교체
- [ ] import 문 정리

## After (검증)
- [ ] 전체 라인 수: ____줄 (감소율: __%)
- [ ] 모든 기능 동작 확인
- [ ] UI 동일성 확인
- [ ] 콘솔 에러 없음
- [ ] 중복 제거 문서 작성
```

---

발주관리에서 서버에게 받아야 데이터 최종 정리된 json 데이터 포맷
{
  "success": true,
  "fileName": "02.군산시 ...pdf",
  "fileSize": 234457,
  "processingTime": 371,
  "extractedText": "조달청 (전북...)",
  "extractedContractInfo": {
    "contractNumber": "제00-22-7-0305-01호",
    "contractDate": "2024-07-02",
    "preNotificationNumber": "AN...",
    "deliveryRequestNumber": "35-24-3-41787-00",
    "requestingAgency": "한국농어촌공사 전북지역본부 군산지사",
    "requestingAgencyNumber": "4038207678",
    "requestingAgencyPhoneNumber": "063-440-5916",
    "requestingAgencyFaxNumber": "063-463-8426",
    "requestingAgencyPostalCode": "54176",
    "requestingAgencyAddress": "전라북도 군산시 옥산면 ...",
    "requestingAgencyContactPerson": "김중철",
    "naraJangteoNumber": "D150324",
    "businessRegistrationNumberDemand": "4038207678",
    "businessRegistrationNumberSupplier": "4038176111",
    "paymentMethod": "대지급",
    "deliveryRequestDate": "2024-07-02",
    "businessName": "군산시광역해양레저체험복합단지조성사업 폴리우레탄...",
    "itemTotalAmount": 271309660,
    "commission": 1465070,
    "totalAmount": 272774730,
    "quantityTotal": "31571",
    "preDiscountAmountTotal": "726,108,000",
    "partialDelivery": "가능",
    "inspectionAgency": "한국농어촌공사 전북지역본부...",
    "acceptanceAgency": "한국농어촌공사 전북지역본부..."
  },
  "extractedFields": { "...": "..." },
  "extractedDeliveryItems": [
    {
      "sequenceNumber": 1,
      "optionItemNumber": "",
      "itemClassificationNumber": "30141503",
      "itemIdentificationNumber": "25312984",
      "name": "기포단열재",
      "specification": "폴리우레탄기포단열재, 정 ... 1000×1000×80mm, 경질2종2호",
      "unit": "m²",
      "unitPrice": 29000,
      "quantity": 827,
      "totalAmount": 23983000,
      "deliveryLocation": "수요기관 지정장소",
      "deliveryDeadline": "2025-12-19",
      "deliveryTerms": "공장상차도",
      "inspectionExemption": "N",
      "midTermCompetitionItem": "N"
    }
  ]
}

---

## 📦 Delivery Confirmation System (납품확인 시스템)

### 개요
납품확인 시스템은 **모바일 기반 현장 납품 확인**과 **관리자 트리 구조 조회**를 지원하는 핵심 기능입니다.

### 아키텍처

#### 1. 데이터 흐름
```
발주(Order) → 출하(Shipment) → 운송(Transport) → 납품확인(DeliveryConfirmation)
```

#### 2. 주요 컴포넌트

**관리자 페이지 (`/pages/admin/delivery/list.vue`)**
- 트리 구조로 발주별 납품 현황 표시
- 검색: 날짜, 납품요구번호, 상태
- 페이지네이션 지원
- 실시간 납품 진행률 표시

**트리 노드 컴포넌트**
1. `OrderTreeNode.vue` - 발주 레벨 (최상위)
   - 발주 기본 정보, 납품률, 진행 상태 표시
   - 출하 목록 확장/축소
2. `ShipmentTreeNode.vue` - 출하 레벨 (2단계)
   - 출하 정보, 품목 요약, 수량, 상태
   - 운송 정보 확장/축소
3. `TransportDetailNode.vue` - 운송/납품 레벨 (3단계)
   - 운송 정보: 차량번호, 기사, 배송지, 소장 정보
   - 납품확인 완료: PDF 다운로드, 사진 갤러리, GPS 정보
   - 납품확인 진행중: 안내 메시지 표시

**모바일 페이지 (`/pages/m/delivery/[token].vue`)**
- 토큰 기반 접근 (메시지 URL)
- 서명 캔버스 (터치 기반)
- 사진 촬영/업로드 (최대 5장)
- GPS 위치 정보 수집
- 납품 완료 처리

#### 3. 서비스 레이어 (`services/delivery.service.ts`)

**주요 메서드:**
```typescript
// 관리자용
createDelivery(transportId) // 납품 URL 생성 및 메시지 발송
getDeliveryTree(params) // 트리 구조 조회
getDeliveryList(params) // Flat 구조 조회
getDeliveryDetail(deliveryId) // 상세 조회

// 모바일용
getDeliveryByToken(token) // 토큰으로 납품 정보 조회
uploadSignature(token, blob) // 서명 이미지 업로드
uploadPhotos(token, files) // 사진 업로드 (최대 5장)
confirmDelivery(token, data) // 납품 완료 처리
```

**데이터 변환:**
- 서버 응답 (flat structure) → 프론트엔드 (nested structure)
- `transformDeliveryResponse()` 함수로 자동 변환

#### 4. 타입 정의 (`types/delivery.ts`)

**트리 구조 타입:**
```typescript
OrderTreeNode {
  orderId, deliveryRequestNo, client, projectName
  totalOrderQuantity, totalDeliveredQuantity
  deliveryRate, shipments[]
}

ShipmentTreeNode {
  shipmentId, shipmentDate, shipmentQuantity
  shipmentResponsible, status, itemSummary
  transport
}

TransportDetailNode {
  transportId, trackingNumber, vehicleNo
  driverName, driverPhone, deliveryAddress
  deliveryDate, siteSupervisorName
  status, deliveryConfirmation
}

DeliveryConfirmationNode {
  deliveryId, status, completedAt
  hasSignature, pdfFileUrl, signatureUrl
  photoCount, photoUrls[]
  latitude, longitude
}
```

### 주요 기능

#### 1. 메시지 전송 (관리자)
- 운송장별 모바일 납품확인 URL 생성
- 토큰 기반 보안 (만료 시간 설정)
- URL 클립보드 복사 기능
- 카카오톡/SMS로 기사에게 전달

#### 2. 모바일 납품 확인
**Flow:**
```
1. URL 접근 (토큰 검증)
2. 납품 정보 확인 (발주, 출하, 운송, 품목)
3. 서명 작성 (터치 캔버스)
4. 사진 촬영 (최대 5장)
5. GPS 위치 정보 수집
6. 납품 완료 처리
7. PDF 영수증 자동 생성
```

**기술 구현:**
- Canvas API로 터치 서명 구현 (`SignatureCanvas.vue`)
- File API로 사진 촬영/업로드
- Geolocation API로 GPS 좌표 수집
- FormData로 multipart/form-data 업로드

#### 3. PDF 다운로드 (관리자)
- 납품 완료 시 서버에서 PDF 영수증 자동 생성
- `SignatureViewer.vue`에서 PDF 다운로드 버튼 제공
- Fallback: `pdfFileUrl` null 시 `deliveryId`로 URL 생성
- 새 탭에서 PDF 열기 (`target="_blank"`)

#### 4. 사진 갤러리
- `PhotoGallery.vue` 컴포넌트로 사진 모달 표시
- 좌우 화살표로 사진 탐색
- 확대/축소 기능
- 닫기 버튼

#### 5. 상태 관리
**상태 코드:**
- `PENDING` - 대기
- `IN_PROGRESS` - 진행중
- `IN_TRANSIT` - 운송중
- `ARRIVED` - 도착
- `UNLOADING` - 하차중
- `COMPLETED` - 완료
- `CANCELLED` - 취소

**상태별 UI:**
- 각 상태별 색상 배지
- 진행중 상태: 안내 메시지 표시
- 완료 상태: PDF/사진 표시

### API 엔드포인트

**관리자용:**
```
POST   /api/deliveries                    # 납품 생성 (메시지 발송)
GET    /api/deliveries/tree                # 트리 구조 조회
GET    /api/deliveries                     # Flat 구조 조회
GET    /api/admin/deliveries/{id}/receipt-pdf  # PDF 다운로드
```

**모바일용:**
```
GET    /api/public/deliveries/{token}      # 납품 정보 조회
POST   /api/public/deliveries/{token}/signature  # 서명 업로드
POST   /api/public/deliveries/{token}/photos     # 사진 업로드
POST   /api/public/deliveries/{token}/confirm    # 납품 완료
```

### 스타일링

**CSS 파일:**
- `assets/css/mobile-delivery.css` - 모바일 납품 페이지 스타일
- `assets/css/admin-receipts.css` - 관리자 인쇄 스타일

**색상 스킴:**
- 발주(Order): 파란색 (`#eff6ff`, `#2563eb`)
- 출하(Shipment): 보라색 (`#f5f3ff`, `#7c3aed`)
- 운송(Transport): 노란색 (`#fef3c7`, `#fde047`)
- 납품확인 완료: 초록색 (`#f0fdf4`, `#16a34a`)
- 납품확인 진행중: 노란색 (`#fffbeb`, `#d97706`)

### 에러 처리

**공통 에러 처리:**
- 토큰 만료: 410 Gone
- 토큰 무효: 404 Not Found
- 인증 오류: 401 Unauthorized
- 권한 오류: 403 Forbidden
- 서버 오류: 500 Internal Server Error

**Null 안전성:**
- 모든 nullable 필드에 `|| '-'` fallback 적용
- 타입 정의에서 `string | null` 명시
- 조건부 렌더링 (`v-if`, `v-else`)

### 최근 수정 사항

**2025-01-04:**
1. ✅ IN_PROGRESS 상태 한글화 ("진행중")
2. ✅ 진행중 상태 안내 메시지 추가
3. ✅ itemSummary, shipmentDate nullable 처리
4. ✅ PDF 다운로드 버튼 시각성 개선 (빨간색 배경)
5. ✅ deliveryId fallback URL 생성 로직 추가
6. ✅ 사진 갤러리 닫기 버튼 추가

### 개발 시 주의사항

1. **Null 체크 필수**: 모든 서버 데이터는 null 가능성 고려
2. **타입 안정성**: `types/delivery.ts`와 실제 API 응답 일치 확인
3. **모바일 최적화**: 터치 이벤트, 작은 화면 고려
4. **PDF 생성**: 서버 측 PDF 생성 완료 후 pdfFileUrl 제공
5. **토큰 보안**: 만료 시간 체크, 재사용 방지
6. **이미지 최적화**: 사진 업로드 시 크기 제한 (5MB/장)