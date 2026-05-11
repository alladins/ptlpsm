<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-05 | Updated: 2026-05-05 -->

# types

## Purpose
TypeScript 타입·인터페이스 정의. 백엔드 스키마와 1:1 매칭되는 요청/응답 타입과 도메인별 상수·라벨 맵. 모든 API 호출과 상태 관리의 유일한 진실 공급원(SSOT).

## Key Files
| File | Description |
|------|-------------|
| `common.ts` | API 응답 래퍼, 페이징, 검색 요청 기본 타입 |
| `order.ts` | 발주 관련 (Order, OrderItem, CONTRACT_TYPE, ORDER_STATUS) |
| `delivery.ts` | 납품확인 (Delivery, DELIVERY_STATUS) |
| `shipment.ts` | 출하 (Shipment, SHIPMENT_STATUS) |
| `user.ts` | 사용자 (User, ROLE) |
| `company.ts` | 회사 (Company, COMPANY_TYPE) |
| `fund.ts` | 자금 (Advance, Baseline, Payment, FUND_STATUS) |
| `purchase-order.ts` | 발주서 (PurchaseOrder, OEM) |
| `sales.ts` | 수주 (Sales, SALES_STATUS) |
| `commission.ts` | 커미션 (CommissionRate, CommissionSettlement) |

## 28개 주요 타입
| Category | Files |
|----------|-------|
| **기본** | common, user, company |
| **발주·수주** | order, purchase-order, sales, quotation, contract |
| **출하·운송** | shipment, dispatch-request, inventory, transport, warehouse |
| **납품** | delivery, delivery-done |
| **자금** | fund, advance-payment, payment, baseline |
| **커미션** | commission, oem-cost, oem-ledger, oem-dashboard |
| **시스템** | menu, notification, message-history, access-log, bgrade-item |

## For AI Agents

### Working In This Directory
- 파일명: kebab-case (예: `purchase-order.ts`)
- 명명: PascalCase (인터페이스), UPPER_CASE (상수)
- as const 패턴: `const STATUS = { A: 'A', B: 'B' } as const`
- 타입 추출: `typeof STATUS[keyof typeof STATUS]`
- 라벨 맵: `Record<Status, string>` 형식
- 백엔드 스키마 먼저 읽기: 필드명 정확히 매칭

### TypeScript Pattern
```typescript
// 상수 + 타입 추출
export const STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED'
} as const

export type Status = typeof STATUS[keyof typeof STATUS]

// 라벨 맵
export const STATUS_LABELS: Record<Status, string> = {
  [STATUS.PENDING]: '대기',
  [STATUS.COMPLETED]: '완료'
}

// 인터페이스
export interface Order {
  id: number
  orderNumber: string
  itemTotalAmount: number  // 품대계 (필수)
  totalAmount?: number      // 레거시 (저장만, UI 금지)
  status: Status
  createdAt: string        // ISO 형식 (UTC)
  items: OrderItem[]
}

export interface OrderItem {
  id: number
  orderId: number
  skuName: string  // sku_nm (데이터베이스 컬럼명)
  quantity: number
  unitPrice: number
  amount: number
}
```

### 금액 필드 명명
- `itemTotalAmount`: 품대계 (발주/수주의 기준)
- `totalAmount`: 레거시 (저장만, UI 금지)
- `amount`: 단가 × 수량 또는 출하 금액
- `commission`: 수수료 (별도, 품대계와 합산 금지)

### 페이징 타입
```typescript
export interface PageResponse<T> {
  content: T[]
  page: number        // 0-indexed (API 응답)
  size: number
  totalElements: number
  totalPages: number
  number: number
}

export interface SearchRequest {
  page: number        // 0-indexed (API 요청)
  size: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}
```

### 상태 값 규칙
- 영문 대문자 스네이크_케이스 (PENDING, IN_PROGRESS, COMPLETED)
- 백엔드 enum 정의 그대로 사용
- 각 상태별 라벨 맵 필수 (`STATUS_LABELS`)

### 날짜·시간 타입
- 모든 날짜: ISO 8601 문자열 (UTC) 저장
- UI 표시: DateTimeUtil.toKST() 변환 후 표시
- 입력: HTML input[type="date"] (로컬) → ISO로 변환

## Dependencies

### Internal
- 없음 (순수 타입 정의)

### External
- typescript (타입만)

<!-- MANUAL: -->
