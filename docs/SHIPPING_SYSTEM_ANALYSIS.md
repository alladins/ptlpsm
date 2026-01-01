# 출하관리 시스템 분석 문서

> **분석일**: 2025-01-31
> **시스템**: PTLPSM (Nuxt 3 기반 출하관리 시스템)

---

## 1. 시스템 개요

### 1.1 전체 업무 흐름

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  영업   │ → │  발주   │ → │  출하   │ → │  납품   │ → │납품완료 │ → │자금관리 │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                   │              │              │              │              │
                   ▼              ▼              ▼              ▼              ▼
              납품요구서      운송배차       모바일확인     3종PDF생성    선급/기성/잔금
              PDF 추출       출하지시       서명수집       조달청제출      OEM지급
```

### 1.2 주요 특징

| 특징 | 설명 |
|------|------|
| **PDF 자동화** | 발주 등록 시 납품요구서 PDF를 AI/OCR로 자동 추출 |
| **트리 구조** | 본계약/변경계약/추가계약을 계층적으로 관리 |
| **모바일 현장 확인** | 터치 서명, 사진 촬영, GPS 위치 정보 수집 |
| **다중 서명** | 현장소장 + 감리원 서명을 통한 승인 체계 |
| **완전한 자금 추적** | 선급금 → 기성금 → 잔금 → OEM 지급 전체 사이클 |

---

## 2. 업무 단계별 상세

### 2.1 발주/수주 관리

#### 관련 파일
| 파일 | 설명 |
|------|------|
| `pages/admin/order/list.vue` | 발주 목록 (트리 구조) |
| `pages/admin/order/register.vue` | 발주 등록 |
| `pages/admin/order/edit/[id].vue` | 발주 수정 |
| `pages/admin/sales/list.vue` | 수주 목록 |
| `services/order.service.ts` | 발주 API 서비스 |
| `types/order.ts` | 발주 타입 정의 |

#### 계약 유형
```typescript
type ContractType = 'MAIN' | 'CHANGE' | 'ADDITIONAL'
// MAIN: 본계약
// CHANGE: 변경계약
// ADDITIONAL: 추가계약
```

#### 주요 API
```
GET    /api/admin/orders              목록 조회 (트리 지원)
POST   /api/admin/orders              발주 등록
POST   /api/admin/orders/upload-pdf   PDF 자동 추출
PUT    /api/admin/orders/{id}         발주 수정
```

---

### 2.2 출하 관리

#### 관련 파일
| 파일 | 설명 |
|------|------|
| `pages/admin/shipping/list.vue` | 출하 목록 |
| `pages/admin/shipping/register.vue` | 출하 등록 |
| `pages/admin/shipping/edit/[id].vue` | 출하 수정 |
| `services/shipment.service.ts` | 출하 API 서비스 |

#### 출하 상태 흐름
```
REGISTERED (등록)
    ↓
IN_TRANSIT (운송중)
    ↓
DELIVERED (배송완료)
    ↓
CONFIRMED (납품확인)
```

#### 추가변경 제한
- 기성금 청구 후에는 출하 수량 변경 불가 (`isBilled` 체크)
- 수량 검증: 출하수량 ≤ 발주수량 - 기출하수량
- 변경 이력: `shipment_quantity_changes` 테이블에 기록

#### 주요 API
```
GET    /api/admin/shipments                        목록 조회
POST   /api/admin/shipments                        출하 등록
POST   /api/admin/shipments/{id}/additional-change 추가변경 실행
GET    /api/admin/shipments/{id}/change-history    변경 이력
```

---

### 2.3 납품 확인

#### 관련 파일
| 파일 | 설명 |
|------|------|
| `pages/admin/delivery/list.vue` | 납품확인 트리 조회 |
| `pages/m/delivery/[token].vue` | 모바일 납품확인 |
| `services/delivery.service.ts` | 납품확인 API 서비스 |
| `types/delivery.ts` | 납품확인 타입 정의 |

#### 모바일 납품확인 기능
- 터치 서명 (Canvas)
- 사진 촬영 (최대 5장)
- GPS 위치 정보 자동 수집
- 오프라인 지원 (로컬 저장)

#### 주요 API
```
GET    /api/admin/deliveries/tree       트리 구조 조회
GET    /api/m/delivery/{token}          모바일 조회 (토큰)
POST   /api/m/delivery/{token}/signature 서명 업로드
POST   /api/m/delivery/{token}/confirm   납품 완료
```

---

### 2.4 납품완료계

#### 관련 파일
| 파일 | 설명 |
|------|------|
| `pages/admin/delivery-done/list.vue` | 납품완료계 목록 |
| `services/delivery-done.service.ts` | 납품완료계 API 서비스 |
| `types/delivery-done.ts` | 납품완료계 타입 정의 |

#### 상태 흐름
```
PENDING (대기)
    ↓ 첫 출하 생성
