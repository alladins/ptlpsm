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
  quantity: number
  unit: string
  unitCost: number
  amount: number
  remarks: string | null
  shipmentNo: string | null
}

/** 원장 응답 */
export interface OemMonthlyLedgerResponse {
  oemCompanyId: number
  oemCompanyName: string | null
  yearMonth: string
  items: OemLedgerItem[]
  totalQuantity: number
  totalAmount: number
  paymentStatus: OemLedgerPaymentStatus
  paymentId: number | null
  paidAmount: number | null
  paidDate: string | null
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
