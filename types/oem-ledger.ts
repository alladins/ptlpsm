/**
 * OEM 월별 매출원장 타입 정의
 */

/** 원장 항목 */
export interface OemLedgerItem {
  poNo: string
  poId: number
  orderDate: string
  demandAgency: string
  projectName: string
  spec: string
  skuId: string
  quantity: number
  unit: string
  unitCost: number
  amount: number
  poUnitPrice: number | null
  masterCostPrice: number | null
  costSource: OemLedgerCostSource
  remarks: string | null
  shipmentNo: string | null
  shipmentDate: string | null
  oemCompanyName?: string  // 전체 조회 시 제조사명
}

/** 원장 응답 */
export interface OemMonthlyLedgerResponse {
  oemCompanyId: number
  oemCompanyName: string | null
  yearMonth: string
  items: OemLedgerItem[]
  totalQuantity: number
  /** 발주 품목 합계 (손실 차감 전 공급가액) */
  totalAmount: number

  /** 손실 차감 목록 (제조사 부담 손실·스펙오납 정산분) */
  lossDeductions?: LossDeductionSummary[]
  /** 손실 차감액 합계 */
  lossDeductionTotal?: number
  /** 지급 예정 공급가액 = totalAmount − lossDeductionTotal */
  payableAmount?: number
  /** 부가세 (공급가액의 10%, 원 단위 반올림 — 발주서 PDF 와 동일 기준) */
  vatAmount?: number
  /** 합계 (공급가액 + 부가세) */
  totalWithVat?: number

  paymentStatus: OemLedgerPaymentStatus
  paymentId: number | null
  paidAmount: number | null
  paidDate: string | null
}

/** 원장에 표시되는 손실 차감 행 (백엔드 LossAdjustmentResponse 의 부분집합) */
export interface LossDeductionSummary {
  lossId: number
  lossNo: string
  lossTypeName: string
  skuName?: string | null
  quantity: number
  oemDeductionAmount: number
  settlementStatusName: string
  occurredDate: string
}

/** 원가 출처 (백엔드 OemLedgerMapper 의 costSource 와 1:1) */
export const OEM_LEDGER_COST_SOURCE = {
  SHIPMENT: 'SHIPMENT',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  MASTER: 'MASTER',
  NONE: 'NONE'
} as const

export type OemLedgerCostSource = typeof OEM_LEDGER_COST_SOURCE[keyof typeof OEM_LEDGER_COST_SOURCE]

export const OEM_LEDGER_COST_SOURCE_LABELS: Record<OemLedgerCostSource, string> = {
  [OEM_LEDGER_COST_SOURCE.SHIPMENT]: '출하스냅샷',
  [OEM_LEDGER_COST_SOURCE.PURCHASE_ORDER]: '발주스냅샷',
  [OEM_LEDGER_COST_SOURCE.MASTER]: '마스터',
  [OEM_LEDGER_COST_SOURCE.NONE]: '미등록'
}

/** 지급 상태 */
export const OEM_LEDGER_PAYMENT_STATUS = {
  NONE: 'NONE',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PAID: 'PAID'
} as const

export type OemLedgerPaymentStatus = typeof OEM_LEDGER_PAYMENT_STATUS[keyof typeof OEM_LEDGER_PAYMENT_STATUS]

export const OEM_LEDGER_PAYMENT_STATUS_LABELS: Record<OemLedgerPaymentStatus, string> = {
  [OEM_LEDGER_PAYMENT_STATUS.NONE]: '미요청',
  [OEM_LEDGER_PAYMENT_STATUS.PENDING]: '요청완료',
  [OEM_LEDGER_PAYMENT_STATUS.CONFIRMED]: '확인완료',
  [OEM_LEDGER_PAYMENT_STATUS.PAID]: '지급완료'
}

export const OEM_LEDGER_PAYMENT_STATUS_COLORS: Record<OemLedgerPaymentStatus, string> = {
  [OEM_LEDGER_PAYMENT_STATUS.NONE]: 'status-none',
  [OEM_LEDGER_PAYMENT_STATUS.PENDING]: 'status-pending',
  [OEM_LEDGER_PAYMENT_STATUS.CONFIRMED]: 'status-confirmed',
  [OEM_LEDGER_PAYMENT_STATUS.PAID]: 'status-paid'
}

/** 지급 요청 */
export interface OemLedgerPaymentRequest {
  oemCompanyId: number
  yearMonth: string
  totalAmount: number
  remarks?: string
  paidAmount?: number
  paidDate?: string
}