IN_PROGRESS (납품중)
    ↓ 모든 납품확인 완료
PENDING_SIGNATURE (서명 대기)
    ↓ 현장소장 + 감리원 서명 완료
COMPLETED (완료) → 3종 PDF 자동 생성
    ↓ 조달청 제출
SUBMITTED (제출완료)
```

#### 생성되는 PDF 3종
1. **납품확인서** - 납품 내역 확인
2. **납품완료계** - 최종 완료 보고서
3. **사진대지** - 현장 사진 모음

#### 주요 API
```
POST   /api/admin/delivery-done/{id}/send-signature-url  다중 서명 URL 발송
GET    /api/admin/delivery-done/{id}/pdf/{type}          PDF 다운로드
GET    /api/m/delivery-done/{token}                      모바일 서명 페이지
```

---

## 3. 자금 관리 시스템

### 3.1 자금 흐름 개요

```
┌─────────────────────────────────────────────────────────────────────┐
│                         자금 관리 흐름                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐                │
│   │  선급금   │     │  기성금   │     │   잔금    │                │
│   │  (70%)    │     │  (N차)    │     │  (나머지) │                │
│   └─────┬─────┘     └─────┬─────┘     └─────┬─────┘                │
│         │                 │                 │                       │
│         ▼                 ▼                 ▼                       │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐                │
│   │ PDF 5종   │     │ 서명 수집 │     │ 입금 확인 │                │
│   │ 자동 생성 │     │ (2인 서명)│     │           │                │
│   └───────────┘     └─────┬─────┘     └───────────┘                │
│                           │                                         │
│                           ▼                                         │
│                     ┌───────────┐                                   │
│                     │ OEM 지급  │                                   │
│                     │  (70%)    │                                   │
│                     └───────────┘                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 관련 파일

| 파일 | 설명 |
|------|------|
| `pages/admin/funds/index.vue` | 자금 목록 |
| `pages/admin/funds/[id].vue` | 자금 상세 (탭: 선급금/기성금/잔금/OEM) |
| `pages/admin/funds/statistics.vue` | 자금 통계 |
| `services/fund.service.ts` | 자금 API 서비스 |
| `types/fund.ts` | 자금 타입 정의 |
| `stores/fund.ts` | 자금 Pinia 스토어 |

### 3.3 자금 관련 모달 컴포넌트

| 컴포넌트 | 역할 | 파일 |
|----------|------|------|
| **AdvancePaymentModal** | 선급금 신청 | `components/fund/AdvancePaymentModal.vue` |
| **ProgressPaymentModal** | 기성금 청구 | `components/fund/ProgressPaymentModal.vue` |
| **ProgressSignatureModal** | 서명 URL 발송 | `components/fund/ProgressSignatureModal.vue` |
| **BalancePaymentModal** | 잔금 신청 | `components/fund/BalancePaymentModal.vue` |
| **OemPaymentModal** | OEM 지급 등록/완료 | `components/fund/OemPaymentModal.vue` |
| **FinalDeliveryModal** | 납품완료 처리 | `components/fund/FinalDeliveryModal.vue` |
| **CollectionConfirmModal** | 수금 확인 (공통) | `components/fund/CollectionConfirmModal.vue` |

---

## 4. 선급금 (Advance Payment)

### 4.1 처리 흐름

```
선급금 신청
    ↓
AdvancePaymentModal 열기
    ↓
신청 정보 입력 (금액, 신청일, 비고)
    ↓
fundService.requestAdvance() 호출
    ↓
서버: 5종 PDF 자동 생성
    ↓
상태: REQUESTED
    ↓
관리자 승인 → 상태: APPROVED
    ↓
CollectionConfirmModal로 수금 확인
    ↓
상태: PAID (완료)
```

### 4.2 금액 계산

```typescript
선급금액 = 계약총액 × 선급금비율 (기본 70%)
```

### 4.3 생성되는 PDF 문서 5종

| 문서 유형 | 설명 |
|-----------|------|
| APPLICATION | 선급금신청서 |
| USAGE_PLAN | 선급금사용계획 |
| USAGE_AGREEMENT | 선급금사용확약서 |
| USAGE_PLEDGE | 선급금사용각서 |
| SETTLEMENT | 선급금정산서 |

### 4.4 상태 정의

