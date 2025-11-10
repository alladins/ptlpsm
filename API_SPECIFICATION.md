# API SPECIFICATION

**PTLPSM 프론트엔드 API 통합 명세서**

> 최종 업데이트: 2025-11-05
> 작성자: Claude Code
> 목적: 프론트엔드에서 사용하는 모든 API 엔드포인트 및 스펙 통합 문서

---

## 📋 목차

1. [환경 설정](#환경-설정)
2. [API 카테고리](#api-카테고리)
   - [사용자 관리 (User Management)](#1-사용자-관리-user-management)
   - [영업 관리 (Sales Management)](#2-영업-관리-sales-management)
   - [계약 관리 (Contract Management)](#3-계약-관리-contract-management)
   - [발주 관리 (Order Management)](#4-발주-관리-order-management)
   - [출하 관리 (Shipment Management)](#5-출하-관리-shipment-management)
   - [운송 관리 (Transport Management)](#6-운송-관리-transport-management)
   - [납품확인 관리 (Delivery Confirmation)](#7-납품확인-관리-delivery-confirmation)
   - [납품완료계 관리 (Delivery Done)](#8-납품완료계-관리-delivery-done)
   - [코드 관리 (Code Management)](#9-코드-관리-code-management)
   - [업체 관리 (Company Management)](#10-업체-관리-company-management)
   - [품목 관리 (Item Management)](#11-품목-관리-item-management)
   - [수요기관 관리 (Demand Organization)](#12-수요기관-관리-demand-organization)
   - [메뉴 관리 (Menu Management)](#13-메뉴-관리-menu-management)
   - [방문 통계 (Visit Tracking)](#14-방문-통계-visit-tracking)
   - [상담 문의 (Consultation)](#15-상담-문의-consultation)
3. [공통 타입 정의](#공통-타입-정의)
4. [상태 코드](#상태-코드)
5. [에러 처리](#에러-처리)
6. [인증 및 권한](#인증-및-권한)
7. [파일 업로드](#파일-업로드)
8. [개발 참고사항](#개발-참고사항)
9. [변경 이력](#변경-이력)

---

## 환경 설정

### API Base URL

**개발 환경:**
```
http://localhost:9031/api
```

**운영 환경:**
```
http://leadpower.platree.com/api
```

### 환경 감지 로직

```typescript
// services/api.ts
export function getApiBaseUrl(): string {
  // 1. window.location.hostname 체크 (non-localhost = 운영)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return PRODUCTION_API_BASE_URL
    }
  }

  // 2. localStorage 설정 체크
  if (typeof window !== 'undefined') {
    const storedEnv = localStorage.getItem('api_environment')
    if (storedEnv === 'production') return PRODUCTION_API_BASE_URL
    if (storedEnv === 'development') return DEVELOPMENT_API_BASE_URL
  }

  // 3. NODE_ENV fallback
  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_API_BASE_URL
  }

  return DEVELOPMENT_API_BASE_URL
}
```

### 환경 수동 전환

```javascript
// 브라우저 콘솔에서 실행
apiEnvironment.forceProduction()  // 운영 API 사용
apiEnvironment.forceDevelopment() // 개발 API 사용
```

---

## API 카테고리

### 1. 사용자 관리 (User Management)

**Base Path:** `/api/admin/users`
**권한:** 시스템관리자(SYSTEM_ADMIN) 전용
**파일:** `services/user.service.ts`, `services/api/endpoints/user.endpoints.ts`

#### 1.1 사용자 목록 조회

**Endpoint:** `GET /api/admin/users`

**권한:** SYSTEM_ADMIN

**Query Parameters:**
```typescript
{
  page?: number           // 페이지 번호 (0부터 시작)
  size?: number           // 페이지 크기 (기본값: 10)
  sort?: string           // 정렬 (예: 'createdAt,desc')
  keyword?: string        // 검색어 (이름, 이메일, 로그인ID)
  role?: string           // 역할 필터
  status?: 'ACTIVE' | 'INACTIVE'  // 상태 필터
  startDate?: string      // 검색 시작일 (YYYY-MM-DD)
  endDate?: string        // 검색 종료일 (YYYY-MM-DD)
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    content: User[]       // 사용자 배열
    totalElements: number // 전체 개수
    totalPages: number    // 전체 페이지 수
    size: number          // 페이지 크기
    number: number        // 현재 페이지 (0부터)
  }
  message?: string
}

interface User {
  id: number
  loginId: string
  name: string
  email: string
  phone?: string
  role: string          // USER_ROLE 코드
  status: string        // ACTIVE | INACTIVE
  createdAt: string     // ISO 8601
  updatedAt: string
  lastLoginAt?: string
}
```

**Mock Data:** 5명의 하드코딩된 사용자 (admin, sales1, shipping1, courier1, viewer1)

---

#### 1.2 사용자 검색

**Endpoint:** `GET /api/admin/users/search` 또는 `POST /api/admin/users/search`

**권한:** SYSTEM_ADMIN

**Query Parameters:**
```typescript
{
  keyword: string         // 필수: 검색어
  page?: number
  size?: number
  sort?: string
}
```

**Response:** 1.1과 동일

---

#### 1.3 사용자 상세 조회

**Endpoint:** `GET /api/admin/users/{id}`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `id`: 사용자 ID (number)

**Response:**
```typescript
{
  success: boolean
  data: User
  message?: string
}
```

---

#### 1.4 사용자 생성

**Endpoint:** `POST /api/admin/users`

**권한:** SYSTEM_ADMIN

**Request Body:**
```typescript
{
  loginId: string        // 필수: 로그인 ID (4-20자, 영문+숫자)
  password: string       // 필수: 비밀번호 (8자 이상)
  name: string           // 필수: 이름
  email: string          // 필수: 이메일
  phone?: string         // 전화번호
  role: string           // 필수: USER_ROLE 코드
  status?: string        // ACTIVE | INACTIVE (기본: ACTIVE)
}
```

**Response:**
```typescript
{
  success: boolean
  data: User
  message: string
}
```

---

#### 1.5 사용자 수정

**Endpoint:** `PUT /api/admin/users/{id}`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `id`: 사용자 ID

**Request Body:**
```typescript
{
  name?: string
  email?: string
  phone?: string
  role?: string
  status?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: User
  message: string
}
```

---

#### 1.6 사용자 삭제

**Endpoint:** `DELETE /api/admin/users/{id}`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `id`: 사용자 ID

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

---

#### 1.7 사용자 상태 토글

**Endpoint:** `PUT /api/admin/users/{id}/toggle-status`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `id`: 사용자 ID

**Response:**
```typescript
{
  success: boolean
  data: User
  message: string
}
```

---

#### 1.8 비밀번호 변경

**Endpoint:** `PUT /api/admin/users/{id}/change-password`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `id`: 사용자 ID

**Request Body:**
```typescript
{
  currentPassword?: string  // 본인 변경 시 필수
  newPassword: string       // 필수: 8자 이상
  confirmPassword: string   // 필수: newPassword와 일치
}
```

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

---

#### 1.9 현재 사용자 정보 조회

**Endpoint:** `GET /api/common/users/me`

**권한:** 인증된 모든 사용자

**Response:**
```typescript
{
  success: boolean
  data: User
}
```

---

#### 1.10 사용자 역할 목록 조회

**Endpoint:** `GET /api/codes/details/USER_ROLE`

**권한:** SYSTEM_ADMIN

**Response:**
```typescript
{
  success: boolean
  data: CodeDetail[]
}

interface CodeDetail {
  id: number
  code: string          // 예: SYSTEM_ADMIN
  codeName: string      // 예: 시스템관리자
  description?: string
  sortOrder: number
  isActive: boolean
}
```

---

#### 1.11 사용자 간단 검색

**Endpoint:** `GET /api/admin/users/search/simple`

**권한:** SYSTEM_ADMIN

**Query Parameters:**
```typescript
{
  keyword: string  // 필수: 검색어
  limit?: number   // 기본: 10
}
```

**Response:**
```typescript
{
  success: boolean
  data: User[]  // 최대 limit 개
}
```

**설명:** 자동완성, 팝업 선택용 간단 검색

---

### 2. 영업 관리 (Sales Management)

**Base Path:** `/api/admin/sales`
**권한:** 시스템관리자, 영업담당자, 리드파워담당자 (전체 권한) | 조회전용 사용자 (조회만)
**파일:** `services/sales.service.ts`, `services/api/endpoints/sales.endpoints.ts`

#### 2.1 영업 목록 조회

**Endpoint:** `GET /api/admin/sales`

**권한:** SYSTEM_ADMIN, SALES_MANAGER, LEADPOWER_MANAGER, VIEWER

**Query Parameters:**
```typescript
{
  page?: number
  size?: number
  sort?: string
  keyword?: string        // 검색어 (프로젝트명, 고객사명)
  status?: string         // SALES_STATUS 코드
  salesPerson?: string    // 영업담당자
  startDate?: string      // 등록일 시작
  endDate?: string        // 등록일 종료
  minAmount?: number      // 최소 금액
  maxAmount?: number      // 최대 금액
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    content: Sales[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }
}

interface Sales {
  id: number
  projectName: string        // 프로젝트명
  clientName: string         // 고객사명
  clientContact?: string     // 고객 연락처
  salesPerson: string        // 영업담당자
  estimatedAmount: number    // 예상 금액
  actualAmount?: number      // 실제 금액
  status: string             // SALES_STATUS 코드
  probability: number        // 성사 확률 (0-100)
  expectedDate?: string      // 예상 계약일
  actualDate?: string        // 실제 계약일
  description?: string       // 설명
  createdAt: string
  updatedAt: string
}
```

---

#### 2.2 영업 상세 조회

**Endpoint:** `GET /api/admin/sales/{id}`

**권한:** SYSTEM_ADMIN, SALES_MANAGER, LEADPOWER_MANAGER, VIEWER

**Path Parameters:**
- `id`: 영업 ID

**Response:**
```typescript
{
  success: boolean
  data: Sales
}
```

---

#### 2.3 영업 생성

**Endpoint:** `POST /api/admin/sales`

**권한:** SYSTEM_ADMIN, SALES_MANAGER, LEADPOWER_MANAGER

**Request Body:**
```typescript
{
  projectName: string        // 필수
  clientName: string         // 필수
  clientContact?: string
  salesPerson: string        // 필수
  estimatedAmount: number    // 필수
  status: string             // 필수: SALES_STATUS 코드
  probability: number        // 필수: 0-100
  expectedDate?: string      // YYYY-MM-DD
  description?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: Sales
  message: string
}
```

---

#### 2.4 영업 수정

**Endpoint:** `PUT /api/admin/sales/{id}`

**권한:** SYSTEM_ADMIN, SALES_MANAGER, LEADPOWER_MANAGER

**Path Parameters:**
- `id`: 영업 ID

**Request Body:** 2.3과 동일 (모든 필드 optional)

**Response:**
```typescript
{
  success: boolean
  data: Sales
  message: string
}
```

---

#### 2.5 영업 삭제

**Endpoint:** `DELETE /api/admin/sales/{id}`

**권한:** SYSTEM_ADMIN, SALES_MANAGER

**Path Parameters:**
- `id`: 영업 ID

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

---

#### 2.6 영업 상태 목록 조회

**Endpoint:** `GET /api/codes/details/SALES_STATUS`

**권한:** SYSTEM_ADMIN, SALES_MANAGER, LEADPOWER_MANAGER, VIEWER

**Response:**
```typescript
{
  success: boolean
  data: CodeDetail[]
}
```

**코드 예시:**
- `ON_HOLD` - 보류
- `COMPLETED` - 완료
- `IN_PROGRESS` - 진행중
- `CANCELLED` - 취소

---

### 2-1. 영업 관리 - 향후 구현 예정

**설명:** 다음 API들은 백엔드에 구현되지 않았습니다. 향후 필요 시 개발 예정입니다.

#### 2.6 영업 상태 변경 (미구현)

**Endpoint:** `PATCH /api/admin/sales/{id}/status`

**권한:** SYSTEM_ADMIN, SALES_MANAGER, LEADPOWER_MANAGER

**Path Parameters:**
- `id`: 영업 ID

**Request Body:**
```typescript
{
  status: string  // 필수: SALES_STATUS 코드
  reason?: string // 변경 사유
}
```

---

#### 2.7 영업 통계 조회 (미구현)

**Endpoint:** `GET /api/admin/sales/statistics`

**권한:** SYSTEM_ADMIN, SALES_MANAGER, LEADPOWER_MANAGER

**Query Parameters:**
```typescript
{
  startDate?: string  // YYYY-MM-DD
  endDate?: string
  groupBy?: 'status' | 'salesPerson' | 'month'
}
```

---

#### 2.8 영업 검색 (미구현)

**Endpoint:** `GET /api/admin/sales/search`

**권한:** SYSTEM_ADMIN, SALES_MANAGER, LEADPOWER_MANAGER, VIEWER

**Query Parameters:**
```typescript
{
  keyword: string  // 필수
  page?: number
  size?: number
}
```

---

#### 2.9 영업 엑셀 다운로드 (미구현)

**Endpoint:** `GET /api/admin/sales/export`

**권한:** SYSTEM_ADMIN, SALES_MANAGER, LEADPOWER_MANAGER

**설명:** Excel 파일 다운로드

---

#### 2.10 영업 대시보드 데이터 (미구현)

**Endpoint:** `GET /api/admin/sales/dashboard`

**권한:** SYSTEM_ADMIN, SALES_MANAGER, LEADPOWER_MANAGER

**설명:** 통계 대시보드용 데이터

---

#### 2.12 영업 이력 조회 (미구현)

**Endpoint:** `GET /api/admin/sales/{id}/history`

**권한:** SYSTEM_ADMIN, SALES_MANAGER, LEADPOWER_MANAGER

**Path Parameters:**
- `id`: 영업 ID

**Response:**
```typescript
{
  success: boolean
  data: SalesHistory[]
}

interface SalesHistory {
  id: number
  salesId: number
  action: string        // 'CREATED' | 'UPDATED' | 'STATUS_CHANGED' | 'DELETED'
  changedFields?: string[]
  oldValue?: any
  newValue?: any
  changedBy: string
  changedAt: string
  reason?: string
}
```

---

#### 2.13 영업 첨부파일 업로드 (미구현)

**Endpoint:** `POST /api/admin/sales/{id}/attachments`

**권한:** SYSTEM_ADMIN, SALES_MANAGER, LEADPOWER_MANAGER

**Path Parameters:**
- `id`: 영업 ID

**Request:** multipart/form-data
```typescript
{
  files: File[]  // 최대 10개
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    uploadedFiles: {
      fileName: string
      fileUrl: string
      fileSize: number
    }[]
  }
  message: string
}
```

---

#### 2.14 영업 첨부파일 목록 조회 (미구현)

**Endpoint:** `GET /api/admin/sales/{id}/attachments`

**권한:** SYSTEM_ADMIN, SALES_MANAGER, LEADPOWER_MANAGER, VIEWER

**Path Parameters:**
- `id`: 영업 ID

**Response:**
```typescript
{
  success: boolean
  data: {
    id: number
    fileName: string
    fileUrl: string
    fileSize: number
    uploadedBy: string
    uploadedAt: string
  }[]
}
```

---

### 3. 계약 관리 (Contract Management)

**Base Path:** `/api/contracts`
**권한:** 시스템관리자, 영업담당자, 리드파워담당자
**파일:** `services/contract.service.ts`, `services/api/endpoints/contract.endpoints.ts`

#### 3.1 계약 등록

**Endpoint:** `POST /api/contracts/register`

**권한:** SYSTEM_ADMIN, SALES_MANAGER, LEADPOWER_MANAGER

**Request Body:**
```typescript
{
  salesId?: number        // 연관 영업 ID
  contractNumber: string  // 필수: 계약번호
  contractDate: string    // 필수: 계약일 (YYYY-MM-DD)
  clientName: string      // 필수: 고객사명
  projectName: string     // 필수: 프로젝트명
  contractAmount: number  // 필수: 계약 금액
  startDate: string       // 필수: 계약 시작일
  endDate: string         // 필수: 계약 종료일
  description?: string    // 계약 내용
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    id: number
    contractNumber: string
    contractDate: string
    clientName: string
    projectName: string
    contractAmount: number
    startDate: string
    endDate: string
    status: string        // 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
    createdAt: string
  }
  message: string
}
```

---

#### 3.2 계약서 PDF 업로드

**Endpoint:** `POST /api/contracts/upload-pdf`

**권한:** SYSTEM_ADMIN, SALES_MANAGER, LEADPOWER_MANAGER

**Request:** multipart/form-data
```typescript
{
  contractId: number    // 계약 ID
  file: File            // PDF 파일 (최대 20MB)
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    contractId: number
    fileName: string
    fileSize: number
    processingTime: number        // ms
    extractedText: string         // OCR 결과
    extractedContractInfo: {      // AI 추출 정보
      contractNumber?: string
      contractDate?: string
      preNotificationNumber?: string
      deliveryRequestNumber?: string
      requestingAgency?: string
      requestingAgencyNumber?: string
      requestingAgencyPhoneNumber?: string
      requestingAgencyFaxNumber?: string
      requestingAgencyPostalCode?: string
      requestingAgencyAddress?: string
      requestingAgencyContactPerson?: string
      naraJangteoNumber?: string
      businessRegistrationNumberDemand?: string
      businessRegistrationNumberSupplier?: string
      paymentMethod?: string
      deliveryRequestDate?: string
      businessName?: string
      itemTotalAmount?: number
      commission?: number
      totalAmount?: number
      quantityTotal?: string
      preDiscountAmountTotal?: string
      partialDelivery?: string
      inspectionAgency?: string
      acceptanceAgency?: string
    }
    extractedDeliveryItems: {
      sequenceNumber: number
      optionItemNumber?: string
      itemClassificationNumber?: string
      itemIdentificationNumber?: string
      name: string
      specification: string
      unit: string
      unitPrice: number
      quantity: number
      totalAmount: number
      deliveryLocation: string
      deliveryDeadline: string
      deliveryTerms: string
      inspectionExemption: string
      midTermCompetitionItem: string
    }[]
  }
  message: string
}
```

---

### 4. 발주 관리 (Order Management)

**Base Path:** `/api/admin/orders`
**권한:** 시스템관리자 (전체), 리드파워담당자 (전체), OEM생산자 (본인 담당 건만 조회), 조회전용 (조회만)
**파일:** `services/order.service.ts`, `services/api/endpoints/order.endpoints.ts`

**NOTE:** 백엔드에서 `/delivery-requests`로 변경 예정 (납품요구서)

#### 4.1 발주 목록 조회

**Endpoint:** `GET /api/admin/orders`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER (본인 건만), VIEWER

**Query Parameters:**
```typescript
{
  page?: number
  size?: number
  sort?: string
  keyword?: string          // 검색어 (발주번호, 프로젝트명)
  status?: string           // COMMON_STATUS 코드
  startDate?: string        // 발주일 시작
  endDate?: string          // 발주일 종료
  supplierId?: number       // 공급업체 ID
  demandOrganizationId?: number  // 수요기관 ID
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    content: Order[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }
}

interface Order {
  id: number
  orderNumber: string          // 발주번호
  deliveryRequestNumber: string // 납품요구번호
  contractId?: number          // 계약 ID
  projectName: string          // 프로젝트명
  supplierId: number           // 공급업체 ID
  supplierName: string         // 공급업체명
  demandOrganizationId: number // 수요기관 ID
  demandOrganizationName: string
  orderDate: string            // 발주일
  requestedDeliveryDate: string // 납품 요청일
  deliveryLocation: string     // 납품 장소
  totalAmount: number          // 총 금액
  totalQuantity: number        // 총 수량
  status: string               // COMMON_STATUS 코드
  items: OrderItem[]           // 발주 품목들
  createdAt: string
  updatedAt: string
}

interface OrderItem {
  id: number
  orderId: number
  itemId: number
  itemName: string
  itemCode: string
  specification: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  deliveredQuantity: number    // 납품된 수량
  remainingQuantity: number    // 잔여 수량
}
```

---

#### 4.2 발주 상세 조회

**Endpoint:** `GET /api/admin/orders/{id}`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER (본인 건만), VIEWER

**Path Parameters:**
- `id`: 발주 ID

**Response:**
```typescript
{
  success: boolean
  data: Order
}
```

---

#### 4.3 발주 생성

**Endpoint:** `POST /api/admin/orders`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER

**Request Body:**
```typescript
{
  deliveryRequestNumber: string  // 필수: 납품요구번호
  contractId?: number
  projectName: string            // 필수
  supplierId: number             // 필수
  demandOrganizationId: number   // 필수
  orderDate: string              // 필수: YYYY-MM-DD
  requestedDeliveryDate: string  // 필수: YYYY-MM-DD
  deliveryLocation: string       // 필수
  items: {
    itemId: number
    quantity: number
    unitPrice: number
  }[]                            // 필수: 최소 1개
  description?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: Order
  message: string
}
```

---

#### 4.4 발주 수정

**Endpoint:** `PUT /api/admin/orders/{id}`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER

**Path Parameters:**
- `id`: 발주 ID

**Request Body:** 4.3과 동일 (모든 필드 optional)

**Response:**
```typescript
{
  success: boolean
  data: Order
  message: string
}
```

---

#### 4.5 발주 삭제

**Endpoint:** `DELETE /api/admin/orders/{id}`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `id`: 발주 ID

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

---

#### 4.6 발주 상태 변경

**Endpoint:** `PATCH /api/admin/orders/{id}/status`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER

**Path Parameters:**
- `id`: 발주 ID

**Request Body:**
```typescript
{
  status: string  // 필수: COMMON_STATUS 코드
  reason?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: Order
  message: string
}
```

---

#### 4.7 발주별 출하 내역 조회

**Endpoint:** `GET /api/admin/orders/{id}/shipments`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER (본인 건만), VIEWER

**Path Parameters:**
- `id`: 발주 ID

**Response:**
```typescript
{
  success: boolean
  data: Shipment[]  // 출하 목록
}
```

---

### 5. 출하 관리 (Shipment Management)

**Base Path:** `/api/admin/shipments`
**권한:** 시스템관리자, OEM생산자 (본인 담당 건만), 리드파워담당자 (조회), 조회전용 (조회만)
**파일:** `services/shipment.service.ts`, `services/api/endpoints/shipment.endpoints.ts`

#### 5.1 출하 목록 조회

**Endpoint:** `GET /api/admin/shipments`

**권한:** SYSTEM_ADMIN, OEM_PRODUCER (본인 건만), LEADPOWER_MANAGER, VIEWER

**Query Parameters:**
```typescript
{
  page?: number
  size?: number
  sort?: string
  keyword?: string        // 검색어 (출하번호, 발주번호)
  orderId?: number        // 발주 ID
  status?: string         // COMMON_STATUS 코드
  startDate?: string      // 출하일 시작
  endDate?: string        // 출하일 종료
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    content: Shipment[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }
}

interface Shipment {
  id: number
  shipmentNumber: string      // 출하번호
  orderId: number             // 발주 ID
  orderNumber: string         // 발주번호
  shipmentDate: string        // 출하일
  shipmentResponsible: string // 출하 담당자
  status: string              // COMMON_STATUS 코드
  items: ShipmentItem[]
  totalQuantity: number
  createdAt: string
  updatedAt: string
}

interface ShipmentItem {
  id: number
  shipmentId: number
  orderItemId: number
  itemId: number
  itemName: string
  quantity: number
  unit: string
}
```

---

#### 5.2 출하 상세 조회

**Endpoint:** `GET /api/admin/shipments/{id}`

**권한:** SYSTEM_ADMIN, OEM_PRODUCER (본인 건만), LEADPOWER_MANAGER, VIEWER

**Path Parameters:**
- `id`: 출하 ID

**Response:**
```typescript
{
  success: boolean
  data: Shipment
}
```

---

#### 5.3 출하 생성

**Endpoint:** `POST /api/admin/shipments`

**권한:** SYSTEM_ADMIN, OEM_PRODUCER

**Request Body:**
```typescript
{
  orderId: number            // 필수: 발주 ID
  shipmentDate: string       // 필수: YYYY-MM-DD
  shipmentResponsible: string // 필수: 출하 담당자
  items: {
    orderItemId: number
    quantity: number
  }[]                        // 필수: 최소 1개
  notes?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: Shipment
  message: string
}
```

---

#### 5.4 출하 수정

**Endpoint:** `PUT /api/admin/shipments/{id}`

**권한:** SYSTEM_ADMIN, OEM_PRODUCER (본인 건만)

**Path Parameters:**
- `id`: 출하 ID

**Request Body:** 5.3과 동일 (모든 필드 optional)

**Response:**
```typescript
{
  success: boolean
  data: Shipment
  message: string
}
```

---

#### 5.5 출하 삭제

**Endpoint:** `DELETE /api/admin/shipments/{id}`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `id`: 출하 ID

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

---

#### 5.6 출하 상태 변경

**Endpoint:** `PATCH /api/admin/shipments/{id}/status`

**권한:** SYSTEM_ADMIN, OEM_PRODUCER (본인 건만)

**Path Parameters:**
- `id`: 출하 ID

**Request Body:**
```typescript
{
  status: string  // 필수: COMMON_STATUS 코드
  reason?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: Shipment
  message: string
}
```

---

### 6. 운송 관리 (Transport Management)

**Base Path:** `/api/admin/transport`
**권한:** 시스템관리자 (전체), OEM생산자 (본인 담당 건만), 리드파워담당자 (특별한 경우만), 배송기사 (본인 건만 조회), 조회전용 (조회만)
**파일:** `services/transport.service.ts`, `services/api/endpoints/transport.endpoints.ts`

**NOTE:** 백엔드에서 `/waybills`로 변경 예정 (운송장)

#### 6.1 운송 목록 조회

**Endpoint:** `GET /api/admin/transport`

**권한:** SYSTEM_ADMIN, OEM_PRODUCER (본인 건만), LEADPOWER_MANAGER, DELIVERY_DRIVER (본인 건만), VIEWER

**Query Parameters:**
```typescript
{
  page?: number
  size?: number
  sort?: string
  keyword?: string        // 검색어 (운송장번호, 차량번호)
  shipmentId?: number     // 출하 ID
  status?: string         // COMMON_STATUS 코드
  driverId?: number       // 기사 ID
  startDate?: string      // 운송일 시작
  endDate?: string        // 운송일 종료
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    content: Transport[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }
}

interface Transport {
  id: number
  trackingNumber: string      // 운송장번호
  shipmentId: number          // 출하 ID
  shipmentNumber: string      // 출하번호
  vehicleNo: string           // 차량번호
  driverName: string          // 기사 이름
  driverPhone: string         // 기사 전화번호
  deliveryAddress: string     // 배송지 주소
  deliveryDate: string        // 배송 예정일
  actualDeliveryDate?: string // 실제 배송일
  siteSupervisorName?: string // 현장 소장 이름
  siteSupervisorPhone?: string // 현장 소장 전화번호
  status: string              // COMMON_STATUS 코드
  notes?: string
  createdAt: string
  updatedAt: string
}
```

---

#### 6.2 운송 상세 조회

**Endpoint:** `GET /api/admin/transport/{id}`

**권한:** SYSTEM_ADMIN, OEM_PRODUCER (본인 건만), LEADPOWER_MANAGER, DELIVERY_DRIVER (본인 건만), VIEWER

**Path Parameters:**
- `id`: 운송 ID

**Response:**
```typescript
{
  success: boolean
  data: Transport
}
```

---

#### 6.3 운송 생성

**Endpoint:** `POST /api/admin/transport`

**권한:** SYSTEM_ADMIN, OEM_PRODUCER

**Request Body:**
```typescript
{
  shipmentId: number          // 필수: 출하 ID
  vehicleNo: string           // 필수: 차량번호
  driverName: string          // 필수: 기사 이름
  driverPhone: string         // 필수: 기사 전화번호
  deliveryAddress: string     // 필수: 배송지 주소
  deliveryDate: string        // 필수: YYYY-MM-DD
  siteSupervisorName?: string
  siteSupervisorPhone?: string
  notes?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: Transport
  message: string
}
```

---

#### 6.4 운송 수정

**Endpoint:** `PUT /api/admin/transport/{id}`

**권한:** SYSTEM_ADMIN, OEM_PRODUCER (본인 건만)

**Path Parameters:**
- `id`: 운송 ID

**Request Body:** 6.3과 동일 (모든 필드 optional)

**Response:**
```typescript
{
  success: boolean
  data: Transport
  message: string
}
```

---

#### 6.5 운송 삭제

**Endpoint:** `DELETE /api/admin/transport/{id}`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `id`: 운송 ID

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

---

#### 6.6 운송 상태 변경

**Endpoint:** `PATCH /api/admin/transport/{id}/status`

**권한:** SYSTEM_ADMIN, OEM_PRODUCER (본인 건만), DELIVERY_DRIVER (본인 건만)

**Path Parameters:**
- `id`: 운송 ID

**Request Body:**
```typescript
{
  status: string  // 필수: COMMON_STATUS 코드
  reason?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: Transport
  message: string
}
```

---

### 7. 납품확인 관리 (Delivery Confirmation)

**Base Path:** `/api/deliveries` (관리자), `/api/public/deliveries` (모바일)
**권한:** 관리자 (전체), 모바일 (토큰 기반)
**파일:** `services/delivery.service.ts`, `services/api/endpoints/delivery.endpoints.ts`

#### 7.1 납품 생성 (메시지 발송)

**Endpoint:** `POST /api/deliveries`

**권한:** SYSTEM_ADMIN, OEM_PRODUCER

**Request Body:**
```typescript
{
  transportId: number  // 필수: 운송 ID
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    deliveryId: number
    token: string          // 모바일 접근 토큰
    mobileUrl: string      // 모바일 납품확인 URL
    expiresAt: string      // 토큰 만료 시간
  }
  message: string
}
```

**설명:** 운송장별로 모바일 납품확인 URL 생성 및 메시지 발송

---

#### 7.2 납품 트리 구조 조회

**Endpoint:** `GET /api/deliveries/tree`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER (본인 건만), VIEWER

**Query Parameters:**
```typescript
{
  page?: number
  size?: number
  startDate?: string      // 검색 시작일
  endDate?: string        // 검색 종료일
  keyword?: string        // 납품요구번호 검색
  status?: string         // 납품확인 상태
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    content: OrderTreeNode[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }
}

interface OrderTreeNode {
  orderId: number
  deliveryRequestNo: string   // 납품요구번호
  client: string              // 고객사
  projectName: string         // 프로젝트명
  totalOrderQuantity: number  // 총 발주 수량
  totalDeliveredQuantity: number // 총 납품 수량
  deliveryRate: number        // 납품률 (0-100)
  shipments: ShipmentTreeNode[]
}

interface ShipmentTreeNode {
  shipmentId: number
  shipmentDate: string
  shipmentQuantity: number
  shipmentResponsible: string
  status: string
  itemSummary: string         // 품목 요약 (예: "품목1 외 2건")
  transport: TransportDetailNode | null
}

interface TransportDetailNode {
  transportId: number
  trackingNumber: string
  vehicleNo: string
  driverName: string
  driverPhone: string
  deliveryAddress: string
  deliveryDate: string
  siteSupervisorName: string | null
  siteSupervisorPhone: string | null
  status: string
  deliveryConfirmation: DeliveryConfirmationNode | null
}

interface DeliveryConfirmationNode {
  deliveryId: number
  status: string              // PENDING | IN_PROGRESS | COMPLETED
  completedAt: string | null
  hasSignature: boolean
  pdfFileUrl: string | null
  signatureUrl: string | null
  photoCount: number
  photoUrls: string[]
  latitude: number | null
  longitude: number | null
}
```

---

#### 7.3 납품 목록 조회 (Flat)

**Endpoint:** `GET /api/deliveries`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER (본인 건만), VIEWER

**Query Parameters:**
```typescript
{
  page?: number
  size?: number
  sort?: string
  transportId?: number
  status?: string
  startDate?: string
  endDate?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    content: DeliveryConfirmation[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }
}

interface DeliveryConfirmation {
  id: number
  transportId: number
  trackingNumber: string
  token: string
  status: string
  completedAt: string | null
  signatureUrl: string | null
  pdfFileUrl: string | null
  photoUrls: string[]
  latitude: number | null
  longitude: number | null
  createdAt: string
  updatedAt: string
}
```

---

#### 7.4 납품 상세 조회 (관리자)

**Endpoint:** `GET /api/deliveries/{id}`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER (본인 건만)

**Path Parameters:**
- `id`: 납품 ID

**Response:**
```typescript
{
  success: boolean
  data: DeliveryConfirmation
}
```

---

#### 7.5 모바일 - 토큰으로 납품 정보 조회

**Endpoint:** `GET /api/public/deliveries/{token}`

**권한:** 공개 (토큰 보유자)

**Path Parameters:**
- `token`: 납품 토큰

**Response:**
```typescript
{
  success: boolean
  data: {
    delivery: {
      id: number
      status: string
      completedAt: string | null
    }
    transport: {
      trackingNumber: string
      vehicleNo: string
      driverName: string
      driverPhone: string
      deliveryAddress: string
      deliveryDate: string
      siteSupervisorName: string | null
      siteSupervisorPhone: string | null
    }
    shipment: {
      shipmentNumber: string
      shipmentDate: string
      shipmentQuantity: number
      items: {
        itemName: string
        specification: string
        quantity: number
        unit: string
      }[]
    }
    order: {
      orderNumber: string
      deliveryRequestNumber: string
      projectName: string
      client: string
    }
  }
}
```

**Error Responses:**
- `410 Gone` - 토큰 만료
- `404 Not Found` - 토큰 무효

---

#### 7.6 모바일 - 서명 업로드

**Endpoint:** `POST /api/public/deliveries/{token}/signature`

**권한:** 공개 (토큰 보유자)

**Path Parameters:**
- `token`: 납품 토큰

**Request:** multipart/form-data
```typescript
{
  signature: Blob  // Canvas에서 생성된 이미지 (PNG)
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    signatureUrl: string
  }
  message: string
}
```

---

#### 7.7 모바일 - 사진 업로드

**Endpoint:** `POST /api/public/deliveries/{token}/photos`

**권한:** 공개 (토큰 보유자)

**Path Parameters:**
- `token`: 납품 토큰

**Request:** multipart/form-data
```typescript
{
  photos: File[]  // 최대 5개, 각 5MB 이하
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    uploadedPhotos: {
      photoUrl: string
      photoIndex: number
    }[]
  }
  message: string
}
```

---

#### 7.8 모바일 - 납품 완료 처리

**Endpoint:** `POST /api/public/deliveries/{token}/confirm`

**권한:** 공개 (토큰 보유자)

**Path Parameters:**
- `token`: 납품 토큰

**Request Body:**
```typescript
{
  latitude: number   // 필수: GPS 위도
  longitude: number  // 필수: GPS 경도
  notes?: string     // 비고
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    deliveryId: number
    completedAt: string
    pdfFileUrl: string  // 생성된 PDF 영수증 URL
  }
  message: string
}
```

**설명:** 서명, 사진, GPS 정보를 종합하여 납품 완료 처리 및 PDF 영수증 생성

---

#### 7.9 관리자 - PDF 영수증 다운로드

**Endpoint:** `GET /api/admin/deliveries/{id}/receipt-pdf`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER (본인 건만)

**Path Parameters:**
- `id`: 납품 ID

**Response:** PDF 파일 (application/pdf)

---

### 8. 납품완료계 관리 (Delivery Done)

**Base Path:** `/api/admin/delivery-done`
**권한:** 시스템관리자, 리드파워담당자, OEM생산자
**파일:** `services/delivery-done.service.ts`, `services/api/endpoints/delivery-done.endpoints.ts`

#### 8.1 납품완료계 목록 조회

**Endpoint:** `GET /api/admin/delivery-done`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER

**Query Parameters:**
```typescript
{
  page?: number
  size?: number
  sort?: string
  keyword?: string        // 검색어 (프로젝트명, 발주번호)
  status?: string         // COMMON_STATUS 코드
  startDate?: string      // 완료일 시작
  endDate?: string        // 완료일 종료
  orderId?: number        // 발주 ID
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    content: DeliveryDone[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }
}

interface DeliveryDone {
  id: number
  orderId: number
  orderNumber: string
  projectName: string
  client: string
  totalDeliveredQuantity: number
  totalAmount: number
  status: string          // PENDING | IN_PROGRESS | PENDING_SIGNATURE | COMPLETED | SUBMITTED | CANCELLED
  submittedAt: string | null
  approvedAt: string | null
  pdfUrl: string | null
  createdAt: string
  updatedAt: string
}
```

---

#### 8.2 납품완료계 상세 조회

**Endpoint:** `GET /api/admin/delivery-done/{id}`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER

**Path Parameters:**
- `id`: 납품완료계 ID

**Response:**
```typescript
{
  success: boolean
  data: {
    deliveryDone: DeliveryDone
    items: {
      itemName: string
      specification: string
      unit: string
      orderedQuantity: number
      deliveredQuantity: number
      remainingQuantity: number
    }[]
    deliveryConfirmations: {
      deliveryId: number
      completedAt: string
      quantity: number
      pdfUrl: string
    }[]
  }
}
```

---

#### 8.3 납품완료계 생성

**Endpoint:** `POST /api/admin/delivery-done`

**권한:** SYSTEM_ADMIN, OEM_PRODUCER

**Request Body:**
```typescript
{
  orderId: number  // 필수: 발주 ID
  notes?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: DeliveryDone
  message: string
}
```

**설명:** 발주별 모든 납품확인을 집계하여 납품완료계 생성

---

#### 8.4 납품완료계 PDF 생성

**Endpoint:** `POST /api/admin/delivery-done/{id}/generate-pdf`

**권한:** SYSTEM_ADMIN, OEM_PRODUCER

**Path Parameters:**
- `id`: 납품완료계 ID

**Response:**
```typescript
{
  success: boolean
  data: {
    pdfUrl: string
  }
  message: string
}
```

---

#### 8.5 납품완료계 제출

**Endpoint:** `POST /api/admin/delivery-done/{id}/submit`

**권한:** SYSTEM_ADMIN, OEM_PRODUCER

**Path Parameters:**
- `id`: 납품완료계 ID

**Request Body:**
```typescript
{
  submitterName: string   // 필수: 제출자 이름
  submitterEmail: string  // 필수: 제출자 이메일
  notes?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: DeliveryDone
  message: string
}
```

---

#### 8.6 납품완료계 승인

**Endpoint:** `POST /api/admin/delivery-done/{id}/approve`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER

**Path Parameters:**
- `id`: 납품완료계 ID

**Request Body:**
```typescript
{
  approverName: string   // 필수: 승인자 이름
  approverEmail: string  // 필수: 승인자 이메일
  notes?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: DeliveryDone
  message: string
}
```

---

#### 8.7 납품완료계 반려

**Endpoint:** `POST /api/admin/delivery-done/{id}/reject`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER

**Path Parameters:**
- `id`: 납품완료계 ID

**Request Body:**
```typescript
{
  rejectReason: string  // 필수: 반려 사유
}
```

**Response:**
```typescript
{
  success: boolean
  data: DeliveryDone
  message: string
}
```

---

#### 8.8 납품완료계 취소

**Endpoint:** `DELETE /api/admin/delivery-done/{id}`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `id`: 납품완료계 ID

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

---

#### 8.9 납품완료계 PDF 다운로드

**Endpoint:** `GET /api/admin/delivery-done/{id}/pdf`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER

**Path Parameters:**
- `id`: 납품완료계 ID

**Response:** PDF 파일 (application/pdf)

---

### 9. 코드 관리 (Code Management)

**Base Path:** `/api/codes`
**권한:** 코드 조회 (전체 사용자), 코드 관리 (시스템관리자만)
**파일:** `services/code.service.ts`, `services/api/endpoints/code.endpoints.ts`

**TODO:** 향후 `/common/codes` (조회용)와 `/admin/codes` (관리용)로 분리 검토

#### 9.1 코드 그룹 목록 조회

**Endpoint:** `GET /api/codes/groups`

**권한:** 모든 인증된 사용자

**Query Parameters:**
```typescript
{
  page?: number
  size?: number
  sort?: string
  keyword?: string  // 그룹 코드 또는 그룹명 검색
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    content: CodeGroup[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }
}

interface CodeGroup {
  id: number
  groupCode: string       // 예: COMMON_STATUS, SALES_STATUS
  groupName: string       // 예: 공통 상태, 영업 상태
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}
```

---

#### 9.2 코드 그룹 상세 조회

**Endpoint:** `GET /api/codes/groups/{groupCode}`

**권한:** 모든 인증된 사용자

**Path Parameters:**
- `groupCode`: 그룹 코드 (예: COMMON_STATUS)

**Response:**
```typescript
{
  success: boolean
  data: CodeGroup
}
```

---

#### 9.3 코드 상세 목록 조회

**Endpoint:** `GET /api/codes/details/{groupCode}`

**권한:** 모든 인증된 사용자

**Path Parameters:**
- `groupCode`: 그룹 코드

**Query Parameters:**
```typescript
{
  includeInactive?: boolean  // 비활성 코드 포함 (기본: false)
}
```

**Response:**
```typescript
{
  success: boolean
  data: CodeDetail[]
}

interface CodeDetail {
  id: number
  groupCode: string
  code: string            // 예: PENDING, IN_PROGRESS
  codeName: string        // 예: 대기, 진행중
  description?: string
  cssClass?: string       // CSS 클래스명
  badgeClass?: string     // 뱃지 클래스명
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

**사용 예시:**
- `GET /api/codes/details/COMMON_STATUS` - 공통 상태 코드
- `GET /api/codes/details/SALES_STATUS` - 영업 상태 코드
- `GET /api/codes/details/USER_ROLE` - 사용자 역할 코드

---

#### 9.4 코드 그룹 생성

**Endpoint:** `POST /api/codes/groups`

**권한:** SYSTEM_ADMIN

**Request Body:**
```typescript
{
  groupCode: string       // 필수: 대문자+언더스코어
  groupName: string       // 필수
  description?: string
  sortOrder?: number      // 기본: 0
}
```

**Response:**
```typescript
{
  success: boolean
  data: CodeGroup
  message: string
}
```

---

#### 9.5 코드 그룹 수정

**Endpoint:** `PUT /api/codes/groups/{groupCode}`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `groupCode`: 그룹 코드

**Request Body:**
```typescript
{
  groupName?: string
  description?: string
  sortOrder?: number
  isActive?: boolean
}
```

**Response:**
```typescript
{
  success: boolean
  data: CodeGroup
  message: string
}
```

---

#### 9.6 코드 상세 생성

**Endpoint:** `POST /api/codes/details`

**권한:** SYSTEM_ADMIN

**Request Body:**
```typescript
{
  groupCode: string       // 필수: 존재하는 그룹 코드
  code: string            // 필수: 대문자+언더스코어
  codeName: string        // 필수
  description?: string
  cssClass?: string
  badgeClass?: string
  sortOrder?: number      // 기본: 0
}
```

**Response:**
```typescript
{
  success: boolean
  data: CodeDetail
  message: string
}
```

---

#### 9.7 코드 상세 수정

**Endpoint:** `PUT /api/codes/details/{groupCode}/{code}`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `groupCode`: 그룹 코드
- `code`: 코드 값

**Request Body:**
```typescript
{
  codeName?: string
  description?: string
  cssClass?: string
  badgeClass?: string
  sortOrder?: number
  isActive?: boolean
}
```

**Response:**
```typescript
{
  success: boolean
  data: CodeDetail
  message: string
}
```

---

#### 9.8 코드 상세 삭제

**Endpoint:** `DELETE /api/codes/details/{groupCode}/{code}`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `groupCode`: 그룹 코드
- `code`: 코드 값

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

---

#### 9.9 코드 그룹 삭제

**Endpoint:** `DELETE /api/codes/groups/{groupCode}`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `groupCode`: 그룹 코드

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

---

#### 9.10 코드 그룹 페이징 조회

**Endpoint:** `GET /api/codes/groups/paging`

**권한:** SYSTEM_ADMIN

**Query Parameters:**
```typescript
{
  page?: number
  size?: number
  sort?: string
  keyword?: string  // 그룹 코드 또는 그룹명 검색
}
```

**Response:**
```typescript
{
  success: boolean
  data: PageResponse<CodeGroup>
}
```

---

#### 9.11 코드 상세 페이징 조회

**Endpoint:** `GET /api/codes/details/paging`

**권한:** SYSTEM_ADMIN

**Query Parameters:**
```typescript
{
  page?: number
  size?: number
  sort?: string
  groupCode?: string  // 그룹 코드 필터
}
```

**Response:**
```typescript
{
  success: boolean
  data: PageResponse<CodeDetail>
}
```

---

#### 9.12 사용 가능한 코드 조회

**Endpoint:** `GET /api/codes/active/{groupCode}`

**권한:** 모든 인증된 사용자

**Path Parameters:**
- `groupCode`: 그룹 코드

**Response:**
```typescript
{
  success: boolean
  data: CodeDetail[]  // isActive=true만
}
```

**설명:** 사용 가능한 코드만 조회 (isActive=true)

---

#### 9.13 사용 가능한 하위 코드 조회

**Endpoint:** `GET /api/codes/active/{groupCode}/{parentCode}`

**권한:** 모든 인증된 사용자

**Path Parameters:**
- `groupCode`: 그룹 코드
- `parentCode`: 상위 코드

**Response:**
```typescript
{
  success: boolean
  data: CodeDetail[]  // isActive=true, parentCode 일치만
}
```

**설명:** 사용 가능한 하위 코드만 조회 (계층형 코드 구조용)

---

### 9-1. 공통 코드 조회 (Common Code - Public)

**Base Path:** `/api/common/codes`
**권한:** 공개 (인증 불필요)
**파일:** `CommonCodeController.java` (백엔드)
**설명:** 인증 없이 접근 가능한 공통 코드 조회 API

#### 9-1.1 공통 코드 그룹 목록 조회

**Endpoint:** `GET /api/common/codes/groups`

**권한:** 공개

**Response:**
```typescript
{
  success: boolean
  data: CodeGroup[]
}
```

**설명:** 모든 코드 그룹 목록 조회 (인증 불필요)

---

#### 9-1.2 공통 코드 상세 목록 조회

**Endpoint:** `GET /api/common/codes/groups/{groupCode}/details`

**권한:** 공개

**Path Parameters:**
- `groupCode`: 그룹 코드

**Response:**
```typescript
{
  success: boolean
  data: CodeDetail[]
}
```

**설명:** 특정 그룹의 코드 상세 목록 조회 (인증 불필요)

---

#### 9-1.3 공통 코드 상세 단건 조회

**Endpoint:** `GET /api/common/codes/groups/{groupCode}/details/{detailCode}`

**권한:** 공개

**Path Parameters:**
- `groupCode`: 그룹 코드
- `detailCode`: 상세 코드

**Response:**
```typescript
{
  success: boolean
  data: CodeDetail
}
```

**설명:** 특정 코드 상세 단건 조회 (인증 불필요)

---

### 10. 업체 관리 (Company Management)

**Base Path:** `/api/admin/companies`
**권한:** 시스템관리자 (전체), 리드파워담당자 (조회), OEM생산자 (본인 업체만 조회)
**파일:** `services/company.service.ts`, `services/api/endpoints/company.endpoints.ts`

#### 10.1 업체 목록 조회

**Endpoint:** `GET /api/admin/companies`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER (본인 업체만)

**Query Parameters:**
```typescript
{
  page?: number
  size?: number
  sort?: string
  keyword?: string        // 검색어 (업체명, 사업자번호)
  type?: string           // 업체 유형 (COMPANY_TYPE 코드)
  status?: string         // 상태 (ACTIVE | INACTIVE)
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    content: Company[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }
}

interface Company {
  id: number
  companyName: string         // 업체명
  businessNumber: string      // 사업자등록번호
  representativeName: string  // 대표자명
  businessType?: string       // 업태
  businessItem?: string       // 종목
  address: string             // 주소
  postalCode?: string         // 우편번호
  phone: string               // 전화번호
  fax?: string                // 팩스번호
  email?: string              // 이메일
  companyType: string         // 업체 유형 (COMPANY_TYPE 코드)
  status: string              // ACTIVE | INACTIVE
  notes?: string
  createdAt: string
  updatedAt: string
}
```

---

#### 10.2 업체 상세 조회

**Endpoint:** `GET /api/admin/companies/{id}`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER (본인 업체만)

**Path Parameters:**
- `id`: 업체 ID

**Response:**
```typescript
{
  success: boolean
  data: Company
}
```

---

#### 10.3 업체 생성

**Endpoint:** `POST /api/admin/companies`

**권한:** SYSTEM_ADMIN

**Request Body:**
```typescript
{
  companyName: string         // 필수
  businessNumber: string      // 필수: 000-00-00000 형식
  representativeName: string  // 필수
  businessType?: string
  businessItem?: string
  address: string             // 필수
  postalCode?: string
  phone: string               // 필수
  fax?: string
  email?: string
  companyType: string         // 필수: COMPANY_TYPE 코드
  notes?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: Company
  message: string
}
```

---

#### 10.4 업체 수정

**Endpoint:** `PUT /api/admin/companies/{id}`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `id`: 업체 ID

**Request Body:** 10.3과 동일 (모든 필드 optional)

**Response:**
```typescript
{
  success: boolean
  data: Company
  message: string
}
```

---

### 11. 품목 관리 (Item Management)

**Base Path:** `/api/admin/items`
**권한:** 시스템관리자 (전체), 리드파워담당자 (전체), OEM생산자 (조회), 영업담당자 (조회)
**파일:** `services/item.service.ts`, `services/api/endpoints/item.endpoints.ts`

#### 11.1 품목 목록 조회

**Endpoint:** `GET /api/admin/items`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER, SALES_MANAGER

**Query Parameters:**
```typescript
{
  page?: number
  size?: number
  sort?: string
  keyword?: string        // 검색어 (품목명, 품목코드)
  category?: string       // 품목 카테고리
  status?: string         // 상태 (ACTIVE | INACTIVE)
  minPrice?: number       // 최소 단가
  maxPrice?: number       // 최대 단가
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    content: Item[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }
}

interface Item {
  id: number
  itemCode: string          // 품목 코드
  itemName: string          // 품목명
  specification: string     // 규격
  unit: string              // 단위 (m², 개, kg 등)
  unitPrice: number         // 단가
  category?: string         // 카테고리
  manufacturer?: string     // 제조사
  model?: string            // 모델명
  description?: string      // 설명
  status: string            // ACTIVE | INACTIVE
  notes?: string
  createdAt: string
  updatedAt: string
}
```

---

#### 11.2 품목 상세 조회

**Endpoint:** `GET /api/admin/items/{id}`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER, SALES_MANAGER

**Path Parameters:**
- `id`: 품목 ID

**Response:**
```typescript
{
  success: boolean
  data: Item
}
```

---

#### 11.3 품목 생성

**Endpoint:** `POST /api/admin/items`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER

**Request Body:**
```typescript
{
  itemCode: string          // 필수: 품목 코드 (중복 불가)
  itemName: string          // 필수
  specification: string     // 필수
  unit: string              // 필수
  unitPrice: number         // 필수
  category?: string
  manufacturer?: string
  model?: string
  description?: string
  notes?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: Item
  message: string
}
```

---

#### 11.4 품목 수정

**Endpoint:** `PUT /api/admin/items/{id}`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER

**Path Parameters:**
- `id`: 품목 ID

**Request Body:** 11.3과 동일 (모든 필드 optional)

**Response:**
```typescript
{
  success: boolean
  data: Item
  message: string
}
```

---

#### 11.5 품목 삭제

**Endpoint:** `DELETE /api/admin/items/{id}`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `id`: 품목 ID

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

---

#### 11.6 품목 상태 토글

**Endpoint:** `PATCH /api/admin/items/{id}/toggle-status`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER

**Path Parameters:**
- `id`: 품목 ID

**Response:**
```typescript
{
  success: boolean
  data: Item
  message: string
}
```

---

#### 11.7 품목 대량 등록

**Endpoint:** `POST /api/admin/items/bulk`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER

**Request:** multipart/form-data
```typescript
{
  file: File  // Excel 파일 (xlsx, xls)
}
```

**Excel 형식:**
```
| 품목코드 | 품목명 | 규격 | 단위 | 단가 | 카테고리 | 제조사 | 모델명 | 설명 |
```

**Response:**
```typescript
{
  success: boolean
  data: {
    totalRows: number
    successCount: number
    failCount: number
    errors: {
      row: number
      message: string
    }[]
  }
  message: string
}
```

---

#### 11.8 품목 엑셀 다운로드

**Endpoint:** `GET /api/admin/items/export`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER

**Query Parameters:** 11.1과 동일 (필터링 조건)

**Response:** Excel 파일 (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

---

#### 11.9 품목 검색 (간단)

**Endpoint:** `GET /api/admin/items/search`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER, SALES_MANAGER

**Query Parameters:**
```typescript
{
  keyword: string  // 필수
  limit?: number   // 기본: 10
}
```

**Response:**
```typescript
{
  success: boolean
  data: Item[]  // 최대 limit 개
}
```

**설명:** 자동완성, 팝업 선택용 간단 검색

---

#### 11.10 품목 카테고리 목록

**Endpoint:** `GET /api/codes/details/ITEM_CATEGORY`

**권한:** 모든 인증된 사용자

**Response:**
```typescript
{
  success: boolean
  data: CodeDetail[]
}
```

---

#### 11.11 품목 단가 이력 조회

**Endpoint:** `GET /api/admin/items/{id}/price-history`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER

**Path Parameters:**
- `id`: 품목 ID

**Query Parameters:**
```typescript
{
  startDate?: string
  endDate?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    itemId: number
    currentPrice: number
    history: {
      id: number
      oldPrice: number
      newPrice: number
      changedBy: string
      changedAt: string
      reason?: string
    }[]
  }
}
```

---

#### 11.12 품목 재고 조회

**Endpoint:** `GET /api/admin/items/{id}/inventory`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_PRODUCER

**Path Parameters:**
- `id`: 품목 ID

**Response:**
```typescript
{
  success: boolean
  data: {
    itemId: number
    itemName: string
    currentStock: number
    unit: string
    lastUpdated: string
  }
}
```

---

### 12. 수요기관 관리 (Demand Organization)

**Base Path:** `/api/admin/demand-organizations`
**권한:** 시스템관리자 (전체), 리드파워담당자 (전체), 영업담당자 (조회)
**파일:** `services/demand-organization.service.ts`, `services/api/endpoints/demand-organization.endpoints.ts`

#### 12.1 수요기관 목록 조회

**Endpoint:** `GET /api/admin/demand-organizations`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, SALES_MANAGER

**Query Parameters:**
```typescript
{
  page?: number
  size?: number
  sort?: string
  keyword?: string        // 검색어 (기관명, 코드)
  type?: string           // 기관 유형
  region?: string         // 지역
  status?: string         // ACTIVE | INACTIVE
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    content: DemandOrganization[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }
}

interface DemandOrganization {
  id: number
  organizationCode: string   // 기관 코드
  organizationName: string   // 기관명
  type: string               // 기관 유형
  region: string             // 지역
  address: string            // 주소
  postalCode?: string        // 우편번호
  phone: string              // 전화번호
  fax?: string               // 팩스번호
  email?: string             // 이메일
  contactPerson?: string     // 담당자
  contactPhone?: string      // 담당자 전화번호
  status: string             // ACTIVE | INACTIVE
  notes?: string
  createdAt: string
  updatedAt: string
}
```

---

#### 12.2 수요기관 상세 조회

**Endpoint:** `GET /api/admin/demand-organizations/{id}`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, SALES_MANAGER

**Path Parameters:**
- `id`: 수요기관 ID

**Response:**
```typescript
{
  success: boolean
  data: DemandOrganization
}
```

---

#### 12.3 수요기관 생성

**Endpoint:** `POST /api/admin/demand-organizations`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER

**Request Body:**
```typescript
{
  organizationCode: string   // 필수: 기관 코드 (중복 불가)
  organizationName: string   // 필수
  type: string               // 필수
  region: string             // 필수
  address: string            // 필수
  postalCode?: string
  phone: string              // 필수
  fax?: string
  email?: string
  contactPerson?: string
  contactPhone?: string
  notes?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: DemandOrganization
  message: string
}
```

---

#### 12.4 수요기관 수정

**Endpoint:** `PUT /api/admin/demand-organizations/{id}`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER

**Path Parameters:**
- `id`: 수요기관 ID

**Request Body:** 12.3과 동일 (모든 필드 optional)

**Response:**
```typescript
{
  success: boolean
  data: DemandOrganization
  message: string
}
```

---

#### 12.5 수요기관 삭제

**Endpoint:** `DELETE /api/admin/demand-organizations/{id}`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `id`: 수요기관 ID

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

---

#### 12.6 수요기관 검색 (간단)

**Endpoint:** `GET /api/admin/demand-organizations/search`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER, SALES_MANAGER

**Query Parameters:**
```typescript
{
  keyword: string  // 필수
  limit?: number   // 기본: 10
}
```

**Response:**
```typescript
{
  success: boolean
  data: DemandOrganization[]
}
```

---

#### 12.7 수요기관 유형 목록

**Endpoint:** `GET /api/codes/details/ORGANIZATION_TYPE`

**권한:** 모든 인증된 사용자

**Response:**
```typescript
{
  success: boolean
  data: CodeDetail[]
}
```

---

#### 12.8 수요기관별 발주 이력

**Endpoint:** `GET /api/admin/demand-organizations/{id}/orders`

**권한:** SYSTEM_ADMIN, LEADPOWER_MANAGER

**Path Parameters:**
- `id`: 수요기관 ID

**Query Parameters:**
```typescript
{
  page?: number
  size?: number
  startDate?: string
  endDate?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    content: Order[]
    totalElements: number
    totalPages: number
  }
}
```

---

### 13. 메뉴 관리 (Menu Management)

**Base Path:** `/api/menus`
**권한:** 모든 인증된 사용자 (조회), 시스템관리자 (관리)
**파일:** `services/menu.service.ts`

#### 13.1 메뉴 트리 조회

**Endpoint:** `GET /api/menus/tree`

**권한:** 모든 인증된 사용자

**Response:**
```typescript
{
  success: boolean
  data: Menu[]
}

interface Menu {
  id: number
  menuCode: string        // 메뉴 코드
  menuName: string        // 메뉴명
  path?: string           // 경로 (URL)
  icon?: string           // 아이콘
  sortOrder: number       // 정렬 순서
  parentId?: number       // 부모 메뉴 ID
  level: number           // 깊이 (1, 2, 3)
  isVisible: boolean      // 표시 여부
  requiredRole: string    // 필요 권한
  children?: Menu[]       // 하위 메뉴
}
```

---

#### 13.2 사용자별 메뉴 조회

**Endpoint:** `GET /api/menus/my-menus`

**권한:** 모든 인증된 사용자

**Response:**
```typescript
{
  success: boolean
  data: Menu[]  // 현재 사용자 권한에 맞는 메뉴만
}
```

---

### 14. 방문 통계 (Visit Tracking)

**Base Path:** `/api/visits`
**권한:** 시스템관리자 (조회)
**파일:** `services/visit.service.ts`

**NOTE:** 현재는 localStorage 기반, 추후 서버 저장 예정

#### 14.1 방문 기록 등록

**Endpoint:** `POST /api/visits`

**권한:** 공개 (자동 호출)

**Request Body:**
```typescript
{
  path: string            // 페이지 경로
  pageTitle?: string      // 페이지 제목
  referrer?: string       // 이전 페이지
  userAgent: string       // 브라우저 정보
}
```

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

---

#### 14.2 방문 통계 조회

**Endpoint:** `GET /api/visits/statistics`

**권한:** SYSTEM_ADMIN

**Query Parameters:**
```typescript
{
  startDate?: string
  endDate?: string
  groupBy?: 'page' | 'day' | 'hour'
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    totalVisits: number
    uniqueVisitors: number
    topPages: {
      path: string
      count: number
    }[]
    byDate?: {
      date: string
      count: number
    }[]
  }
}
```

---

### 15. 상담 문의 (Consultation)

**Base Path:** `/api/consultations`
**권한:** 공개 (생성), 시스템관리자 (조회/관리)
**파일:** `services/consultation.service.ts`

#### 15.1 상담 문의 등록

**Endpoint:** `POST /api/consultations`

**권한:** 공개

**Request Body:**
```typescript
{
  name: string            // 필수: 이름
  phone: string           // 필수: 전화번호
  email?: string          // 이메일
  subject: string         // 필수: 제목
  message: string         // 필수: 문의 내용
  privacyAgreed: boolean  // 필수: 개인정보 동의
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    id: number
    name: string
    phone: string
    email?: string
    subject: string
    message: string
    status: string        // NEW | IN_PROGRESS | COMPLETED | CANCELLED
    createdAt: string
  }
  message: string
}
```

---

#### 15.2 상담 문의 목록 조회

**Endpoint:** `GET /api/consultations`

**권한:** SYSTEM_ADMIN

**Query Parameters:**
```typescript
{
  page?: number
  size?: number
  sort?: string
  keyword?: string        // 이름, 전화번호, 제목 검색
  status?: string         // 상태 필터
  startDate?: string
  endDate?: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    content: Consultation[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }
}

interface Consultation {
  id: number
  name: string
  phone: string
  email?: string
  subject: string
  message: string
  status: string
  responseMessage?: string
  respondedBy?: string
  respondedAt?: string
  createdAt: string
}
```

---

#### 15.3 상담 문의 상세 조회

**Endpoint:** `GET /api/consultations/{id}`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `id`: 상담 ID

**Response:**
```typescript
{
  success: boolean
  data: Consultation
}
```

---

#### 15.4 상담 답변 등록

**Endpoint:** `POST /api/consultations/{id}/response`

**권한:** SYSTEM_ADMIN

**Path Parameters:**
- `id`: 상담 ID

**Request Body:**
```typescript
{
  responseMessage: string  // 필수: 답변 내용
}
```

**Response:**
```typescript
{
  success: boolean
  data: Consultation
  message: string
}
```

---

## 공통 타입 정의

### Pagination (페이지네이션)

```typescript
interface PaginationParams {
  page?: number           // 페이지 번호 (0부터 시작, 기본: 0)
  size?: number           // 페이지 크기 (기본: 10)
  sort?: string           // 정렬 (예: 'createdAt,desc')
}

interface PageResponse<T> {
  content: T[]            // 데이터 배열
  totalElements: number   // 전체 개수
  totalPages: number      // 전체 페이지 수
  size: number            // 페이지 크기
  number: number          // 현재 페이지 (0부터)
  first: boolean          // 첫 페이지 여부
  last: boolean           // 마지막 페이지 여부
  empty: boolean          // 데이터 없음 여부
}
```

---

### API Response Wrapper

```typescript
interface ApiResponse<T> {
  success: boolean        // 성공 여부
  data?: T                // 응답 데이터
  message?: string        // 메시지 (성공/실패)
  error?: {
    code: string          // 에러 코드
    message: string       // 에러 메시지
    field?: string        // 에러 필드 (검증 오류 시)
  }
}
```

---

### Status Option

```typescript
interface StatusOption {
  value: string           // 코드 값
  label: string           // 표시 이름
}
```

---

### Status Code

```typescript
interface StatusCode {
  code: string            // 코드 값
  codeName: string        // 표시 이름
  description?: string    // 설명
  cssClass?: string       // CSS 클래스
  badgeClass?: string     // 뱃지 클래스
  sortOrder: number       // 정렬 순서
}
```

---

## 상태 코드

### COMMON_STATUS (공통 상태)

**출처:** `sql/insert_status_codes.sql`, `sql/add_status_codes.sql` (2025-01-04 작성)

**사용 모듈:** 발주, 출하, 운송, 납품확인, 납품완료계 (영업 제외 - SALES_STATUS 사용)

| 코드 | 이름 | 설명 | CSS 클래스 |
|------|------|------|------------|
| PENDING | 대기 | 처리 대기 중 | status-pending |
| IN_PROGRESS | 진행중 | 배송 진행 중 | status-in-progress |
| PENDING_SIGNATURE | 서명 대기중 | 서명 대기중 상태 | status-pending-signature |
| COMPLETED | 완료 | 처리 완료 | status-completed |
| CANCELLED | 취소 | 처리 취소 | status-cancelled |

---

### SALES_STATUS (영업 상태)

**출처:** `sql/create_sales_status_codes.sql` (2025-01-05 작성)

**사용 모듈:** 영업 관리 전용

| 코드 | 이름 | 설명 | CSS 클래스 | Badge 클래스 |
|------|------|------|------------|-------------|
| ON_HOLD | 보류 | 영업이 보류된 상태 | status-pending | bg-yellow-100 text-yellow-800 |
| COMPLETED | 완료 | 영업이 완료된 상태 | status-completed | bg-green-100 text-green-800 |
| IN_PROGRESS | 진행중 | 영업이 진행 중인 상태 | status-in-progress | bg-blue-100 text-blue-800 |
| CANCELLED | 취소 | 영업이 취소된 상태 | status-cancelled | bg-red-100 text-red-800 |

**참고:** DB 수정 시 코드를 영문으로 변경 필요 (한글 → 영문 코드)

---

### USER_ROLE (사용자 역할)

| 코드 | 이름 | 설명 | 권한 레벨 |
|------|------|------|-----------|
| SYSTEM_ADMIN | 시스템관리자 | 전체 시스템 관리 | 최고 |
| SALES_MANAGER | 영업담당자 | 영업 관리 | 높음 |
| LEADPOWER_MANAGER | 리드파워담당자 | 리드파워 업무 관리 | 높음 |
| OEM_PRODUCER | OEM생산자 | 생산 및 출하 관리 | 중간 |
| DELIVERY_DRIVER | 배송기사 | 배송 및 운송 | 낮음 |
| VIEWER | 조회전용 | 데이터 조회만 | 최소 |

---

### DELIVERY_DONE_STATUS (납품완료계 상태)

| 코드 | 이름 | 설명 |
|------|------|------|
| PENDING | 대기 | 작성 대기 |
| IN_PROGRESS | 작성중 | 작성 진행 중 |
| PENDING_SIGNATURE | 서명 대기 | 서명 대기 중 |
| COMPLETED | 완료 | 작성 완료 |
| SUBMITTED | 제출완료 | 제출 완료 |
| CANCELLED | 취소 | 취소됨 |

---

### COMPANY_TYPE (업체 유형)

| 코드 | 이름 | 설명 |
|------|------|------|
| SUPPLIER | 공급업체 | 자재 공급 업체 |
| MANUFACTURER | 제조업체 | 제품 제조 업체 |
| CONTRACTOR | 시공업체 | 시공 업체 |
| CLIENT | 고객사 | 발주 고객사 |

---

### ORGANIZATION_TYPE (수요기관 유형)

| 코드 | 이름 | 설명 |
|------|------|------|
| GOVERNMENT | 정부기관 | 중앙 정부 기관 |
| LOCAL_GOVERNMENT | 지자체 | 지방자치단체 |
| PUBLIC_CORPORATION | 공공기관 | 공공기관 |
| PRIVATE | 민간기업 | 민간 기업 |

---

## 에러 처리

### HTTP 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| 200 | OK | 요청 성공 |
| 201 | Created | 생성 성공 |
| 204 | No Content | 성공 (응답 데이터 없음) |
| 400 | Bad Request | 잘못된 요청 (검증 오류) |
| 401 | Unauthorized | 인증 필요 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 중복 데이터 (예: 이메일, 코드) |
| 410 | Gone | 만료됨 (예: 토큰 만료) |
| 500 | Internal Server Error | 서버 오류 |

---

### 에러 응답 형식

```typescript
{
  success: false,
  error: {
    code: string,         // 에러 코드 (예: VALIDATION_ERROR)
    message: string,      // 에러 메시지
    field?: string,       // 검증 오류 필드
    details?: any         // 추가 정보
  }
}
```

---

### 공통 에러 코드

| 코드 | 메시지 | HTTP 상태 |
|------|--------|-----------|
| VALIDATION_ERROR | 입력값 검증 실패 | 400 |
| UNAUTHORIZED | 인증이 필요합니다 | 401 |
| FORBIDDEN | 권한이 없습니다 | 403 |
| NOT_FOUND | 리소스를 찾을 수 없습니다 | 404 |
| DUPLICATE_ENTRY | 이미 존재하는 데이터입니다 | 409 |
| TOKEN_EXPIRED | 토큰이 만료되었습니다 | 410 |
| INTERNAL_ERROR | 서버 오류가 발생했습니다 | 500 |

---

### Mock Data Fallback

대부분의 서비스는 API 실패 시 Mock 데이터로 fallback합니다:

```typescript
async getUsers(params) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error()
    return await response.json()
  } catch (error) {
    console.error('API 실패, Mock 데이터 반환')
    return this.getMockUsers(params)  // Fallback
  }
}
```

**Mock 데이터 사용 서비스:**
- `user.service.ts` - 5명의 하드코딩된 사용자
- 기타 서비스 - 빈 배열 또는 샘플 데이터

---

## 인증 및 권한

### 인증 방식

**JWT (JSON Web Token) 기반 인증**

```typescript
// Request Header
Authorization: Bearer <access_token>
```

---

### 토큰 갱신

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```typescript
{
  refreshToken: string
}
```

**Response:**
```typescript
{
  success: boolean
  data: {
    accessToken: string
    refreshToken: string
    expiresIn: number    // 초 단위
  }
}
```

---

### 권한 체크 흐름

1. 미들웨어 (`middleware/auth.ts`)에서 토큰 검증
2. 만료 시 자동 갱신 시도
3. 실패 시 `/login`으로 리다이렉트
4. Admin 페이지는 추가 역할 체크

---

### 역할별 접근 권한

| 역할 | 사용자관리 | 영업관리 | 발주관리 | 출하관리 | 운송관리 | 납품확인 |
|------|-----------|---------|---------|---------|---------|---------|
| SYSTEM_ADMIN | ✅ 전체 | ✅ 전체 | ✅ 전체 | ✅ 전체 | ✅ 전체 | ✅ 전체 |
| SALES_MANAGER | ❌ | ✅ 전체 | ❌ | ❌ | ❌ | ❌ |
| LEADPOWER_MANAGER | ❌ | ✅ 전체 | ✅ 전체 | ✅ 조회 | ✅ 특수 | ✅ 전체 |
| OEM_PRODUCER | ❌ | ❌ | ✅ 본인 | ✅ 본인 | ✅ 본인 | ✅ 본인 |
| DELIVERY_DRIVER | ❌ | ❌ | ❌ | ❌ | ✅ 본인 | ❌ |
| VIEWER | ❌ | ✅ 조회 | ✅ 조회 | ✅ 조회 | ✅ 조회 | ✅ 조회 |

---

## 파일 업로드

### 파일 업로드 공통 규칙

**Content-Type:** `multipart/form-data`

**파일 크기 제한:**
- PDF: 최대 20MB
- 이미지: 최대 5MB/개
- Excel: 최대 10MB

**허용 확장자:**
- 문서: pdf, doc, docx, xls, xlsx
- 이미지: jpg, jpeg, png, gif
- 압축: zip

---

### 서명 이미지 업로드

**Endpoint:** `POST /api/public/deliveries/{token}/signature`

**Format:** PNG, Base64 또는 Blob

**Process:**
1. Canvas에서 서명 작성
2. `canvas.toBlob()` 또는 `canvas.toDataURL()` 변환
3. FormData로 업로드

```typescript
const blob = await new Promise<Blob>(resolve => {
  canvas.toBlob(resolve, 'image/png')
})
const formData = new FormData()
formData.append('signature', blob, 'signature.png')
```

---

### 사진 업로드

**Endpoint:** `POST /api/public/deliveries/{token}/photos`

**최대 개수:** 5개

**Process:**
1. `<input type="file" accept="image/*" multiple>` 선택
2. File 객체 배열 수집
3. FormData에 추가
4. 업로드

```typescript
const formData = new FormData()
photos.forEach((photo, index) => {
  formData.append('photos', photo, `photo${index}.jpg`)
})
```

---

### PDF 업로드

**Endpoint:** `POST /api/contracts/upload-pdf`

**AI 자동 추출:**
- OCR 텍스트 추출
- 계약 정보 파싱
- 품목 테이블 추출

**Response:**
- `extractedText` - 전체 OCR 텍스트
- `extractedContractInfo` - AI 파싱 계약 정보
- `extractedDeliveryItems` - 품목 배열

---

### Excel 대량 등록

**Endpoint:** `POST /api/admin/items/bulk`

**형식:** xlsx, xls

**필수 컬럼:**
- 품목코드
- 품목명
- 규격
- 단위
- 단가

**Process:**
1. Excel 파일 업로드
2. 서버에서 행별 파싱
3. 검증 후 DB 저장
4. 에러 행 반환

**Response:**
```typescript
{
  totalRows: 100,
  successCount: 95,
  failCount: 5,
  errors: [
    { row: 10, message: '중복된 품목코드' },
    { row: 25, message: '단가는 숫자여야 합니다' }
  ]
}
```

---

## 개발 참고사항

### API 환경 전환

```javascript
// 브라우저 콘솔
apiEnvironment.forceProduction()   // 운영 API
apiEnvironment.forceDevelopment()  // 개발 API
apiEnvironment.getStatus()         // 현재 상태 확인
```

---

### 상태 코드 사용 패턴

```typescript
// Composable 사용 (권장)
import { useCommonStatus } from '~/composables/useCommonStatus'
import { useSalesStatus } from '~/composables/useSalesStatus'

const { statusOptions, getStatusClass, getStatusText } = useCommonStatus()

// 초기 로딩
onMounted(async () => {
  await loadStatusCodes()
})

// 텍스트 변환
const statusText = getStatusText('PENDING')  // '대기'

// CSS 클래스
const cssClass = getStatusClass('PENDING')   // 'status-pending'
```

---

### 페이지네이션 구현

```typescript
const currentPage = ref(0)
const pageSize = ref(10)
const totalPages = ref(0)
const items = ref([])

async function loadData() {
  const response = await api.getList({
    page: currentPage.value,
    size: pageSize.value,
    sort: 'createdAt,desc'
  })
  items.value = response.data.content
  totalPages.value = response.data.totalPages
}

function changePage(page: number) {
  currentPage.value = page
  loadData()
}
```

---

### 검색 폼 구현

```typescript
const searchForm = reactive({
  keyword: '',
  startDate: '',
  endDate: '',
  status: ''
})

async function search() {
  currentPage.value = 0  // 검색 시 첫 페이지로
  await loadData()
}

function resetSearch() {
  Object.assign(searchForm, {
    keyword: '',
    startDate: '',
    endDate: '',
    status: ''
  })
  search()
}
```

---

### 날짜 포맷팅

```typescript
import { formatDate, formatDateTime } from '~/utils/format'

formatDate('2025-11-05')              // '2025년 11월 5일'
formatDateTime('2025-11-05T10:30:00') // '2025년 11월 5일 10:30'
```

---

### 금액 포맷팅

```typescript
import { formatCurrency } from '~/utils/format'

formatCurrency(1234567)  // '1,234,567원'
```

---

### 에러 처리 패턴

```typescript
try {
  const response = await api.create(data)
  if (response.success) {
    alert('등록되었습니다')
    router.push('/admin/list')
  } else {
    alert(response.message || '등록 실패')
  }
} catch (error: any) {
  if (error.status === 401) {
    alert('로그인이 필요합니다')
    router.push('/login')
  } else if (error.status === 403) {
    alert('권한이 없습니다')
  } else if (error.status === 409) {
    alert('중복된 데이터입니다')
  } else {
    alert('서버 오류가 발생했습니다')
  }
}
```

---

## 변경 이력

### 2025-11-05 (오후) - 백엔드 실제 구현 반영
- ✅ **전역 `/api` 프리픽스 추가**: 모든 엔드포인트에 `/api` 추가
- ✅ **User Management 수정**:
  - HTTP 메서드 변경: `PATCH` → `PUT` (상태 토글)
  - 검색 엔드포인트: `GET`와 `POST` 모두 지원
  - 신규 API 추가: `GET /api/admin/users/search/simple` (간단 검색)
- ✅ **Sales Management 재구성**:
  - 구현된 API만 유지 (5개): 목록, 상세, 생성, 수정, 삭제
  - 미구현 API를 "향후 구현 예정" 섹션으로 분리 (8개)
- ✅ **Code Management 수정**:
  - 경로 패턴 변경: `{id}` → `{groupCode}/{code}`
  - 신규 API 5개 추가: 그룹 삭제, 페이징 조회 (2개), active 조회 (2개)
- ✅ **CommonCodeController 섹션 추가**:
  - 공개 API 3개: 그룹 목록, 상세 목록, 상세 단건 조회
  - 인증 불필요 (`/api/common/codes`)

### 2025-11-05 (오전) - 상태 코드 통합
- ✅ API 엔드포인트 표준화 (설계문서 반영)
- ✅ 사용자 관리 API 경로 수정: `/users` → `/admin/users`
- ✅ 계약 관리 API 경로 수정: `/admin/contract` → `/contracts`
- ✅ 모든 엔드포인트 파일에 권한 주석 추가
- ✅ 상태 코드 DB 기반으로 통합 (하드코딩 제거)
- ✅ `StatusOption` 타입 `types/common.ts`로 중앙화
- ✅ `clearCommonStatusCache()` 함수명 변경 (중복 제거)
- ✅ 영업 상태 드롭다운 버그 수정 (composable 중복 호출 제거)

### 2025-01-04 (납품확인 시스템)
- ✅ IN_PROGRESS 상태 한글화 ("진행중")
- ✅ 진행중 상태 안내 메시지 추가
- ✅ itemSummary, shipmentDate nullable 처리
- ✅ PDF 다운로드 버튼 시각성 개선
- ✅ deliveryId fallback URL 생성 로직 추가
- ✅ 사진 갤러리 닫기 버튼 추가

### 향후 계획
- 🔲 백엔드 API 경로 변경 예정:
  - `/admin/orders` → `/delivery-requests`
  - `/admin/transport` → `/waybills`
- 🔲 코드 API 분리 검토:
  - `/common/codes` (조회용)
  - `/admin/codes` (관리용)
- 🔲 방문 통계 서버 저장 기능 추가

---

## 문의 및 지원

**프로젝트 관리자:** PTLPSM 개발팀
**문서 작성:** Claude Code
**버전:** 1.0.0
**마지막 업데이트:** 2025-11-05

---

**End of API Specification**
