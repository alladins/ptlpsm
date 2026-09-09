/**
 * 손실/손익 조정 타입
 *
 * @description
 * - SHORTAGE      : 수량부족 손실 (발주 104매 → 현장 실인수 100매)
 * - SPEC_MISMATCH : 스펙오납 손익 (60T 발주 → 50T 납품 + 시공완료)
 *
 * 손실은 리드파워 내부 원가 관리 대상이며 고객 서류·매출에 절대 노출되지 않는다.
 * @created 2026-09-08
 */

/** 손실 유형 */
export type LossType = 'SHORTAGE' | 'SPEC_MISMATCH'

/** 보전(재발송) 방식 */
export type RecoveryType = 'NONE' | 'SEPARATE' | 'MERGED'

/** 보전 진행 상태 */
export type RecoveryStatus = 'NONE' | 'PLANNED' | 'DONE'

/** 정산 상태 */
export type SettlementStatus = 'PENDING' | 'DEDUCTED' | 'WAIVED'

/** 손실 건 상태 */
export type LossStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

/** 손실 등록/수정 요청 */
export interface LossAdjustmentRequest {
  lossType: LossType
  orderId?: number | null
  shipmentId: number
  oemCompanyId?: number | null

  skuId: string
  /** 스펙오납 전용 — 실제 납품된 SKU */
  actualSkuId?: string | null
  quantity: number
  /** 미지정 시 서버가 출하 원가 스냅샷을 사용 */
  unitCost?: number | null
  actualUnitCost?: number | null

  /** 별도발송일 때만 손실에 가산 */
  shippingLossAmount?: number | null
  penaltyAmount?: number | null
  penaltyApplied?: boolean
  applyToOemSettlement?: boolean

  /** 제조사 부담률 0~100 */
  oemBurdenRate?: number | null

  recoveryType?: RecoveryType
  recoveryStatus?: RecoveryStatus
  recoveryPoId?: number | null
  recoveryShipmentId?: number | null

  /** 차감 반영 원장 년월 YYYY-MM (미지정 시 발생월) */
  settlementYearMonth?: string | null

  inventoryAdjusted?: boolean
  /** 부호 포함. 음수면 차감 */
  inventoryAdjustQty?: number | null
  inventoryWarehouseId?: number | null

  occurredDate: string
  confirmedByUserId?: number | null
  reason?: string | null
  remarks?: string | null
  status?: LossStatus
}

/** 손실 응답 */
export interface LossAdjustmentResponse {
  lossId: number
  lossNo: string
  lossType: LossType
  lossTypeName: string

  orderId?: number | null
  deliveryRequestNo?: string | null
  projectName?: string | null
  demandAgency?: string | null

  shipmentId: number
  shipmentNo?: string | null
  shipmentDate?: string | null

  deliveryDoneId?: number | null

  oemCompanyId: number
  oemCompanyName?: string | null

  skuId: string
  skuName?: string | null
  itemName?: string | null
  actualSkuId?: string | null
  actualSkuName?: string | null

  quantity: number
  unit?: string | null
  unitCost: number
  actualUnitCost?: number | null

  originalQty?: number | null
  correctedQty?: number | null
  receiptReissueNeeded: boolean
  receiptReissuedAt?: string | null

  costLossAmount: number
  shippingLossAmount: number
  grossLossAmount: number
  penaltyAmount: number
  penaltyApplied: boolean
  applyToOemSettlement: boolean

  oemBurdenRate: number
  oemBurdenAmount: number
  companyLossAmount: number
  oemDeductionAmount: number

  recoveryType: RecoveryType
  recoveryTypeName: string
  recoveryStatus: RecoveryStatus
  recoveryPoId?: number | null
  recoveryPoNo?: string | null
  recoveryShipmentId?: number | null
  recoveryShipmentNo?: string | null
  recoveryCompletedAt?: string | null

  settlementStatus: SettlementStatus
  settlementStatusName: string
  settlementYearMonth?: string | null
  settledAt?: string | null
  settledBy?: string | null

  inventoryAdjusted: boolean
  inventoryAdjustQty?: number | null
  inventoryWarehouseId?: number | null
  warehouseName?: string | null
  inventoryTransactionId?: number | null

  occurredDate: string
  confirmedByUserId?: number | null
  confirmedByUserName?: string | null
  reason?: string | null
  remarks?: string | null
  status: LossStatus

  createdAt?: string | null
  createdBy?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
}

/** 손실 목록 검색 조건 */
export interface LossSearchRequest {
  startDate?: string | null
  endDate?: string | null
  lossType?: LossType | null
  oemCompanyId?: number | null
  settlementStatus?: SettlementStatus | null
  recoveryStatus?: RecoveryStatus | null
  status?: LossStatus | null
  orderId?: number | null
  shipmentId?: number | null
  settlementYearMonth?: string | null
  keyword?: string | null
  page?: number
  size?: number
}

/**
 * 백엔드 PageResponse 형식
 *
 * ⚠ 현재 페이지 필드명이 `page` 다 (Spring 표준 `number` 가 아님).
 */
export interface LossPageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
  first?: boolean
  last?: boolean
  empty?: boolean
}

/** 월별 손실 집계 */
export interface LossMonthlySummary {
  yearMonth: string
  oemCompanyId?: number | null
  oemCompanyName?: string | null
  lossType: LossType
  lossTypeName: string
  lossCount: number
  costLossAmount: number
  shippingLossAmount: number
  grossLossAmount: number
  oemBurdenAmount: number
  companyLossAmount: number
  penaltyAmount: number
  oemDeductionAmount: number
  pendingCount: number
}

/** 손실 유형 옵션 */
export const LOSS_TYPE_OPTIONS: Array<{ value: LossType; label: string; description: string }> = [
  {
    value: 'SHORTAGE',
    label: '수량부족',
    description: '발주 수량보다 현장 실인수가 적은 경우. 발주서·출하는 그대로 두고 납품률·잔여·기성청구 계산에서만 차감됩니다.'
  },
  {
    value: 'SPEC_MISMATCH',
    label: '스펙오납',
    description: '발주와 다른 규격이 납품·시공된 경우. 매출·서류는 계약 기준을 유지하고 원가만 정정합니다.'
  }
]

/** 보전 방식 옵션 */
export const RECOVERY_TYPE_OPTIONS: Array<{ value: RecoveryType; label: string; description: string }> = [
  { value: 'NONE', label: '보전없음', description: '재발송하지 않습니다.' },
  { value: 'SEPARATE', label: '별도발송', description: '별도 차량으로 발송합니다. 배송비가 손실에 가산됩니다.' },
  { value: 'MERGED', label: '차기출하 합산', description: '다음 출하에 함께 실어 보냅니다. 배송비 손실이 없습니다.' }
]

/** 정산 상태 옵션 */
export const SETTLEMENT_STATUS_OPTIONS: Array<{ value: SettlementStatus; label: string }> = [
  { value: 'PENDING', label: '미정산' },
  { value: 'DEDUCTED', label: '차감반영' },
  { value: 'WAIVED', label: '면제' }
]