```typescript
type AdvanceStatus = 'REQUESTED' | 'APPROVED' | 'PAID' | 'REJECTED'
```

### 4.5 주요 API

```
POST /api/admin/funds/{fundId}/advances                     선급금 신청
POST /api/admin/funds/{fundId}/advances/{advanceId}/approve 선급금 승인
POST /api/admin/funds/{fundId}/advances/{advanceId}/confirm 선급금 수금확인
```

---

## 5. 기성금 (Progress Payment)

### 5.1 처리 흐름

```
기성 청구 시작
    ↓
ProgressPaymentModal 열기
    ↓
청구 가능 출하 선택 (납품확인 완료 건만)
    ↓
ProgressSignatureModal 열기
    ↓
담당자 선택 (현장소장 + 감리원)
    ↓
baselineService.createAndSendSignature() 호출
    ↓
기성 차수 생성 + 서명 URL 발송 (LMS 문자)
    ↓
현장소장 서명 + 감리원 서명 (모바일)
    ↓
양측 서명 완료 → PDF 자동 생성
    ↓
상태: REQUESTED
    ↓
CollectionConfirmModal로 수금 확인
    ↓
상태: PAID (완료)
```

### 5.2 금액 계산

```typescript
청구금액 = 선택한 출하 건들의 총액 합계
OEM지급예정액 = 청구금액 × 70%
```

### 5.3 서명 프로세스

| 서명자 | 역할 | 상태 |
|--------|------|------|
| 현장소장 (SITE_MANAGER) | 첫 번째 서명 | PARTIAL_SIGNED |
| 감리원 (SITE_INSPECTOR) | 두 번째 서명 | SIGNATURE_COMPLETED |

### 5.4 상태 정의

```typescript
type PaymentStatus = 'REQUESTED' | 'APPROVED' | 'PAID' | 'REJECTED'
type SignatureStatus = 'PENDING_SIGNATURE' | 'PARTIAL_SIGNED' | 'SIGNATURE_COMPLETED'
```

### 5.5 주요 API

```
POST /api/admin/baseline/create-and-send   기성 차수 생성 + 서명 URL 발송
POST /api/admin/funds/{fundId}/payments    기성금 요청
POST /api/admin/funds/{fundId}/payments/{paymentId}/confirm  수금 확인
```

---

## 6. 잔금 (Balance Payment)

### 6.1 처리 흐름

```
잔금 신청
    ↓
BalancePaymentModal 열기
    ↓
계산 기준 선택 (신청 기준 / 입금 기준)
    ↓
잔금 자동 계산
    ↓
fundService.requestBalance() 호출
    ↓
상태: REQUESTED
    ↓
CollectionConfirmModal로 수금 확인
    ↓
상태: PAID (완료)
```

### 6.2 금액 계산

```typescript
// 신청 기준
잔금 = 계약총액 - 선급금(신청액) - 기성금누계(신청액)

// 입금 기준
잔금 = 계약총액 - 선급금(입금액) - 기성금누계(입금액)
```

### 6.3 상태 정의

```typescript
type BalanceStatus = 'NOT_REQUESTED' | 'REQUESTED' | 'APPROVED' | 'PAID' | 'REJECTED'
```

### 6.4 제한 조건

- **납품완료 후에만 신청 가능**
- 금액 불일치 시 경고 표시

### 6.5 주요 API

```
GET  /api/admin/funds/{fundId}/balance          잔금 정보 조회
POST /api/admin/funds/{fundId}/balance/request  잔금 신청
POST /api/admin/funds/{fundId}/balance/confirm  잔금 입금확인
```

---

## 7. OEM 지급

### 7.1 처리 흐름

```
기성금 청구 완료
    ↓
OemPaymentModal 열기 (등록 모드)
    ↓
지급 예정 정보 입력
    ↓
fundService.createOemPayment() 호출
    ↓
상태: SCHEDULED
    ↓
실제 지급 시
    ↓
OemPaymentModal 열기 (완료 모드)
    ↓
지급 완료 정보 입력
    ↓
fundService.completeOemPayment() 호출
    ↓
상태: PAID (완료)
```

### 7.2 금액 계산

```typescript
OEM지급액 = 기성금 × OEM지급률 (기본 70%)
```

### 7.3 모드 구분

| 모드 | 조건 | 동작 |
|------|------|------|
| 등록 모드 | existingPayment 없음 | 새 지급 등록 |
| 완료 모드 | existingPayment 있음 | 기존 지급 완료 처리 |

### 7.4 상태 정의

```typescript
type OemPaymentStatus = 'SCHEDULED' | 'PAID' | 'CANCELLED'
```

### 7.5 주요 API

```
GET  /api/admin/funds/{fundId}/oem-payments                        OEM 지급 목록
POST /api/admin/funds/{fundId}/oem-payments                        OEM 지급 등록
POST /api/admin/funds/{fundId}/oem-payments/{oemPaymentId}/complete OEM 지급 완료
```

---

## 8. 수금률 계산

### 8.1 계산 공식

```typescript
수금률 = (선급금입금 + 기성금입금누계 + 잔금입금) / 계약총액 × 100
```

### 8.2 자금 현황 요약

```typescript
interface FundSummary {
  contractTotalAmount: number      // 계약 총액
  advancePaymentAmount: number     // 선급금 (신청/입금)
  progressPaymentTotal: number     // 기성금 누계
  balanceAmount: number            // 잔금
  oemTotalPaid: number             // OEM 지급 총액
  collectionRate: number           // 수금률 (%)
}
```

---

## 9. 데이터 모델

### 9.1 주요 타입 정의

#### Fund (자금 정보)
```typescript
interface Fund {
  fundId: number
  orderId: number
  deliveryRequestNo: string
  siteName: string
  contractTotalAmount: number
  advancePaymentRate: number
  advancePaymentAmount: number
  advancePaymentDate: string | null
  progressPaymentTotal: number
  balanceAmount: number
  oemTotalPaid: number
  status: FundStatus
}
```

#### ProgressPaymentRequest (기성금 요청)
```typescript
interface ProgressPaymentRequest {
  requestId: number
  fundId: number
  baselineId: number
  requestAmount: number
  deliveredQuantity: number
  oemPaymentAmount: number
  oemPaymentRate: number
  requestDate: string
  paymentDate: string | null
  status: PaymentStatus
  signatureStatus?: SignatureStatus
}
```

#### AdvancePayment (선급금)
```typescript
interface AdvancePayment {
  advanceId: number
  fundId: number
  requestAmount: number
  approvedAmount: number | null
  paidAmount: number | null
  requestDate: string
  approvalDate: string | null
  paymentDate: string | null
  status: AdvanceStatus
  documents?: AdvanceDocument[]
}
```

#### OemPayment (OEM 지급)
```typescript
interface OemPayment {
  oemPaymentId: number
  fundId: number
  paymentId?: number
  paymentSeq: number
  scheduledAmount: number
  paidAmount: number | null
  scheduledDate: string
  paidDate: string | null
  oemCompanyName?: string
  status: OemPaymentStatus
}
```

---

## 10. API 엔드포인트 전체 목록

### 10.1 발주 관리
```
GET    /api/admin/orders                     목록 조회
POST   /api/admin/orders                     발주 등록
POST   /api/admin/orders/upload-pdf          PDF 자동 추출
PUT    /api/admin/orders/{id}                발주 수정
DELETE /api/admin/orders/{id}                발주 삭제
```

### 10.2 출하 관리
```
GET    /api/admin/shipments                        목록 조회
POST   /api/admin/shipments                        출하 등록
PUT    /api/admin/shipments/{id}                   출하 수정
POST   /api/admin/shipments/{id}/additional-change 추가변경
GET    /api/admin/shipments/{id}/change-history    변경 이력
```

### 10.3 납품확인
```
GET    /api/admin/deliveries/tree            트리 구조 조회
GET    /api/m/delivery/{token}               모바일 조회
POST   /api/m/delivery/{token}/signature     서명 업로드
POST   /api/m/delivery/{token}/confirm       납품 완료
```

### 10.4 납품완료계
```
GET    /api/admin/delivery-done                          목록 조회
POST   /api/admin/delivery-done/{id}/send-signature-url  서명 URL 발송
GET    /api/admin/delivery-done/{id}/pdf/{type}          PDF 다운로드
GET    /api/m/delivery-done/{token}                      모바일 서명 페이지
```

### 10.5 자금 관리
```
GET    /api/admin/funds                                  목록 조회
GET    /api/admin/funds/{fundId}                         상세 조회
POST   /api/admin/funds                                  자금 생성

# 선급금
POST   /api/admin/funds/{fundId}/advances                선급금 신청
POST   /api/admin/funds/{fundId}/advances/{id}/approve   선급금 승인
POST   /api/admin/funds/{fundId}/advances/{id}/confirm   선급금 수금확인

# 기성금
POST   /api/admin/funds/{fundId}/payments                기성금 요청
POST   /api/admin/funds/{fundId}/payments/{id}/approve   기성금 승인
POST   /api/admin/funds/{fundId}/payments/{id}/confirm   기성금 수금확인

# 잔금
GET    /api/admin/funds/{fundId}/balance                 잔금 정보
POST   /api/admin/funds/{fundId}/balance/request         잔금 신청
POST   /api/admin/funds/{fundId}/balance/confirm         잔금 입금확인

# OEM 지급
GET    /api/admin/funds/{fundId}/oem-payments            OEM 목록
POST   /api/admin/funds/{fundId}/oem-payments            OEM 등록
POST   /api/admin/funds/{fundId}/oem-payments/{id}/complete OEM 완료
```

### 10.6 기성 차수 (Baseline)
```
POST   /api/admin/baseline/create-and-send   기성 차수 생성 + 서명 URL 발송
GET    /api/admin/baseline/{baselineId}      차수 상세
GET    /api/m/baseline/{token}               모바일 서명 페이지
POST   /api/m/baseline/{token}/signature     서명 제출
```

---

## 11. 핵심 파일 목록

### 11.1 페이지 (Pages)
| 우선순위 | 파일 | 설명 |
|----------|------|------|
| ⭐⭐⭐ | `pages/admin/order/list.vue` | 발주 목록 |
| ⭐⭐⭐ | `pages/admin/shipping/list.vue` | 출하 목록 |
| ⭐⭐⭐ | `pages/admin/delivery/list.vue` | 납품확인 목록 |
| ⭐⭐⭐ | `pages/admin/delivery-done/list.vue` | 납품완료계 목록 |
| ⭐⭐⭐ | `pages/admin/funds/[id].vue` | 자금 상세 |
| ⭐⭐ | `pages/m/delivery/[token].vue` | 모바일 납품확인 |

### 11.2 서비스 (Services)
| 파일 | 설명 |
|------|------|
| `services/order.service.ts` | 발주 API |
| `services/shipment.service.ts` | 출하 API |
| `services/delivery.service.ts` | 납품확인 API |
| `services/delivery-done.service.ts` | 납품완료계 API |
| `services/fund.service.ts` | 자금 API |
| `services/baseline.service.ts` | 기성 차수 API |

### 11.3 타입 (Types)
| 파일 | 설명 |
|------|------|
| `types/order.ts` | 발주 타입 |
| `types/delivery.ts` | 납품확인 타입 |
| `types/delivery-done.ts` | 납품완료계 타입 |
| `types/fund.ts` | 자금 타입 |
| `types/baseline.ts` | 기성 차수 타입 |

### 11.4 컴포넌트 (Components)
| 파일 | 설명 |
|------|------|
| `components/fund/AdvancePaymentModal.vue` | 선급금 신청 |
| `components/fund/ProgressPaymentModal.vue` | 기성 청구 |
| `components/fund/ProgressSignatureModal.vue` | 서명 URL 발송 |
| `components/fund/BalancePaymentModal.vue` | 잔금 신청 |
| `components/fund/OemPaymentModal.vue` | OEM 지급 |
| `components/fund/FinalDeliveryModal.vue` | 납품완료 |
| `components/fund/CollectionConfirmModal.vue` | 수금 확인 |

---

## 12. 비즈니스 규칙 요약

### 12.1 제한 조건

| 규칙 | 설명 |
|------|------|
| 선급금 1회 | 선급금은 1회만 신청 가능 |
| 기성금 청구 조건 | 납품확인 완료된 출하만 청구 가능 |
| 잔금 신청 조건 | 납품완료 후에만 신청 가능 |
| 수량 변경 제한 | 기성금 청구 후 출하 수량 변경 불가 |
| 서명 필수 | 기성금 청구 시 현장소장+감리원 서명 필수 |

### 12.2 자동화 기능

| 기능 | 트리거 |
|------|--------|
| PDF 5종 생성 | 선급금 신청 시 |
| 서명 URL 발송 | 기성금 청구 시 (LMS 문자) |
| PDF 3종 생성 | 납품완료 서명 완료 시 |
| OEM 지급액 계산 | 기성금 청구 시 (70% 자동 계산) |

---

## 13. 문서 생성 정보

이 문서는 `feature-dev:code-explorer` 에이전트를 사용하여 자동 생성되었습니다.

### 분석 대상 파일
- 페이지: 15개
- 서비스: 8개
- 타입: 6개
- 컴포넌트: 7개

### 다음 단계
이 분석 문서를 기반으로 `document-skills:doc-coauthoring` 스킬을 사용하여 사용자 매뉴얼을 작성할 수 있습니다.

```bash
# 2단계 실행 예시
/doc-coauthoring docs/SHIPPING_SYSTEM_ANALYSIS.md 기반으로
출하관리 시스템 사용자 매뉴얼 작성
```
